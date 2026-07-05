"""Shared pytest fixtures for the Daily Schedule tests."""

import pytest

pytest_plugins = "pytest_homeassistant_custom_component"


@pytest.fixture(autouse=True)
def auto_enable_custom_integrations(enable_custom_integrations):
    """Enable loading of the custom_components/daily_schedule integration."""
    yield


@pytest.fixture
def config_entry():
    """A MockConfigEntry for Daily Schedule."""
    from pytest_homeassistant_custom_component.common import MockConfigEntry

    from custom_components.daily_schedule.const import DOMAIN

    return MockConfigEntry(domain=DOMAIN, title="Daily Schedule", data={}, unique_id=DOMAIN)
