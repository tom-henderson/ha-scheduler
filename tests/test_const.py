"""Tests for the device-type / state -> service registry."""

import pytest

from custom_components.daily_schedule.const import (
    OFF_STATE,
    TYPE_REGISTRY,
    apply_params,
    is_active,
    is_stateless,
    prune_empty,
    service_for,
    state_count,
    step_should_fire,
    steps_for,
)


# Stateless types (e.g. trigger) hold no state and declare no `states` list.
_STATEFUL_TYPES = [t for t in TYPE_REGISTRY if not is_stateless(t)]


def test_every_stateful_type_has_off_state_first():
    """Index 0 is the off/rest state for every stateful type."""
    for bar_type in _STATEFUL_TYPES:
        defn = TYPE_REGISTRY[bar_type]
        assert defn["states"], f"{bar_type} has no states"
        assert defn["states"][0]["key"] == "off", bar_type
        assert not is_active(bar_type, OFF_STATE), bar_type


@pytest.mark.parametrize("bar_type", _STATEFUL_TYPES)
def test_every_state_maps_to_a_valid_service(bar_type):
    """Each state resolves to a `<domain>.<service>` and merge-able data."""
    for index in range(state_count(bar_type)):
        domain, service, data = service_for(bar_type, index)
        assert domain and service, (bar_type, index)
        assert isinstance(data, dict)


def test_switch_type_registered():
    switch = TYPE_REGISTRY["switch"]
    assert switch["label"] == "Switch"
    assert [s["key"] for s in switch["states"]] == ["off", "on"]


def test_switch_uses_domain_agnostic_turn_on_off():
    # A helper toggle drives both `switch` and `input_boolean` targets, so it
    # resolves to the generic homeassistant services rather than switch.*.
    assert service_for("switch", 0) == ("homeassistant", "turn_off", {})
    assert service_for("switch", 1) == ("homeassistant", "turn_on", {})
    assert is_active("switch", 1)


def test_climate_is_off_on_with_dynamic_mode_params():
    climate = TYPE_REGISTRY["climate"]
    assert [s["key"] for s in climate["states"]] == ["off", "on"]
    assert not is_active("climate", 0)
    assert is_active("climate", 1)
    # Mode, fan and swing options all come from the target entity, not a list.
    schema = {p["key"]: p for p in climate["param_schema"]}
    assert schema["hvac_mode"]["options_attribute"] == "hvac_modes"
    assert schema["fan_mode"]["options_attribute"] == "fan_modes"
    assert schema["swing_mode"]["options_attribute"] == "swing_modes"
    assert schema["fan_mode"]["optional"] is True
    assert schema["swing_mode"]["optional"] is True
    assert schema["temperature"]["kind"] == "number"


def test_climate_on_sets_every_supported_setting():
    # The mode is folded into set_temperature (one fewer IR transmission); fan
    # and swing follow, each fired only when the entity exposes it.
    steps = steps_for("climate", 1)  # on
    assert [(s.domain, s.service) for s in steps] == [
        ("climate", "set_temperature"),
        ("climate", "set_fan_mode"),
        ("climate", "set_swing_mode"),
    ]
    by_service = {s.service: s for s in steps}
    assert "hvac_mode" in by_service["set_temperature"].data
    assert by_service["set_temperature"].require == ()
    assert by_service["set_fan_mode"].require == ("fan_mode",)
    assert by_service["set_swing_mode"].require == ("swing_mode",)
    # Off is a single call with no data.
    assert service_for("climate", 0) == ("climate", "turn_off", {})


def test_step_should_fire_skips_empty_required_params():
    fan_step = next(s for s in steps_for("climate", 1) if s.service == "set_fan_mode")
    assert not step_should_fire(fan_step, {"fan_mode": ""})
    assert not step_should_fire(fan_step, {})
    assert step_should_fire(fan_step, {"fan_mode": "high"})
    # A step with no requirements always fires.
    temp_step = next(s for s in steps_for("climate", 1) if s.service == "set_temperature")
    assert step_should_fire(temp_step, {"temperature": 20})


def test_prune_empty_drops_blank_fields():
    # set_temperature must not send a blank hvac_mode, but keeps 0 / False.
    assert prune_empty({"hvac_mode": "", "temperature": 21}) == {"temperature": 21}
    assert prune_empty({"hvac_mode": "heat", "temperature": 21}) == {
        "hvac_mode": "heat",
        "temperature": 21,
    }
    assert prune_empty({"volume_level": 0}) == {"volume_level": 0}


def test_media_play_requires_a_chosen_media():
    play = next(s for s in steps_for("media", 1) if s.service == "play_media")
    assert play.require == ("media_content_id",)
    assert not step_should_fire(play, {"media_content_id": ""})
    assert step_should_fire(play, {"media_content_id": "radio:x"})


def test_single_service_state_is_one_step():
    steps = steps_for("switch", 1)
    assert len(steps) == 1
    assert (steps[0].domain, steps[0].service, steps[0].data) == (
        "homeassistant",
        "turn_on",
        {},
    )


def test_media_play_is_a_sequence_of_volume_then_play():
    steps = steps_for("media", 1)  # play
    assert [(s.domain, s.service) for s in steps] == [
        ("media_player", "volume_set"),
        ("media_player", "play_media"),
    ]
    # Stopped is a single call.
    stopped = steps_for("media", 0)
    assert len(stopped) == 1
    assert (stopped[0].domain, stopped[0].service) == ("media_player", "media_stop")


def test_apply_params_only_fills_keys_the_step_declares():
    # The volume step takes volume_level; the play step takes the media keys.
    # A segment carrying both must not leak volume into play_media or vice-versa.
    seg = {"volume_level": 0.7, "media_content_id": "spotify:1", "media_title": "X"}
    vol_defaults = {"volume_level": 0.4}
    play_defaults = {"media_content_id": "", "media_content_type": "music"}
    assert apply_params(vol_defaults, seg) == {"volume_level": 0.7}
    assert apply_params(play_defaults, seg) == {
        "media_content_id": "spotify:1",
        "media_content_type": "music",
    }


def test_apply_params_keeps_defaults_when_segment_is_empty():
    assert apply_params({"volume_level": 0.4}, {}) == {"volume_level": 0.4}


def test_trigger_type_is_stateless_with_action_options():
    assert is_stateless("trigger")
    assert not is_stateless("light")
    t = TYPE_REGISTRY["trigger"]
    assert "states" not in t
    assert [a["key"] for a in t["actions"]] == ["scene", "script", "automation"]
    # A stateless type's base clamps harmlessly to 0 (no states to index).
    assert state_count("trigger") == 0
    assert not is_active("trigger", 3)
