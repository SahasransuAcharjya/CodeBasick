"""Tests for service health and readiness endpoints."""

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_root_health_endpoint():
    """Verify GET /health returns 200 with valid liveness payload."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["app"] == "CodeBasick API"
    assert "version" in data
    assert "environment" in data


def test_versioned_health_endpoint():
    """Verify GET /api/v1/health returns 200 with valid liveness payload."""
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["app"] == "CodeBasick API"


def test_versioned_readiness_endpoint():
    """Verify GET /api/v1/health/ready returns 200 with readiness payload."""
    response = client.get("/api/v1/health/ready")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ready"
    assert data["app"] == "CodeBasick API"
    assert "components" in data
    assert data["components"]["api"] == "operational"
    # Ensure unintegrated external services are not falsely reported
    assert "mongodb" not in data["components"]
    assert "gemini" not in data["components"]
    assert "judge0" not in data["components"]


def test_root_metadata_endpoint():
    """Verify GET / returns 200 and documents API version prefix."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "running"
    assert data["app"] == "CodeBasick API"
    assert data["api_v1"] == "/api/v1"
