"""Smoke tests that do not need AWS credentials or provisioned resources."""
from fastapi.testclient import TestClient

from app.main import app


def test_root_exposes_service_discovery() -> None:
    response = TestClient(app).get("/")
    assert response.status_code == 200
    assert response.json()["docs"] == "/api/v1/docs"


def test_versioned_health_endpoint() -> None:
    response = TestClient(app).get("/api/v1/health/")
    body = response.json()
    assert response.status_code == 200
    assert body["status"] == "Echoes Backend is Magical"
    assert body["version"] == "1.0.0"
