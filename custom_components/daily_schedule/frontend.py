"""Serve and auto-register the bundled Lovelace card as a frontend resource."""

from __future__ import annotations

import logging
from pathlib import Path

from homeassistant.components.frontend import add_extra_js_url
from homeassistant.components.http import StaticPathConfig
from homeassistant.core import HomeAssistant

from .const import DOMAIN

_LOGGER = logging.getLogger(__name__)

CARD_URL = f"/{DOMAIN}/daily-schedule-card.js"
CARD_PATH = Path(__file__).parent / "frontend" / "daily-schedule-card.js"
_REGISTERED = f"{DOMAIN}_frontend_registered"


async def async_register_card(hass: HomeAssistant) -> None:
    """Serve the card bundle and load it on all dashboards (once per hass)."""
    if hass.data.get(_REGISTERED):
        return
    if not CARD_PATH.is_file():
        _LOGGER.warning(
            "Daily Schedule card bundle missing at %s; the card will not load",
            CARD_PATH,
        )
        return
    try:
        await hass.http.async_register_static_paths(
            [StaticPathConfig(CARD_URL, str(CARD_PATH), False)]
        )
        # Auto-load the module on dashboards only when the frontend is up.
        if "frontend" in hass.config.components:
            add_extra_js_url(hass, CARD_URL)
        hass.data[_REGISTERED] = True
    except Exception:  # noqa: BLE001 - card is optional; never block setup
        _LOGGER.exception("Failed to register the Daily Schedule card")
