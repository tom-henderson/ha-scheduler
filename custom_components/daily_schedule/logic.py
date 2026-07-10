"""Pure scheduling logic — no Home Assistant imports.

Everything here is deterministic given its inputs (jitter takes an injected RNG),
so it can be unit-tested in isolation. The engine (engine.py) wires these
functions to HA timers and service calls.
"""

from __future__ import annotations

import random
from typing import Any, NamedTuple

from .const import HOURS_PER_DAY, SNAP, is_active, is_stateless
from .models import Bar, Schedule, Trigger


class Interval(NamedTuple):
    """A concrete, possibly jittered, active-or-not span within a day."""

    start: float
    end: float
    state: int
    data: dict[str, Any] = {}


class ChangePoint(NamedTuple):
    """A transition: from `hour` onward (until the next point) state applies.

    `data` carries the covering segment's per-segment parameters (e.g. a climate
    temperature); it is `{}` for the base region and the simple on/off types.
    """

    hour: float
    state: int
    data: dict[str, Any] = {}


def jittered_segments(bar: Bar, rng: random.Random) -> list[Interval]:
    """Apply per-segment daily jitter, clamped so segments never reorder/overlap.

    Each boundary is randomised by up to ±jitter but clamped to its *original*
    neighbouring boundary, which guarantees adjacent segments cannot cross even
    if both jitter toward each other (§4.5 / §9.6). Rolled once per call — the
    engine calls this once per daily rebuild.
    """
    segs = bar.sorted_segments()
    out: list[Interval] = []
    for i, seg in enumerate(segs):
        prev_end = segs[i - 1].end if i > 0 else 0.0
        next_start = segs[i + 1].start if i < len(segs) - 1 else HOURS_PER_DAY
        j = seg.jitter
        start = seg.start + (rng.uniform(-j, j) if j else 0.0)
        end = seg.end + (rng.uniform(-j, j) if j else 0.0)
        # A boundary may not cross its original neighbour boundary, nor its own
        # opposite boundary.
        start = max(prev_end, min(start, seg.end))
        end = min(next_start, max(end, seg.start))
        if end - start < SNAP:  # jitter collapsed the span — fall back to exact
            start, end = seg.start, seg.end
        out.append(Interval(round(start, 6), round(end, 6), seg.state, seg.data))
    return out


def daily_changepoints(bar: Bar, intervals: list[Interval]) -> list[ChangePoint]:
    """Collapse base + (jittered) segments into ordered state transitions.

    Returns change-points covering [0, 24). The first is always at hour 0 (the
    state effective at midnight). Consecutive equal states are merged so we only
    schedule real transitions.
    """
    bounds = {0.0, HOURS_PER_DAY}
    for iv in intervals:
        bounds.add(iv.start)
        bounds.add(iv.end)
    ordered = sorted(b for b in bounds if 0.0 <= b < HOURS_PER_DAY)

    def resolve(hour: float) -> tuple[int, dict[str, Any]]:
        for iv in intervals:
            if iv.start <= hour < iv.end:
                return iv.state, iv.data
        return bar.base, {}

    points: list[ChangePoint] = []
    for hour in ordered:
        state, data = resolve(hour)
        # Split on either the state OR its parameters changing, so two adjacent
        # segments with the same state but different data (e.g. Heat 20° then
        # Heat 22°) still produce a real transition.
        if not points or (points[-1].state, points[-1].data) != (state, data):
            points.append(ChangePoint(round(hour, 6), state, data))
    return points


def cell_at(plan: list[ChangePoint], hour: float) -> ChangePoint | None:
    """The change-point in effect at `hour` (the last one at/before it)."""
    current: ChangePoint | None = None
    for point in plan:
        if point.hour <= hour:
            current = point
        else:
            break
    return current


def resolve_from_plan(plan: list[ChangePoint], hour: float) -> int | None:
    """State effective at `hour` given a day plan (last change-point at/before)."""
    point = cell_at(plan, hour)
    return point.state if point is not None else None


def jittered_trigger_at(trigger: Trigger, rng: random.Random) -> float:
    """A trigger's fire time for the day, jittered by ±jitter, clamped to [0, 24)."""
    j = trigger.jitter
    at = trigger.at + (rng.uniform(-j, j) if j else 0.0)
    return round(max(0.0, min(HOURS_PER_DAY - SNAP, at)), 6)


def detect_conflicts(schedule: Schedule) -> dict[str, list[str]]:
    """Map each bar id -> names of enabled bars it conflicts with.

    Two enabled bars conflict when they share a target entity and their *active*
    segments overlap in time. Uses the un-jittered segments so the warning is
    stable and deterministic. Passive only — the engine never resolves these.

    Stateless (trigger) bars hold no state and are excluded — two triggers may
    share a moment harmlessly.
    """
    result: dict[str, list[str]] = {b.id: [] for b in schedule.bars}
    if not schedule.enabled:
        return result

    bars = [b for b in schedule.bars if b.enabled and not is_stateless(b.type)]
    for i in range(len(bars)):
        for k in range(i + 1, len(bars)):
            a, b = bars[i], bars[k]
            if not set(a.targets) & set(b.targets):
                continue
            if _active_overlap(a, b):
                result[a.id].append(b.name)
                result[b.id].append(a.name)
    return result


def _active_overlap(a: Bar, b: Bar) -> bool:
    a_active = a.active_intervals()
    b_active = b.active_intervals()
    for a_start, a_end, _ in a_active:
        for b_start, b_end, _ in b_active:
            if a_start < b_end and b_start < a_end:
                return True
    return False
