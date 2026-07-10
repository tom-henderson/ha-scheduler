"""Tests for the device-type / state -> service registry."""

import pytest

from custom_components.daily_schedule.const import (
    OFF_STATE,
    TYPE_REGISTRY,
    is_active,
    service_for,
    state_count,
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
