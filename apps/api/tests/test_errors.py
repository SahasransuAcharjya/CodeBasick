"""Tests for error handling, validation, and information leak prevention."""

from fastapi import Query
from fastapi.testclient import TestClient
from app.core.config import Settings
from app.core.exceptions import AppException, NotFoundException
from app.main import create_app

# Create a test-specific app instance to mount custom error-triggering routes safely
test_app = create_app(Settings(ENVIRONMENT="test", DEBUG=False))


@test_app.get("/test/custom-app-error")
async def trigger_custom_error():
    raise AppException(message="Custom domain failure", status_code=400, details={"reason": "bad_input"})


@test_app.get("/test/not-found-error")
async def trigger_not_found():
    raise NotFoundException(message="Item not found")


@test_app.get("/test/unhandled-error")
async def trigger_unhandled_error():
    # Simulate an internal unexpected error that contains sensitive string
    raise RuntimeError("Internal database secret string that must never be exposed to clients")


@test_app.get("/test/validation-error")
async def trigger_validation(value: int = Query(..., gt=0)):
    return {"value": value}


client = TestClient(test_app, raise_server_exceptions=False)


def test_404_not_found_standard():
    """Verify requesting an undefined path returns standard 404."""
    response = client.get("/api/v1/nonexistent-route-xyz")
    assert response.status_code == 404


def test_custom_app_exception():
    """Verify AppException handler returns configured status and message."""
    response = client.get("/test/custom-app-error")
    assert response.status_code == 400
    data = response.json()
    assert data["error"] == "Custom domain failure"
    assert data["details"] == {"reason": "bad_input"}


def test_custom_not_found_exception():
    """Verify NotFoundException handler returns 404 with error message."""
    response = client.get("/test/not-found-error")
    assert response.status_code == 404
    data = response.json()
    assert data["error"] == "Item not found"


def test_unhandled_server_error_sanitization():
    """Verify unhandled exceptions do not leak internal stack traces or secrets."""
    response = client.get("/test/unhandled-error")
    assert response.status_code == 500
    data = response.json()
    assert data["error"] == "Internal Server Error"
    assert data["message"] == "An unexpected error occurred. Please try again later."
    # Crucial security check: internal error message and stack traces must NOT be present in body
    assert "Internal database secret string" not in response.text
    assert "Traceback" not in response.text
    assert "File" not in response.text


def test_validation_error_handler():
    """Verify invalid query parameter returns 422 with structured field errors."""
    response = client.get("/test/validation-error?value=not-an-integer")
    assert response.status_code == 422
    data = response.json()
    assert data["error"] == "Request validation failed"
    assert "details" in data
    assert any("value" in str(d) for d in data["details"])
