"""Engine tests against a real hass: boundary execution, sync, enable gating."""

from datetime import timedelta

import pytest
from freezegun import freeze_time
from homeassistant.core import HomeAssistant
from homeassistant.util import dt as dt_util
from pytest_homeassistant_custom_component.common import (
    async_fire_time_changed,
    async_mock_service,
)

from custom_components.daily_schedule.const import DOMAIN


async def _setup(hass: HomeAssistant, config_entry, schedule: dict):
    """Add the entry with a pre-seeded schedule and set it up."""
    # The schedule follows HA's local time; pin to UTC so frozen UTC times map
    # directly to schedule hours.
    await hass.config.async_set_time_zone("UTC")

    from custom_components.daily_schedule.const import STORAGE_KEY, STORAGE_VERSION

    hass_storage_key = f"{STORAGE_KEY}.{config_entry.entry_id}"
    # Seed the store before setup so async_load picks it up.
    from homeassistant.helpers.storage import Store

    store = Store(hass, STORAGE_VERSION, hass_storage_key)
    await store.async_save(schedule)

    config_entry.add_to_hass(hass)
    assert await hass.config_entries.async_setup(config_entry.entry_id)
    await hass.async_block_till_done()


@pytest.fixture
def light_calls(hass):
    on = async_mock_service(hass, "light", "turn_on")
    off = async_mock_service(hass, "light", "turn_off")
    return on, off


async def test_startup_sync_applies_current_state(hass, config_entry, light_calls):
    on, off = light_calls
    # Light on from 06:00-09:00; freeze at 07:00 -> should turn on at startup.
    with freeze_time("2024-06-01 07:00:00"):
        await _setup(
            hass,
            config_entry,
            {
                "enabled": True,
                "bars": [
                    {
                        "id": "bar1",
                        "name": "Lights",
                        "type": "light",
                        "base": 0,
                        "targets": ["light.porch"],
                        "segments": [{"start": 6, "end": 9, "state": 1}],
                    }
                ],
            },
        )
        await hass.async_block_till_done()
    assert on, "expected light.turn_on during startup sync at 07:00"
    assert on[-1].data["entity_id"] == ["light.porch"]


async def test_startup_sync_applies_base_when_outside_segment(
    hass, config_entry, light_calls
):
    on, off = light_calls
    with freeze_time("2024-06-01 12:00:00"):
        await _setup(
            hass,
            config_entry,
            {
                "enabled": True,
                "bars": [
                    {
                        "id": "bar1",
                        "name": "Lights",
                        "type": "light",
                        "base": 0,
                        "targets": ["light.porch"],
                        "segments": [{"start": 6, "end": 9, "state": 1}],
                    }
                ],
            },
        )
        await hass.async_block_till_done()
    assert off, "expected light.turn_off (base) during sync at 12:00"


async def test_boundary_crossing_fires_service(hass, config_entry, light_calls):
    on, off = light_calls
    with freeze_time("2024-06-01 05:59:00") as frozen:
        await _setup(
            hass,
            config_entry,
            {
                "enabled": True,
                "bars": [
                    {
                        "id": "bar1",
                        "name": "Lights",
                        "type": "light",
                        "base": 0,
                        "targets": ["light.porch"],
                        "segments": [{"start": 6, "end": 9, "state": 1}],
                    }
                ],
            },
        )
        await hass.async_block_till_done()
        on.clear()

        # Advance past 06:00 -> boundary should fire turn_on.
        frozen.move_to("2024-06-01 06:00:30")
        async_fire_time_changed(hass, dt_util.now())
        await hass.async_block_till_done()

    assert on, "expected turn_on when clock crossed the 06:00 boundary"


async def test_disabled_schedule_does_nothing(hass, config_entry, light_calls):
    on, off = light_calls
    with freeze_time("2024-06-01 07:00:00"):
        await _setup(
            hass,
            config_entry,
            {
                "enabled": False,
                "bars": [
                    {
                        "id": "bar1",
                        "name": "Lights",
                        "type": "light",
                        "base": 0,
                        "targets": ["light.porch"],
                        "segments": [{"start": 6, "end": 9, "state": 1}],
                    }
                ],
            },
        )
        await hass.async_block_till_done()
    assert not on and not off, "disabled schedule must make no service calls"


async def test_disabled_bar_skipped(hass, config_entry, light_calls):
    on, off = light_calls
    with freeze_time("2024-06-01 07:00:00"):
        await _setup(
            hass,
            config_entry,
            {
                "enabled": True,
                "bars": [
                    {
                        "id": "bar1",
                        "name": "Off bar",
                        "type": "light",
                        "base": 0,
                        "enabled": False,
                        "targets": ["light.porch"],
                        "segments": [{"start": 6, "end": 9, "state": 1}],
                    }
                ],
            },
        )
        await hass.async_block_till_done()
    assert not on, "disabled bar must not be synced"


async def test_sync_now_service(hass, config_entry, light_calls):
    on, off = light_calls
    with freeze_time("2024-06-01 07:00:00"):
        await _setup(
            hass,
            config_entry,
            {
                "enabled": True,
                "bars": [
                    {
                        "id": "bar1",
                        "name": "Lights",
                        "type": "light",
                        "base": 0,
                        "targets": ["light.porch"],
                        "segments": [{"start": 6, "end": 9, "state": 1}],
                    }
                ],
            },
        )
        await hass.async_block_till_done()
        on.clear()
        await hass.services.async_call(DOMAIN, "sync_now", {}, blocking=True)
        await hass.async_block_till_done()
    assert on, "sync_now should re-apply the current state"
