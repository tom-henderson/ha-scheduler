"""ScheduleManager: persistence, CRUD, and the bridge to engine + frontend."""

from __future__ import annotations

import logging
from typing import Any

from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers.dispatcher import async_dispatcher_send
from homeassistant.helpers.storage import Store

from .const import (
    SIGNAL_SCHEDULE_UPDATED,
    STORAGE_KEY,
    STORAGE_VERSION,
)
from .engine import ScheduleEngine
from .logic import detect_conflicts
from .models import Bar, Schedule, Segment

_LOGGER = logging.getLogger(__name__)


class ScheduleManager:
    """Single owner of the schedule state for one config entry."""

    def __init__(self, hass: HomeAssistant, entry: ConfigEntry) -> None:
        self.hass = hass
        self.entry = entry
        self._store: Store[dict[str, Any]] = Store(
            hass, STORAGE_VERSION, f"{STORAGE_KEY}.{entry.entry_id}"
        )
        self.schedule = Schedule()
        self.engine = ScheduleEngine(hass, self)

    # -- lifecycle ---------------------------------------------------------

    async def async_load(self) -> None:
        data = await self._store.async_load()
        self.schedule = Schedule.from_dict(data)

    async def async_start(self) -> None:
        await self.engine.async_start()

    @callback
    def async_shutdown(self) -> None:
        self.engine.async_shutdown()

    async def _async_persist_and_refresh(self, *, resync: bool) -> None:
        """Save, recompute the engine's timers, and notify the frontend."""
        await self._store.async_save(self.schedule.to_dict())
        await self.engine.async_refresh(sync=resync)
        async_dispatcher_send(
            self.hass, SIGNAL_SCHEDULE_UPDATED.format(self.entry.entry_id)
        )

    # -- reads -------------------------------------------------------------

    @callback
    def as_frontend_dict(self) -> dict[str, Any]:
        """Schedule plus computed conflicts, for the WebSocket / card."""
        data = self.schedule.to_dict()
        data["conflicts"] = detect_conflicts(self.schedule)
        return data

    # -- schedule-level ----------------------------------------------------

    async def async_set_enabled(self, enabled: bool) -> None:
        self.schedule.enabled = bool(enabled)
        # Re-sync so entities snap to their now-state when (re)enabled.
        await self._async_persist_and_refresh(resync=True)

    async def async_replace_schedule(self, data: dict[str, Any]) -> None:
        """Wholesale replace (used by the card when it saves everything)."""
        self.schedule = Schedule.from_dict(data)
        await self._async_persist_and_refresh(resync=True)

    async def async_sync_now(self) -> None:
        await self.engine.async_sync_now()

    # -- bar CRUD ----------------------------------------------------------

    async def async_add_bar(self, data: dict[str, Any]) -> Bar:
        bar = Bar.from_dict(data)
        self.schedule.bars.append(bar)
        await self._async_persist_and_refresh(resync=True)
        return bar

    async def async_update_bar(self, bar_id: str, data: dict[str, Any]) -> Bar:
        existing = self.schedule.bars.index(self._require_bar(bar_id))
        data = {**data, "id": bar_id}
        bar = Bar.from_dict(data)
        self.schedule.bars[existing] = bar
        await self._async_persist_and_refresh(resync=True)
        return bar

    async def async_delete_bar(self, bar_id: str) -> None:
        self._require_bar(bar_id)
        self.schedule.bars = [b for b in self.schedule.bars if b.id != bar_id]
        await self._async_persist_and_refresh(resync=True)

    async def async_reorder_bars(self, order: list[str]) -> None:
        """Reorder bars to match `order` (a list of bar ids).

        Purely presentational — order does not affect the engine — so no resync.
        Ids not present are ignored; any bars missing from `order` are kept in
        their current relative order at the end, so the list is never lost.
        """
        by_id = {b.id: b for b in self.schedule.bars}
        seen: set[str] = set()
        reordered = []
        for bar_id in order:
            bar = by_id.get(bar_id)
            if bar is not None and bar_id not in seen:
                reordered.append(bar)
                seen.add(bar_id)
        reordered.extend(b for b in self.schedule.bars if b.id not in seen)
        self.schedule.bars = reordered
        await self._async_persist_and_refresh(resync=False)

    async def async_duplicate_bar(self, bar_id: str) -> Bar:
        src = self._require_bar(bar_id)
        clone = Bar.from_dict(
            {
                **src.to_dict(),
                "id": None,
                "name": f"{src.name} copy",
                "segments": [
                    {**s.to_dict(), "id": None} for s in src.sorted_segments()
                ],
            }
        )
        self.schedule.bars.append(clone)
        await self._async_persist_and_refresh(resync=True)
        return clone

    def _require_bar(self, bar_id: str) -> Bar:
        bar = self.schedule.bar(bar_id)
        if bar is None:
            raise KeyError(f"Unknown bar id: {bar_id}")
        return bar
