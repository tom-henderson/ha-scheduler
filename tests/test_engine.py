"""Engine tests against a real hass: boundary execution, sync, enable gating."""

from datetime import datetime, timezone
from unittest.mock import patch

import pytest
from freezegun import freeze_time
from homeassistant.core import HomeAssistant
from homeassistant.util import dt as dt_util
from pytest_homeassistant_custom_component.common import (
    async_fire_time_changed,
    async_mock_service,
)

from custom_components.daily_schedule.const import DOMAIN


def _fake_sun(times: dict[str, tuple[int, int]]):
    """A stand-in for get_astral_event_date returning fixed UTC times per event.

    `times` maps an event name -> (hour, minute); a missing event returns None
    (the event doesn't occur that day).
    """

    def _resolve(_hass, event, day):
        hm = times.get(event)
        if hm is None:
            return None
        return datetime(day.year, day.month, day.day, hm[0], hm[1], tzinfo=timezone.utc)

    return _resolve


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


_SUN = "custom_components.daily_schedule.engine.get_astral_event_date"


async def test_solar_boundary_resolves_and_syncs(hass, config_entry, light_calls):
    on, off = light_calls
    # Light On from sunset -> 23:00. Sunset today is 18:00; freeze at 19:00.
    with freeze_time("2024-06-01 19:00:00"), patch(_SUN, _fake_sun({"sunset": (18, 0)})):
        await _setup(
            hass,
            config_entry,
            {
                "enabled": True,
                "bars": [
                    {
                        "id": "bar1",
                        "name": "Porch",
                        "type": "light",
                        "base": 0,
                        "targets": ["light.porch"],
                        "segments": [
                            {
                                "start": 18,
                                "end": 23,
                                "state": 1,
                                "start_expr": {"event": "sunset", "offset": 0},
                            }
                        ],
                    }
                ],
            },
        )
        await hass.async_block_till_done()
    assert on, "expected light.turn_on: 19:00 is within sunset(18:00)-23:00"


async def test_solar_boundary_with_offset(hass, config_entry, light_calls):
    on, off = light_calls
    # On from sunset-30m. Sunset 18:00 -> resolves 17:30. Freeze at 17:40 -> on.
    with freeze_time("2024-06-01 17:40:00"), patch(_SUN, _fake_sun({"sunset": (18, 0)})):
        await _setup(
            hass,
            config_entry,
            {
                "enabled": True,
                "bars": [
                    {
                        "id": "bar1",
                        "name": "Porch",
                        "type": "light",
                        "base": 0,
                        "targets": ["light.porch"],
                        "segments": [
                            {
                                "start": 17.5,
                                "end": 23,
                                "state": 1,
                                "start_expr": {"event": "sunset", "offset": -0.5},
                            }
                        ],
                    }
                ],
            },
        )
        await hass.async_block_till_done()
    assert on, "expected on: 17:40 is after sunset-30m (17:30)"


async def test_inverted_solar_segment_dropped(hass, config_entry, light_calls):
    on, off = light_calls
    # "On at 07:00 until sunrise" — but the sun is already up (sunrise 05:00),
    # so the window collapses and the light must stay off (drop rule, issue #3).
    with freeze_time("2024-06-01 08:00:00"), patch(_SUN, _fake_sun({"sunrise": (5, 0)})):
        await _setup(
            hass,
            config_entry,
            {
                "enabled": True,
                "bars": [
                    {
                        "id": "bar1",
                        "name": "Morning",
                        "type": "light",
                        "base": 0,
                        "targets": ["light.porch"],
                        "segments": [
                            {
                                "start": 7,
                                "end": 5,
                                "state": 1,
                                "end_expr": {"event": "sunrise", "offset": 0},
                            }
                        ],
                    }
                ],
            },
        )
        await hass.async_block_till_done()
    assert not on, "inverted solar segment must not turn the light on"


async def test_non_inverted_solar_segment_active(hass, config_entry, light_calls):
    on, off = light_calls
    # Same "07:00 until sunrise", but sunrise is 09:00 -> a real 07:00-09:00
    # window; at 08:00 the light is on.
    with freeze_time("2024-06-01 08:00:00"), patch(_SUN, _fake_sun({"sunrise": (9, 0)})):
        await _setup(
            hass,
            config_entry,
            {
                "enabled": True,
                "bars": [
                    {
                        "id": "bar1",
                        "name": "Morning",
                        "type": "light",
                        "base": 0,
                        "targets": ["light.porch"],
                        "segments": [
                            {
                                "start": 7,
                                "end": 9,
                                "state": 1,
                                "end_expr": {"event": "sunrise", "offset": 0},
                            }
                        ],
                    }
                ],
            },
        )
        await hass.async_block_till_done()
    assert on, "expected on: 08:00 is within 07:00-sunrise(09:00)"


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
