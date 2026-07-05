"""Config flow for Daily Schedule.

A single, config-less entry — all real configuration lives in the schedule data
edited through the card. We just create the entry so the integration loads.
"""

from __future__ import annotations

from typing import Any

from homeassistant.config_entries import ConfigFlow, ConfigFlowResult

from .const import DOMAIN


class DailyScheduleConfigFlow(ConfigFlow, domain=DOMAIN):
    """Handle a config flow for Daily Schedule."""

    VERSION = 1

    async def async_step_user(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        """Create the single Daily Schedule entry."""
        await self.async_set_unique_id(DOMAIN)
        self._abort_if_unique_id_configured()

        if user_input is None:
            return self.async_show_form(step_id="user")

        return self.async_create_entry(title="Daily Schedule", data={})
