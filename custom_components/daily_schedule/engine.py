"""The scheduling engine — boundary execution, startup sync, jitter, gating.

Wires the pure logic in logic.py to Home Assistant timers and service calls.
"""

from __future__ import annotations

import logging
import random
from datetime import datetime, timedelta
from typing import TYPE_CHECKING, Any

from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers.event import (
    async_track_point_in_time,
    async_track_time_change,
)
from homeassistant.util import dt as dt_util

from .const import apply_params, is_stateless, step_should_fire, steps_for
from .logic import (
    ChangePoint,
    cell_at,
    daily_changepoints,
    jittered_segments,
    jittered_trigger_at,
)
from .models import Bar, Trigger

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
        self._schedule_triggers()
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
            if not bar.enabled or is_stateless(bar.type):
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
                        self.hass,
                        self._make_boundary_cb(bar, point.state, point.data),
                        when,
                    )
                )

    def _schedule_triggers(self) -> None:
        """Schedule a one-shot for each future trigger on a stateless bar.

        Unlike range bars there is no startup sync — a momentary trigger whose
        time has already passed today does not fire retroactively; only the
        remaining triggers for the day are scheduled. Jitter is rolled here,
        once per rebuild.
        """
        now = dt_util.now()
        day_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        for bar in self._schedule.bars:
            if not bar.enabled or not is_stateless(bar.type):
                continue
            for trigger in bar.sorted_triggers():
                if not trigger.action:
                    continue
                when = day_start + timedelta(
                    hours=jittered_trigger_at(trigger, self._rng)
                )
                if when <= now:
                    continue
                self._boundary_unsubs.append(
                    async_track_point_in_time(
                        self.hass, self._make_trigger_cb(bar, trigger), when
                    )
                )

    def _cancel_boundaries(self) -> None:
        for unsub in self._boundary_unsubs:
            unsub()
        self._boundary_unsubs = []

    # -- execution ---------------------------------------------------------

    def _make_boundary_cb(self, bar: Bar, state: int, data: dict[str, Any]):
        @callback
        def _fire(_now: datetime) -> None:
            if not self._schedule.enabled or not bar.enabled:
                return
            self.hass.async_create_task(self._apply(bar, state, data))

        return _fire

    def _make_trigger_cb(self, bar: Bar, trigger: Trigger):
        @callback
        def _fire(_now: datetime) -> None:
            if not self._schedule.enabled or not bar.enabled:
                return
            self.hass.async_create_task(self._fire_action(bar, trigger))

        return _fire

    async def async_sync_now(self) -> None:
        """Set every live bar's targets to the state effective right now (§4.2/4.3)."""
        if not self._schedule.enabled:
            return
        now_hour = _now_hour()
        for bar in self._schedule.bars:
            # Stateless bars fire momentary triggers; there is no state to sync.
            if not bar.enabled or is_stateless(bar.type):
                continue
            plan = self._plans.get(bar.id)
            if not plan:
                continue
            point = cell_at(plan, now_hour)
            state, seg_data = (point.state, point.data) if point else (bar.base, {})
            await self._apply(bar, state, seg_data)

    async def _apply(self, bar: Bar, state: int, seg_data: dict[str, Any]) -> None:
        if not bar.targets:
            return
        # A state may be a single call or an ordered sequence (e.g. media: set
        # volume, then play). Each step merges the segment's own parameters over
        # its registry defaults; a step whose required parameter is empty (e.g.
        # climate's fan mode when none was chosen) is skipped.
        for step in steps_for(bar.type, state):
            data = apply_params(step.data, seg_data or {})
            if not step_should_fire(step, data):
                continue
            try:
                await self.hass.services.async_call(
                    step.domain,
                    step.service,
                    {"entity_id": list(bar.targets), **data},
                    blocking=False,
                )
            except Exception:  # noqa: BLE001 - never let one bar break the schedule
                _LOGGER.exception(
                    "Daily Schedule: failed to apply %s.%s to %s",
                    step.domain,
                    step.service,
                    bar.targets,
                )

    async def _fire_action(self, bar: Bar, trigger: Trigger) -> None:
        """Fire a stateless trigger's action (e.g. scene.turn_on scene.wake)."""
        action = trigger.action
        service = action.get("service")
        entity_id = action.get("entity_id")
        if not service or not entity_id:
            return
        domain, service_name = service.split(".", 1)
        try:
            await self.hass.services.async_call(
                domain, service_name, {"entity_id": entity_id}, blocking=False
            )
        except Exception:  # noqa: BLE001 - never let one bar break the schedule
            _LOGGER.exception(
                "Daily Schedule: failed to fire %s for %s", service, entity_id
            )

    # -- daily rebuild -----------------------------------------------------

    async def _handle_daily_rebuild(self, _now: datetime) -> None:
        """At midnight, re-roll jitter and reschedule the fresh day."""
        await self.async_refresh(sync=True)


def _now_hour() -> float:
    now = dt_util.now()
    return now.hour + now.minute / 60 + now.second / 3600
