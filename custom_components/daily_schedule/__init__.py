"""The Daily Schedule integration."""

from __future__ import annotations

import voluptuous as vol
from homeassistant.config_entries import ConfigEntry
from homeassistant.const import Platform
from homeassistant.core import HomeAssistant, ServiceCall
from homeassistant.helpers import config_validation as cv
from homeassistant.helpers.start import async_at_started

from .const import ATTR_ENTRY_ID, DOMAIN, SERVICE_SYNC_NOW
from .frontend import async_register_card
from .manager import ScheduleManager
from .websocket import async_register_websocket

PLATFORMS: list[Platform] = [Platform.SWITCH]

type ScheduleConfigEntry = ConfigEntry[ScheduleManager]


async def async_setup(hass: HomeAssistant, config: dict) -> bool:
    """Register the global sync_now service once for all entries."""
    hass.data.setdefault(DOMAIN, {})

    async def _handle_sync_now(call: ServiceCall) -> None:
        entry_id = call.data.get(ATTR_ENTRY_ID)
        managers = hass.data[DOMAIN]
        targets = (
            [managers[entry_id]] if entry_id and entry_id in managers
            else list(managers.values())
        )
        for manager in targets:
            await manager.async_sync_now()

    hass.services.async_register(
        DOMAIN,
        SERVICE_SYNC_NOW,
        _handle_sync_now,
        schema=vol.Schema({vol.Optional(ATTR_ENTRY_ID): cv.string}),
    )
    async_register_websocket(hass)
    await async_register_card(hass)
    return True


async def async_setup_entry(
    hass: HomeAssistant, entry: ScheduleConfigEntry
) -> bool:
    """Set up Daily Schedule from a config entry."""
    manager = ScheduleManager(hass, entry)
    await manager.async_load()

    entry.runtime_data = manager
    hass.data.setdefault(DOMAIN, {})[entry.entry_id] = manager

    await hass.config_entries.async_forward_entry_setups(entry, PLATFORMS)

    # Perform the startup state sync once HA has finished starting (§4.2).
    async def _start(_hass: HomeAssistant) -> None:
        await manager.async_start()

    entry.async_on_unload(async_at_started(hass, _start))
    return True


async def async_unload_entry(
    hass: HomeAssistant, entry: ScheduleConfigEntry
) -> bool:
    """Unload a config entry."""
    unloaded = await hass.config_entries.async_unload_platforms(entry, PLATFORMS)
    if unloaded:
        manager: ScheduleManager = entry.runtime_data
        manager.async_shutdown()
        hass.data[DOMAIN].pop(entry.entry_id, None)
    return unloaded
