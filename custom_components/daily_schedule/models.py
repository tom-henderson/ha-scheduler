"""Data model for Daily Schedule: Schedule -> Bar -> Segment.

These dataclasses are the single source of truth for both persistence
(helpers.storage) and the WebSocket API. Times are floats in "hours past
midnight" (0-24) at 15-minute (0.25h) granularity, matching the mockup.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any
from uuid import uuid4

from .const import (
    HOURS_PER_DAY,
    MAX_SOLAR_OFFSET,
    OFF_STATE,
    SNAP,
    SUN_EVENTS,
    clamp_state_index,
    is_active,
)


def _uid(prefix: str) -> str:
    return f"{prefix}_{uuid4().hex[:8]}"


def snap(value: float) -> float:
    """Snap a time (hours) to the 15-minute grid, clamped to [0, 24]."""
    v = round(float(value) / SNAP) * SNAP
    return max(0.0, min(HOURS_PER_DAY, round(v, 4)))


def snap_offset(value: float) -> float:
    """Snap a solar offset (hours, may be negative) to the 15-min grid, ±MAX."""
    v = round(float(value) / SNAP) * SNAP
    return max(-MAX_SOLAR_OFFSET, min(MAX_SOLAR_OFFSET, round(v, 4)))


def normalize_expr(raw: Any) -> dict[str, Any] | None:
    """Coerce a boundary expression, or None if it isn't a valid solar anchor.

    A valid expression is ``{"event": <sunrise|sunset|dawn|dusk>, "offset": h}``.
    Anything else (including a plain number boundary) yields None, meaning the
    boundary stays an absolute clock time.
    """
    if not isinstance(raw, dict):
        return None
    event = raw.get("event")
    if event not in SUN_EVENTS:
        return None
    return {"event": event, "offset": snap_offset(raw.get("offset", 0.0))}


# Weekdays follow Python's date.weekday(): Monday=0 … Sunday=6, which is also
# what dt_util.now().weekday() returns in the engine.
ALL_DAYS: tuple[int, ...] = (0, 1, 2, 3, 4, 5, 6)


def normalize_days(raw: Any) -> list[int]:
    """Coerce a weekday mask into a sorted, de-duplicated list of ints 0-6.

    A missing mask (``None``) means "every day" — this is what migrates existing
    single-plan bars, which have no ``days`` key. An explicit empty list is kept
    empty (a bar active on no day, i.e. effectively off); the card keeps at least
    one day selected so this only arises from hand-edited configs.
    """
    if raw is None:
        return list(ALL_DAYS)
    days: set[int] = set()
    for d in raw:
        try:
            i = int(d)
        except (TypeError, ValueError):
            continue
        if 0 <= i <= 6:
            days.add(i)
    return sorted(days)


@dataclass
class Segment:
    """A timed override painted on top of a bar's base state."""

    start: float
    end: float
    state: int
    jitter: float = 0.0
    # Per-segment service parameters for richer types (e.g. a climate segment's
    # target temperature). Empty for the simple on/off types. Merged over the
    # type's registry defaults when the engine fires the service call.
    data: dict[str, Any] = field(default_factory=dict)
    # Optional sun-relative anchors for the boundaries (issue #3). When set, the
    # engine resolves the concrete time per day; `start`/`end` then hold the
    # last card-resolved absolute value, used for static layout and conflict
    # detection. None means the boundary is a fixed clock time.
    start_expr: dict[str, Any] | None = None
    end_expr: dict[str, Any] | None = None
    id: str = field(default_factory=lambda: _uid("seg"))

    @classmethod
    def from_dict(cls, data: dict[str, Any], bar_type: str) -> "Segment":
        start = snap(data.get("start", 0))
        end = snap(data.get("end", start + 1))
        if end <= start:
            end = min(HOURS_PER_DAY, start + SNAP)
        raw = data.get("data")
        return cls(
            id=str(data.get("id") or _uid("seg")),
            start=start,
            end=end,
            state=clamp_state_index(bar_type, int(data.get("state", 1))),
            jitter=max(0.0, float(data.get("jitter", 0.0))),
            data=dict(raw) if isinstance(raw, dict) else {},
            start_expr=normalize_expr(data.get("start_expr")),
            end_expr=normalize_expr(data.get("end_expr")),
        )

    def to_dict(self) -> dict[str, Any]:
        out: dict[str, Any] = {
            "id": self.id,
            "start": self.start,
            "end": self.end,
            "state": self.state,
            "jitter": self.jitter,
            "data": dict(self.data),
        }
        # Only serialise solar anchors when present, so plain clock segments keep
        # their compact shape and round-trip unchanged.
        if self.start_expr:
            out["start_expr"] = dict(self.start_expr)
        if self.end_expr:
            out["end_expr"] = dict(self.end_expr)
        return out


@dataclass
class Trigger:
    """A moment on a stateless bar that fires an action (scene/script/etc.)."""

    at: float  # hours past midnight, snapped
    action: dict[str, Any] = field(default_factory=dict)  # {"service", "entity_id"}
    jitter: float = 0.0
    id: str = field(default_factory=lambda: _uid("trg"))

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> "Trigger":
        action = data.get("action")
        return cls(
            id=str(data.get("id") or _uid("trg")),
            at=snap(data.get("at", 12)),
            action=dict(action) if isinstance(action, dict) else {},
            jitter=max(0.0, float(data.get("jitter", 0.0))),
        )

    def to_dict(self) -> dict[str, Any]:
        return {
            "id": self.id,
            "at": self.at,
            "action": dict(self.action),
            "jitter": self.jitter,
        }


@dataclass
class Bar:
    """One timeline: a base state + segment overrides (range), or trigger points
    (stateless — see the bar type's `kind`)."""

    name: str
    type: str
    targets: list[str] = field(default_factory=list)
    base: int = OFF_STATE
    enabled: bool = True
    # Weekdays this bar acts on (Monday=0 … Sunday=6). Defaults to every day, so
    # a bar with no `days` behaves exactly as before (§10 day-types / issue #5).
    days: list[int] = field(default_factory=lambda: list(ALL_DAYS))
    segments: list[Segment] = field(default_factory=list)
    triggers: list[Trigger] = field(default_factory=list)
    id: str = field(default_factory=lambda: _uid("bar"))

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> "Bar":
        bar_type = str(data.get("type", "light"))
        segments = [
            Segment.from_dict(s, bar_type) for s in data.get("segments", [])
        ]
        segments.sort(key=lambda s: s.start)
        triggers = [Trigger.from_dict(t) for t in data.get("triggers", [])]
        triggers.sort(key=lambda t: t.at)
        return cls(
            id=str(data.get("id") or _uid("bar")),
            name=str(data.get("name", "New schedule")),
            type=bar_type,
            targets=[str(t) for t in data.get("targets", [])],
            base=clamp_state_index(bar_type, int(data.get("base", OFF_STATE))),
            enabled=bool(data.get("enabled", True)),
            days=normalize_days(data.get("days")),
            segments=segments,
            triggers=triggers,
        )

    def to_dict(self) -> dict[str, Any]:
        return {
            "id": self.id,
            "name": self.name,
            "type": self.type,
            "targets": list(self.targets),
            "base": self.base,
            "enabled": self.enabled,
            "days": list(self.days),
            "segments": [s.to_dict() for s in self.sorted_segments()],
            "triggers": [t.to_dict() for t in self.sorted_triggers()],
        }

    def active_on(self, weekday: int) -> bool:
        """Whether this bar acts on the given weekday (Monday=0 … Sunday=6)."""
        return weekday in self.days

    def sorted_segments(self) -> list[Segment]:
        return sorted(self.segments, key=lambda s: s.start)

    def sorted_triggers(self) -> list[Trigger]:
        return sorted(self.triggers, key=lambda t: t.at)

    def resolve(self, hour: float) -> int:
        """Effective state index at a time: covering segment else base."""
        for seg in self.sorted_segments():
            if seg.start <= hour < seg.end:
                return seg.state
        return self.base

    def active_intervals(self) -> list[tuple[float, float, int]]:
        """(start, end, state) for every segment whose state is active."""
        return [
            (s.start, s.end, s.state)
            for s in self.sorted_segments()
            if is_active(self.type, s.state)
        ]


@dataclass
class Schedule:
    """The whole config: master enable plus an ordered list of bars."""

    enabled: bool = True
    bars: list[Bar] = field(default_factory=list)

    @classmethod
    def from_dict(cls, data: dict[str, Any] | None) -> "Schedule":
        data = data or {}
        return cls(
            enabled=bool(data.get("enabled", True)),
            bars=[Bar.from_dict(b) for b in data.get("bars", [])],
        )

    def to_dict(self) -> dict[str, Any]:
        return {
            "enabled": self.enabled,
            "bars": [b.to_dict() for b in self.bars],
        }

    def bar(self, bar_id: str) -> Bar | None:
        return next((b for b in self.bars if b.id == bar_id), None)
