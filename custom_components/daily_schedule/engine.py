"""The scheduling engine — boundary execution, startup sync, jitter, gating.

Wires the pure logic in logic.py to Home Assistant timers and service calls.
"""

from __future__ import annotations

import logging
import random
from datetime import datetime, timedelta
from typing import TYPE_CHECKING

from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers.event import (
    async_track_point_in_time,
    async_track_time_change,
)
from homeassistant.util import dt as dt_util

from .const import service_for
from .logic import (
    ChangePoint,
    daily_changepoints,
    jittered_segments,
    resolve_from_plan,
)
from .models import Bar

if TYPE_CHECKING:
    from .manager import ScheduleManager

_LOGGER = logging.getLogger(__name__)


class ScheduleEngine:
    """Owns the timers that drive entities across the day."""

    def __init__(self, hass: HomeAssistant, manager: "ScheduleManager") -> None:
        self.hass = hass
        self.manager = manager
        self._rng = random.Random()
        self._boundary_unsubs: list[callable] = []
        self._daily_unsub: callable | None = None
        # Current day's jittered plan per bar id — the source of truth for both
        # scheduled boundaries and "resolve now" so they never disagree.
        self._plans: dict[str, list[ChangePoint]] = {}

    @property
    def _schedule(self):
        return self.manager.schedule

    # -- lifecycle ---------------------------------------------------------

    async def async_start(self) -> None:
        """Startup: build today's plan, schedule boundaries, sync current state."""
        self._daily_unsub = async_track_time_change(
            self.hass, self._handle_daily_rebuild, hour=0, minute=0, second=0
        )
        await self.async_refresh(sync=True)

    async def async_refresh(self, *, sync: bool) -> None:
        """Recompute plans and timers after a config change (and optionally sync)."""
        self._cancel_boundaries()
        self._rebuild_plans()
        if not self._schedule.enabled:
            return
        self._schedule_boundaries()
        if sync:
            await self.async_sync_now()

    @callback
    def async_shutdown(self) -> None:
        """Cancel every timer. Called on unload."""
        self._cancel_boundaries()
        if self._daily_unsub is not None:
            self._daily_unsub()
            self._daily_unsub = None

    # -- planning ----------------------------------------------------------

    def _rebuild_plans(self) -> None:
        """Roll jitter for the day and cache the resulting plan per enabled bar."""
        self._plans = {}
        for bar in self._schedule.bars:
            if not bar.enabled:
                continue
            intervals = jittered_segments(bar, self._rng)
            self._plans[bar.id] = daily_changepoints(bar, intervals)

    def _schedule_boundaries(self) -> None:
        now = dt_util.now()
        day_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        for bar in self._schedule.bars:
            plan = self._plans.get(bar.id)
            if not plan:
                continue
            for point in plan:
                when = day_start + timedelta(hours=point.hour)
                if when <= now:
                    continue
                self._boundary_unsubs.append(
                    async_track_point_in_time(
                        self.hass, self._make_boundary_cb(bar, point.state), when
                    )
                )

    def _cancel_boundaries(self) -> None:
        for unsub in self._boundary_unsubs:
            unsub()
        self._boundary_unsubs = []

    # -- execution ---------------------------------------------------------

    def _make_boundary_cb(self, bar: Bar, state: int):
        @callback
        def _fire(_now: datetime) -> None:
            if not self._schedule.enabled or not bar.enabled:
                return
            self.hass.async_create_task(self._apply(bar, state))

        return _fire

    async def async_sync_now(self) -> None:
        """Set every live bar's targets to the state effective right now (§4.2/4.3)."""
        if not self._schedule.enabled:
            return
        now_hour = _now_hour()
        for bar in self._schedule.bars:
            if not bar.enabled:
                continue
            plan = self._plans.get(bar.id)
            if not plan:
                continue
            state = resolve_from_plan(plan, now_hour)
            if state is None:
                state = bar.base
            await self._apply(bar, state)

    async def _apply(self, bar: Bar, state: int) -> None:
        if not bar.targets:
            return
        domain, service, data = service_for(bar.type, state)
        try:
            await self.hass.services.async_call(
                domain,
                service,
                {"entity_id": list(bar.targets), **data},
                blocking=False,
            )
        except Exception:  # noqa: BLE001 - never let one bar break the schedule
            _LOGGER.exception(
                "Daily Schedule: failed to apply %s.%s to %s",
                domain,
                service,
                bar.targets,
            )

    # -- daily rebuild -----------------------------------------------------

    async def _handle_daily_rebuild(self, _now: datetime) -> None:
        """At midnight, re-roll jitter and reschedule the fresh day."""
        await self.async_refresh(sync=True)


def _now_hour() -> float:
    now = dt_util.now()
    return now.hour + now.minute / 60 + now.second / 3600
