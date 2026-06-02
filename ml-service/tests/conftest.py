"""
conftest.py — shared fixtures and env setup for all pytest tests
"""
import os
import pytest

# Set env before any import of main.py
os.environ.setdefault("API_KEYS",      "test-key-123")
os.environ.setdefault("ML_SERVICE_URL","http://localhost:8000")

from fastapi.testclient import TestClient

@pytest.fixture(scope="session")
def client():
    """FastAPI TestClient — loads models once per test session."""
    from main import app
    with TestClient(app) as c:
        yield c

@pytest.fixture(scope="session")
def auth_headers():
    return {"X-API-Key": "test-key-123"}

@pytest.fixture(scope="session")
def valid_payload():
    """A realistic pure-milk sample."""
    return {
        "pH": 6.65, "fat": 4.20, "SNF": 8.70, "protein": 3.30,
        "lactose": 4.80, "density": 1.032, "conductivity": 4.50,
        "refractiveIndex": 1.3425, "turbidity": 15.0, "temperature": 4.5,
        "color_L": 90.5, "color_a": -2.3, "color_b": 7.5, "tvc_log": 4.1
    }
