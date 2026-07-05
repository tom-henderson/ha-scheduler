"""Setup / unload / service registration tests."""

from homeassistant.core import HomeAssistant

from custom_components.daily_schedule.const import DOMAIN, SERVICE_SYNC_NOW


async def _setup_empty(hass: HomeAssistant, config_entry):
    config_entry.add_to_hass(hass)
    assert await hass.config_entries.async_setup(config_entry.entry_id)
    await hass.async_block_till_done()


async def test_setup_registers_service_and_entity(hass, config_entry):
    await _setup_empty(hass, config_entry)
    assert hass.services.has_service(DOMAIN, SERVICE_SYNC_NOW)
    state = hass.states.get("switch.daily_schedule_enabled")
    assert state is not None
    assert state.state == "on"  # schedule defaults to enabled


async def test_switch_toggles_schedule_enabled(hass, config_entry):
    await _setup_empty(hass, config_entry)
    manager = config_entry.runtime_data

    await hass.services.async_call(
        "switch", "turn_off", {"entity_id": "switch.daily_schedule_enabled"},
        blocking=True,
    )
    await hass.async_block_till_done()
    assert manager.schedule.enabled is False
    assert hass.states.get("switch.daily_schedule_enabled").state == "off"

    await hass.services.async_call(
        "switch", "turn_on", {"entity_id": "switch.daily_schedule_enabled"},
        blocking=True,
    )
    await hass.async_block_till_done()
    assert manager.schedule.enabled is True


async def test_card_bundle_is_registered(hass, config_entry):
    from custom_components.daily_schedule.frontend import CARD_PATH, _REGISTERED

    assert CARD_PATH.is_file(), "built card bundle must ship inside the integration"
    await _setup_empty(hass, config_entry)
    # The static path for the card is registered during async_setup.
    assert hass.data.get(_REGISTERED) is True


async def test_unload_removes_entry(hass, config_entry):
    await _setup_empty(hass, config_entry)
    assert await hass.config_entries.async_unload(config_entry.entry_id)
    await hass.async_block_till_done()
    assert config_entry.entry_id not in hass.data.get(DOMAIN, {})


async def test_persistence_survives_reload(hass, config_entry):
    await _setup_empty(hass, config_entry)
    manager = config_entry.runtime_data
    await manager.async_add_bar(
        {"name": "Persisted", "type": "light", "targets": ["light.x"],
         "segments": [{"start": 6, "end": 9, "state": 1}]}
    )
    await hass.async_block_till_done()

    assert await hass.config_entries.async_reload(config_entry.entry_id)
    await hass.async_block_till_done()

    reloaded = config_entry.runtime_data
    assert [b.name for b in reloaded.schedule.bars] == ["Persisted"]
