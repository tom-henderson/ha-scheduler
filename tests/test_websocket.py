"""WebSocket CRUD API tests."""

import pytest

from custom_components.daily_schedule.const import DOMAIN


@pytest.fixture
async def setup(hass, config_entry):
    config_entry.add_to_hass(hass)
    assert await hass.config_entries.async_setup(config_entry.entry_id)
    await hass.async_block_till_done()
    return config_entry


async def test_get_returns_schedule_and_types(hass, hass_ws_client, setup):
    client = await hass_ws_client(hass)
    await client.send_json_auto_id(
        {"type": f"{DOMAIN}/get", "entry_id": setup.entry_id}
    )
    msg = await client.receive_json()
    assert msg["success"]
    assert msg["result"]["enabled"] is True
    assert msg["result"]["bars"] == []
    assert "conflicts" in msg["result"]
    assert "light" in msg["result"]["types"]


async def test_get_unknown_entry_errors(hass, hass_ws_client, setup):
    client = await hass_ws_client(hass)
    await client.send_json_auto_id({"type": f"{DOMAIN}/get", "entry_id": "nope"})
    msg = await client.receive_json()
    assert not msg["success"]
    assert msg["error"]["code"] == "not_found"


async def test_add_update_delete_bar(hass, hass_ws_client, setup):
    client = await hass_ws_client(hass)

    await client.send_json_auto_id(
        {
            "type": f"{DOMAIN}/add_bar",
            "entry_id": setup.entry_id,
            "bar": {
                "name": "Lights",
                "type": "light",
                "targets": ["light.porch"],
                "segments": [{"start": 6, "end": 9, "state": 1}],
            },
        }
    )
    msg = await client.receive_json()
    assert msg["success"]
    bar_id = msg["result"]["bar_id"]
    assert len(msg["result"]["bars"]) == 1

    await client.send_json_auto_id(
        {
            "type": f"{DOMAIN}/update_bar",
            "entry_id": setup.entry_id,
            "bar_id": bar_id,
            "bar": {"name": "Renamed", "type": "light", "targets": ["light.porch"],
                    "segments": []},
        }
    )
    msg = await client.receive_json()
    assert msg["success"]
    assert msg["result"]["bars"][0]["name"] == "Renamed"

    await client.send_json_auto_id(
        {"type": f"{DOMAIN}/delete_bar", "entry_id": setup.entry_id, "bar_id": bar_id}
    )
    msg = await client.receive_json()
    assert msg["success"]
    assert msg["result"]["bars"] == []


async def test_set_enabled(hass, hass_ws_client, setup):
    client = await hass_ws_client(hass)
    await client.send_json_auto_id(
        {"type": f"{DOMAIN}/set_enabled", "entry_id": setup.entry_id, "enabled": False}
    )
    msg = await client.receive_json()
    assert msg["success"]
    assert msg["result"]["enabled"] is False
    assert setup.runtime_data.schedule.enabled is False


async def test_subscribe_pushes_on_change(hass, hass_ws_client, setup):
    client = await hass_ws_client(hass)
    await client.send_json_auto_id(
        {"type": f"{DOMAIN}/subscribe", "entry_id": setup.entry_id}
    )
    # First the ack, then an immediate snapshot event.
    ack = await client.receive_json()
    assert ack["success"]
    snapshot = await client.receive_json()
    assert snapshot["event"]["bars"] == []

    # A change pushes a new event.
    await setup.runtime_data.async_add_bar(
        {"name": "New", "type": "light", "targets": [], "segments": []}
    )
    event = await client.receive_json()
    assert event["event"]["bars"][0]["name"] == "New"


async def test_duplicate_bar(hass, hass_ws_client, setup):
    client = await hass_ws_client(hass)
    await client.send_json_auto_id(
        {
            "type": f"{DOMAIN}/add_bar",
            "entry_id": setup.entry_id,
            "bar": {"name": "Orig", "type": "light", "targets": ["light.x"],
                    "segments": [{"start": 6, "end": 9, "state": 1}]},
        }
    )
    msg = await client.receive_json()
    bar_id = msg["result"]["bar_id"]

    await client.send_json_auto_id(
        {"type": f"{DOMAIN}/duplicate_bar", "entry_id": setup.entry_id, "bar_id": bar_id}
    )
    msg = await client.receive_json()
    assert msg["success"]
    names = [b["name"] for b in msg["result"]["bars"]]
    assert names == ["Orig", "Orig copy"]
    # The duplicate has fresh ids.
    ids = [b["id"] for b in msg["result"]["bars"]]
    assert ids[0] != ids[1]
