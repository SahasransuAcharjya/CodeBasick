"""Tests for service health check endpoints."""

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_health_check_endpoint():
    """Verify GET /health returns 200 with expected schema fields."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["app"] == "CodeBasick API"
    assert "version" in data
    assert "environment" in data


def test_health_check_versioned_endpoint():
    """Verify GET /api/v1/health returns 200 with expected schema fields."""
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["app"] == "CodeBasick API"


def test_root_endpoint():
    """Verify GET / returns 200 status confirmation."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "running"
    assert data["app"] == "CodeBasick API"
