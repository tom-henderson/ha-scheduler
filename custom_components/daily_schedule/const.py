"""Constants and the device-type / state -> service registry for Daily Schedule."""

from __future__ import annotations

from typing import Any, Final, NamedTuple

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
    # A generic helper toggle: a `switch` or `input_boolean` flipped on a
    # schedule, typically to trigger other automations. Same two-state shape as
    # the others, so it is a pure registry addition. Uses the domain-agnostic
    # `homeassistant.turn_on/off` so a single bar can drive `switch` and
    # `input_boolean` targets alike.
    "switch": {
        "label": "Switch",
        "icon": "mdi:toggle-switch",
        "states": [
            {"key": "off", "label": "Off", "service": "homeassistant.turn_off"},
            {"key": "on", "label": "On", "service": "homeassistant.turn_on"},
        ],
    },
    # Climate is the first type whose active states carry parameters. The HVAC
    # mode is the *state* (so it reuses the existing state selector and colours
    # each segment by mode); the target temperature is a per-segment parameter,
    # declared in `param_schema` and stored on the segment's `data`. The engine
    # merges that `data` over each state's registry defaults, so `set_temperature`
    # receives both the mode and the segment's own temperature.
    "climate": {
        "label": "Climate",
        "icon": "mdi:thermostat",
        # Off/On, with the HVAC mode, temperature and fan mode as per-segment
        # parameters. The mode and fan options are read from the *target entity's*
        # own `hvac_modes` / `fan_modes` attributes (`options_attribute`) rather
        # than assumed — different units expose different sets. "On" runs a
        # sequence: set the mode, the temperature, and (if the entity supports it
        # and the user picked one) the fan mode. Steps whose required parameter is
        # empty are skipped (see step_should_fire), so set_fan_mode is only called
        # when a fan mode is chosen.
        "param_schema": [
            {
                "key": "hvac_mode",
                "label": "Mode",
                "kind": "select",
                "options_attribute": "hvac_modes",
                "exclude": ["off"],  # "off" is the bar's Off state, not a mode
            },
            {
                "key": "temperature",
                "label": "Target temperature",
                "kind": "number",
                "min": 7,
                "max": 35,
                "step": 0.5,
                "unit": "°",
                "default": 20,
            },
            {
                "key": "fan_mode",
                "label": "Fan mode",
                "kind": "select",
                "options_attribute": "fan_modes",
                "optional": True,  # skipped when the entity has no fan modes
            },
        ],
        "states": [
            {"key": "off", "label": "Off", "service": "climate.turn_off"},
            {
                "key": "on",
                "label": "On",
                "sequence": [
                    {
                        "service": "climate.set_hvac_mode",
                        "data": {"hvac_mode": ""},
                        "require": ["hvac_mode"],
                    },
                    {
                        "service": "climate.set_temperature",
                        "data": {"temperature": 20},
                    },
                    {
                        "service": "climate.set_fan_mode",
                        "data": {"fan_mode": ""},
                        "require": ["fan_mode"],
                    },
                ],
            },
        ],
    },
    # Media player. The active "Play" state runs a *sequence* of service calls —
    # set the volume, then play the chosen media — rather than a single call.
    # The media source and volume are per-segment parameters (see `param_schema`);
    # `targets` may list several players (a speaker group) with no model change.
    "media": {
        "label": "Media player",
        "icon": "mdi:speaker",
        "param_schema": [
            {
                "key": "media",
                "label": "Media",
                "kind": "media",
                # A media pick writes several flat keys onto the segment's data.
                "keys": ["media_content_id", "media_content_type", "media_title"],
            },
            {
                "key": "volume_level",
                "label": "Volume",
                "kind": "slider",
                "min": 0,
                "max": 1,
                "step": 0.05,
                "default": 0.4,
            },
        ],
        "states": [
            {"key": "off", "label": "Stopped", "service": "media_player.media_stop"},
            {
                "key": "play",
                "label": "Play",
                "color": "#e879c9",
                "sequence": [
                    {
                        "service": "media_player.volume_set",
                        "data": {"volume_level": 0.4},
                    },
                    {
                        "service": "media_player.play_media",
                        "data": {
                            "media_content_id": "",
                            "media_content_type": "music",
                        },
                    },
                ],
            },
        ],
    },
    # A stateless bar: instead of a base + state ranges, it holds trigger points
    # placed on the timeline, each firing an automation, scene or script at its
    # time. It has no on/off state to hold, so it takes no `states` and is
    # excluded from conflict detection. `kind: "stateless"` tells the card to
    # render draggable pins and the engine to fire one-shots (see is_stateless).
    "trigger": {
        "label": "Automation trigger",
        "icon": "mdi:map-marker-radius",
        "kind": "stateless",
        "color": "#cfe84a",
        "actions": [
            {"key": "scene", "label": "Scene", "domain": "scene", "service": "scene.turn_on"},
            {"key": "script", "label": "Script", "domain": "script", "service": "script.turn_on"},
            {
                "key": "automation",
                "label": "Automation",
                "domain": "automation",
                "service": "automation.trigger",
            },
        ],
    },
}

DEFAULT_TYPE: Final = "light"


def type_def(bar_type: str) -> TypeDef:
    """Return the registry definition for a bar type, defaulting to light."""
    return TYPE_REGISTRY.get(bar_type, TYPE_REGISTRY[DEFAULT_TYPE])


def state_count(bar_type: str) -> int:
    """Number of selectable states for a type (0 for stateless types)."""
    return len(type_def(bar_type).get("states", []))


def clamp_state_index(bar_type: str, index: int) -> int:
    """Clamp a state index into the valid range for the type."""
    count = state_count(bar_type)
    if count == 0:  # stateless type — no states to index
        return 0
    return max(0, min(count - 1, index))


def is_active(bar_type: str, state_index: int) -> bool:
    """A state is "active" when it is not the off/rest state (index 0)."""
    return clamp_state_index(bar_type, state_index) != OFF_STATE


def is_stateless(bar_type: str) -> bool:
    """A stateless type fires trigger points instead of holding a state range."""
    return type_def(bar_type).get("kind") == "stateless"


class Step(NamedTuple):
    """One resolved service call for a state.

    `require` names parameter keys that must be present (non-empty) for the step
    to fire — e.g. climate's `set_fan_mode` step is skipped unless a fan mode is
    chosen (see `step_should_fire`).
    """

    domain: str
    service: str
    data: dict[str, Any]
    require: tuple[str, ...] = ()


def steps_for(bar_type: str, state_index: int) -> list[Step]:
    """Resolve the ordered service call(s) for a (type, state index).

    Most states are a single call; a state may instead declare a `sequence`
    (e.g. media: set volume, then play). `data` is the registry-provided service
    data, before per-segment parameters are applied (see `apply_params`).
    """
    state = type_def(bar_type)["states"][clamp_state_index(bar_type, state_index)]
    raw_steps = state["sequence"] if "sequence" in state else [state]
    steps: list[Step] = []
    for step in raw_steps:
        domain, service = step["service"].split(".", 1)
        steps.append(
            Step(domain, service, dict(step.get("data", {})), tuple(step.get("require", ())))
        )
    return steps


def service_for(bar_type: str, state_index: int) -> tuple[str, str, dict[str, Any]]:
    """Resolve the (domain, service, data) for a single-call state.

    Convenience over `steps_for` for the simple types; returns the first step.
    """
    step = steps_for(bar_type, state_index)[0]
    return step.domain, step.service, step.data


def apply_params(
    defaults: dict[str, Any], seg_data: dict[str, Any]
) -> dict[str, Any]:
    """Merge a segment's parameters over a step's registry defaults.

    A step only picks up the parameters it declares (keys present in `defaults`),
    so a segment's `volume_level` never leaks into `play_media` and vice-versa.
    """
    return {key: seg_data.get(key, value) for key, value in defaults.items()}


def step_should_fire(step: Step, data: dict[str, Any]) -> bool:
    """Whether a step runs: all its required params must be present and non-empty.

    Lets an optional call (e.g. `set_fan_mode`) be omitted when the user hasn't
    chosen a value or the entity doesn't support it.
    """
    return all(data.get(key) not in (None, "") for key in step.require)
