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
    OFF_STATE,
    SNAP,
    clamp_state_index,
    is_active,
)


def _uid(prefix: str) -> str:
    return f"{prefix}_{uuid4().hex[:8]}"


def snap(value: float) -> float:
    """Snap a time (hours) to the 15-minute grid, clamped to [0, 24]."""
    v = round(float(value) / SNAP) * SNAP
    return max(0.0, min(HOURS_PER_DAY, round(v, 4)))


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
        )

    def to_dict(self) -> dict[str, Any]:
        return {
            "id": self.id,
            "start": self.start,
            "end": self.end,
            "state": self.state,
            "jitter": self.jitter,
            "data": dict(self.data),
        }


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
            "segments": [s.to_dict() for s in self.sorted_segments()],
            "triggers": [t.to_dict() for t in self.sorted_triggers()],
        }

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
