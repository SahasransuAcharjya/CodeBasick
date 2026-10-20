"""Tests for application settings and configuration validation."""

import pytest
from pydantic import ValidationError
from app.core.config import Settings


def test_default_development_settings():
    """Verify default development configuration settings."""
    settings = Settings()
    assert settings.PROJECT_NAME == "CodeBasick API"
    assert settings.ENVIRONMENT == "development"
    assert settings.DEBUG is True
    assert settings.API_V1_STR == "/api/v1"
    assert "http://localhost:3000" in settings.CORS_ORIGINS
    assert settings.LOG_LEVEL == "INFO"


def test_production_rejects_debug_mode():
    """Verify that production environment rejects DEBUG=True."""
    with pytest.raises(ValidationError) as exc_info:
        Settings(ENVIRONMENT="production", DEBUG=True)
    assert "DEBUG must be set to False in production" in str(exc_info.value)


def test_production_rejects_wildcard_cors():
    """Verify that production environment rejects wildcard '*' CORS origin."""
    with pytest.raises(ValidationError) as exc_info:
        Settings(
            ENVIRONMENT="production",
            DEBUG=False,
            CORS_ORIGINS=["*"],
        )
    assert "Wildcard '*' CORS origin is strictly forbidden" in str(exc_info.value)


def test_cors_origin_normalization():
    """Verify trailing slashes on origins are stripped cleanly."""
    settings = Settings(CORS_ORIGINS=["http://localhost:3000/"])
    assert settings.CORS_ORIGINS == ["http://localhost:3000"]
