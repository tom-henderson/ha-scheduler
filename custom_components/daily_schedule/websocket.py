"""WebSocket API for the Lovelace card to read and edit the schedule."""

from __future__ import annotations

from typing import Any

import voluptuous as vol
from homeassistant.components import websocket_api
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers.dispatcher import async_dispatcher_connect

from .const import DOMAIN, SIGNAL_SCHEDULE_UPDATED, TYPE_REGISTRY
from .manager import ScheduleManager

_ENTRY = vol.Required("entry_id")


@callback
def async_register_websocket(hass: HomeAssistant) -> None:
    """Register all WebSocket commands (idempotent per hass)."""
    for handler in (
        ws_list_entries,
        ws_get,
        ws_subscribe,
        ws_set_enabled,
        ws_replace,
        ws_add_bar,
        ws_update_bar,
        ws_delete_bar,
        ws_duplicate_bar,
        ws_reorder_bars,
        ws_sync_now,
    ):
        websocket_api.async_register_command(hass, handler)


def _manager(hass: HomeAssistant, entry_id: str) -> ScheduleManager | None:
    return hass.data.get(DOMAIN, {}).get(entry_id)


def _with_manager(func):
    """Resolve the manager from entry_id or send a not-found error."""

    async def wrapper(hass, connection, msg):
        manager = _manager(hass, msg["entry_id"])
        if manager is None:
            connection.send_error(
                msg["id"], "not_found", f"Unknown entry_id: {msg['entry_id']}"
            )
            return
        await func(hass, connection, msg, manager)

    return wrapper


# -- reads -------------------------------------------------------------------


@websocket_api.websocket_command({vol.Required("type"): f"{DOMAIN}/list_entries"})
@callback
def ws_list_entries(hass, connection, msg) -> None:
    """List loaded Daily Schedule entries (for the card's entity picker)."""
    managers: dict[str, ScheduleManager] = hass.data.get(DOMAIN, {})
    connection.send_result(
        msg["id"],
        {
            "entries": [
                {"entry_id": eid, "title": m.entry.title}
                for eid, m in managers.items()
            ],
            "types": TYPE_REGISTRY,
        },
    )


@websocket_api.websocket_command(
    {vol.Required("type"): f"{DOMAIN}/get", _ENTRY: str}
)
@websocket_api.async_response
@_with_manager
async def ws_get(hass, connection, msg, manager: ScheduleManager) -> None:
    connection.send_result(
        msg["id"], {**manager.as_frontend_dict(), "types": TYPE_REGISTRY}
    )


@websocket_api.websocket_command(
    {vol.Required("type"): f"{DOMAIN}/subscribe", _ENTRY: str}
)
@callback
def ws_subscribe(hass, connection, msg) -> None:
    """Push the schedule to the card whenever it changes."""
    entry_id = msg["entry_id"]
    manager = _manager(hass, entry_id)
    if manager is None:
        connection.send_error(msg["id"], "not_found", f"Unknown entry_id: {entry_id}")
        return

    @callback
    def _forward() -> None:
        connection.send_message(
            websocket_api.event_message(msg["id"], manager.as_frontend_dict())
        )

    connection.subscriptions[msg["id"]] = async_dispatcher_connect(
        hass, SIGNAL_SCHEDULE_UPDATED.format(entry_id), _forward
    )
    connection.send_result(msg["id"])
    _forward()


# -- writes ------------------------------------------------------------------


@websocket_api.websocket_command(
    {
        vol.Required("type"): f"{DOMAIN}/set_enabled",
        _ENTRY: str,
        vol.Required("enabled"): bool,
    }
)
@websocket_api.async_response
@_with_manager
async def ws_set_enabled(hass, connection, msg, manager: ScheduleManager) -> None:
    await manager.async_set_enabled(msg["enabled"])
    connection.send_result(msg["id"], manager.as_frontend_dict())


@websocket_api.websocket_command(
    {
        vol.Required("type"): f"{DOMAIN}/replace",
        _ENTRY: str,
        vol.Required("schedule"): dict,
    }
)
@websocket_api.async_response
@_with_manager
async def ws_replace(hass, connection, msg, manager: ScheduleManager) -> None:
    await manager.async_replace_schedule(msg["schedule"])
    connection.send_result(msg["id"], manager.as_frontend_dict())


@websocket_api.websocket_command(
    {
        vol.Required("type"): f"{DOMAIN}/add_bar",
        _ENTRY: str,
        vol.Required("bar"): dict,
    }
)
@websocket_api.async_response
@_with_manager
async def ws_add_bar(hass, connection, msg, manager: ScheduleManager) -> None:
    bar = await manager.async_add_bar(msg["bar"])
    connection.send_result(
        msg["id"], {"bar_id": bar.id, **manager.as_frontend_dict()}
    )


@websocket_api.websocket_command(
    {
        vol.Required("type"): f"{DOMAIN}/update_bar",
        _ENTRY: str,
        vol.Required("bar_id"): str,
        vol.Required("bar"): dict,
    }
)
@websocket_api.async_response
@_with_manager
async def ws_update_bar(hass, connection, msg, manager: ScheduleManager) -> None:
    try:
        await manager.async_update_bar(msg["bar_id"], msg["bar"])
    except KeyError as err:
        connection.send_error(msg["id"], "not_found", str(err))
        return
    connection.send_result(msg["id"], manager.as_frontend_dict())


@websocket_api.websocket_command(
    {
        vol.Required("type"): f"{DOMAIN}/delete_bar",
        _ENTRY: str,
        vol.Required("bar_id"): str,
    }
)
@websocket_api.async_response
@_with_manager
async def ws_delete_bar(hass, connection, msg, manager: ScheduleManager) -> None:
    try:
        await manager.async_delete_bar(msg["bar_id"])
    except KeyError as err:
        connection.send_error(msg["id"], "not_found", str(err))
        return
    connection.send_result(msg["id"], manager.as_frontend_dict())


@websocket_api.websocket_command(
    {
        vol.Required("type"): f"{DOMAIN}/duplicate_bar",
        _ENTRY: str,
        vol.Required("bar_id"): str,
    }
)
@websocket_api.async_response
@_with_manager
async def ws_duplicate_bar(hass, connection, msg, manager: ScheduleManager) -> None:
    try:
        bar = await manager.async_duplicate_bar(msg["bar_id"])
    except KeyError as err:
        connection.send_error(msg["id"], "not_found", str(err))
        return
    connection.send_result(
        msg["id"], {"bar_id": bar.id, **manager.as_frontend_dict()}
    )


@websocket_api.websocket_command(
    {
        vol.Required("type"): f"{DOMAIN}/reorder_bars",
        _ENTRY: str,
        vol.Required("order"): [str],
    }
)
@websocket_api.async_response
@_with_manager
async def ws_reorder_bars(hass, connection, msg, manager: ScheduleManager) -> None:
    await manager.async_reorder_bars(msg["order"])
    connection.send_result(msg["id"], manager.as_frontend_dict())


@websocket_api.websocket_command(
    {vol.Required("type"): f"{DOMAIN}/sync_now", _ENTRY: str}
)
@websocket_api.async_response
@_with_manager
async def ws_sync_now(hass, connection, msg, manager: ScheduleManager) -> None:
    await manager.async_sync_now()
    connection.send_result(msg["id"])
