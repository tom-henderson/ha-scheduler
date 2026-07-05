"""Constants and the device-type / state -> service registry for Daily Schedule."""

from __future__ import annotations

from typing import Any, Final

DOMAIN: Final = "daily_schedule"

# Persistent storage.
STORAGE_VERSION: Final = 1
STORAGE_KEY: Final = DOMAIN

# Runtime data stored on the config entry (entry.runtime_data).
DATA_MANAGER: Final = "manager"

# Scheduling granularity: times snap to 15 minutes (0.25h). The whole model is
# expressed in "hours past midnight" as floats, matching the mockup.
SNAP: Final = 0.25
HOURS_PER_DAY: Final = 24.0

# Index 0 of every type's state list is the natural "off" / rest state. It is the
# default `base`, and is excluded from conflict / "active" checks.
OFF_STATE: Final = 0

# Services / signals.
SERVICE_SYNC_NOW: Final = "sync_now"
ATTR_ENTRY_ID: Final = "entry_id"

SIGNAL_SCHEDULE_UPDATED: Final = f"{DOMAIN}_schedule_updated_{{}}"

# ---------------------------------------------------------------------------
# Device-type registry.
#
# Each type declares an ordered list of states. Index 0 is the off/rest state.
# Every state maps to a Home Assistant service call, expressed data-drivenly as
# "<domain>.<service>" plus optional service data. The scheduling engine reads
# this table to decide which call to make when the clock crosses a boundary, so
# new device families can be added here without touching the engine or the card.
#
# `service` may be null for the off state of types that share a turn_off call,
# but here every state has an explicit call for clarity.
# ---------------------------------------------------------------------------

TypeState = dict[str, Any]
TypeDef = dict[str, Any]

TYPE_REGISTRY: Final[dict[str, TypeDef]] = {
    "light": {
        "label": "Light",
        "icon": "mdi:lightbulb",
        "states": [
            {"key": "off", "label": "Off", "service": "light.turn_off"},
            {"key": "on", "label": "On", "service": "light.turn_on"},
        ],
    },
    "blind": {
        "label": "Blind",
        "icon": "mdi:blinds",
        "states": [
            {"key": "off", "label": "Closed", "service": "cover.close_cover"},
            {"key": "on", "label": "Open", "service": "cover.open_cover"},
        ],
    },
    "water": {
        "label": "Water",
        "icon": "mdi:water",
        "states": [
            {"key": "off", "label": "Off", "service": "switch.turn_off"},
            {"key": "on", "label": "Watering", "service": "switch.turn_on"},
        ],
    },
    "fan": {
        "label": "Fan",
        "icon": "mdi:fan",
        "states": [
            {"key": "off", "label": "Off", "service": "fan.turn_off"},
            {
                "key": "low",
                "label": "Low",
                "service": "fan.set_percentage",
                "data": {"percentage": 33},
            },
            {
                "key": "med",
                "label": "Med",
                "service": "fan.set_percentage",
                "data": {"percentage": 66},
            },
            {
                "key": "high",
                "label": "High",
                "service": "fan.set_percentage",
                "data": {"percentage": 100},
            },
        ],
    },
}

DEFAULT_TYPE: Final = "light"


def type_def(bar_type: str) -> TypeDef:
    """Return the registry definition for a bar type, defaulting to light."""
    return TYPE_REGISTRY.get(bar_type, TYPE_REGISTRY[DEFAULT_TYPE])


def state_count(bar_type: str) -> int:
    """Number of selectable states for a type."""
    return len(type_def(bar_type)["states"])


def clamp_state_index(bar_type: str, index: int) -> int:
    """Clamp a state index into the valid range for the type."""
    return max(0, min(state_count(bar_type) - 1, index))


def is_active(bar_type: str, state_index: int) -> bool:
    """A state is "active" when it is not the off/rest state (index 0)."""
    return clamp_state_index(bar_type, state_index) != OFF_STATE


def service_for(bar_type: str, state_index: int) -> tuple[str, str, dict[str, Any]]:
    """Resolve (domain, service, data) for a (type, state index).

    Raises KeyError only if the registry entry is malformed.
    """
    state = type_def(bar_type)["states"][clamp_state_index(bar_type, state_index)]
    domain, service = state["service"].split(".", 1)
    return domain, service, dict(state.get("data", {}))
