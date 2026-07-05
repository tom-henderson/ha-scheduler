"""Switch entity exposing the schedule's master enable state."""

from __future__ import annotations

from typing import Any

from homeassistant.components.switch import SwitchEntity
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers.device_registry import DeviceEntryType, DeviceInfo
from homeassistant.helpers.dispatcher import async_dispatcher_connect
from homeassistant.helpers.entity_platform import AddEntitiesCallback

from . import ScheduleConfigEntry
from .const import DOMAIN, SIGNAL_SCHEDULE_UPDATED
from .manager import ScheduleManager


async def async_setup_entry(
    hass: HomeAssistant,
    entry: ScheduleConfigEntry,
    async_add_entities: AddEntitiesCallback,
) -> None:
    """Set up the enable switch for a config entry."""
    async_add_entities([ScheduleEnableSwitch(entry.runtime_data, entry.entry_id)])


class ScheduleEnableSwitch(SwitchEntity):
    """Master on/off for the whole schedule (schedule.enabled)."""

    _attr_has_entity_name = True
    _attr_name = "Enabled"
    _attr_icon = "mdi:calendar-clock"

    def __init__(self, manager: ScheduleManager, entry_id: str) -> None:
        self._manager = manager
        self._entry_id = entry_id
        self._attr_unique_id = f"{entry_id}_enabled"
        self._attr_device_info = DeviceInfo(
            identifiers={(DOMAIN, entry_id)},
            name="Daily Schedule",
            entry_type=DeviceEntryType.SERVICE,
        )

    @property
    def is_on(self) -> bool:
        return self._manager.schedule.enabled

    async def async_turn_on(self, **kwargs: Any) -> None:
        await self._manager.async_set_enabled(True)

    async def async_turn_off(self, **kwargs: Any) -> None:
        await self._manager.async_set_enabled(False)

    async def async_added_to_hass(self) -> None:
        """Reflect card-driven enable changes back onto the entity."""
        self.async_on_remove(
            async_dispatcher_connect(
                self.hass,
                SIGNAL_SCHEDULE_UPDATED.format(self._entry_id),
                self._handle_update,
            )
        )

    @callback
    def _handle_update(self) -> None:
        self.async_write_ha_state()
