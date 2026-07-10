"""Tests for the device-type / state -> service registry."""

import pytest

from custom_components.daily_schedule.const import (
    OFF_STATE,
    TYPE_REGISTRY,
    apply_params,
    is_active,
    service_for,
    state_count,
    steps_for,
)


def test_every_type_has_off_state_first():
    """Index 0 is the off/rest state for every registered type."""
    for bar_type, defn in TYPE_REGISTRY.items():
        assert defn["states"], f"{bar_type} has no states"
        assert defn["states"][0]["key"] == "off", bar_type
        assert not is_active(bar_type, OFF_STATE), bar_type


@pytest.mark.parametrize("bar_type", list(TYPE_REGISTRY))
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


def test_climate_states_are_modes():
    climate = TYPE_REGISTRY["climate"]
    assert [s["key"] for s in climate["states"]] == ["off", "heat", "cool", "auto"]
    # Off is index 0 / rest; the three modes are active.
    assert not is_active("climate", 0)
    for i in (1, 2, 3):
        assert is_active("climate", i)


def test_climate_declares_a_temperature_param():
    schema = TYPE_REGISTRY["climate"]["param_schema"]
    temp = next(p for p in schema if p["key"] == "temperature")
    assert temp["kind"] == "number"
    assert temp["min"] < temp["max"]


def test_service_for_climate_carries_mode_and_default_temp():
    # Each mode maps to set_temperature with its hvac_mode + a default temp; the
    # engine later merges the segment's own temperature over this default.
    domain, service, data = service_for("climate", 1)  # heat
    assert (domain, service) == ("climate", "set_temperature")
    assert data["hvac_mode"] == "heat"
    assert "temperature" in data
    # Off turns the unit off and takes no data.
    assert service_for("climate", 0) == ("climate", "turn_off", {})


def test_single_service_state_is_one_step():
    assert steps_for("switch", 1) == [("homeassistant", "turn_on", {})]
    assert steps_for("climate", 1)[0][:2] == ("climate", "set_temperature")
    assert len(steps_for("climate", 1)) == 1


def test_media_play_is_a_sequence_of_volume_then_play():
    steps = steps_for("media", 1)  # play
    assert [(d, s) for d, s, _ in steps] == [
        ("media_player", "volume_set"),
        ("media_player", "play_media"),
    ]
    # Stopped is a single call.
    assert steps_for("media", 0) == [("media_player", "media_stop", {})]


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
