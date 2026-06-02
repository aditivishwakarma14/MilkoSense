"""
test_drift_detection.py
───────────────────────
Validates drift detection logic:
  - Nominal sample → low Z-score
  - Extreme sample (3× std) → high Z-score
  - /drift-report endpoint has required keys
"""
import json
import pickle
import numpy as np
import pytest
from pathlib import Path

BASE        = Path(__file__).parent.parent
MODELS_PATH = BASE / "models"

@pytest.fixture(scope="module")
def training_stats():
    with open(MODELS_PATH / "training_stats.json") as f:
        return json.load(f)

@pytest.fixture(scope="module")
def nominal_payload(training_stats):
    """Sample exactly at training mean for every feature."""
    return {feat: stats["mean"] for feat, stats in training_stats.items()}

@pytest.fixture(scope="module")
def extreme_payload(training_stats):
    """Sample at training mean + 3× std for every feature (guaranteed high drift)."""
    return {feat: stats["mean"] + 3.0 * stats["std"] for feat, stats in training_stats.items()}

# ── Unit tests (import detect_drift directly) ─────────────────────────────────
def test_nominal_drift_low(nominal_payload):
    """Nominal input must NOT trigger drift (max Z-score < 0.5)."""
    import sys, os
    sys.path.insert(0, str(BASE))
    os.environ.setdefault("API_KEYS", "test-key-123")
    from main import detect_drift
    result = detect_drift(nominal_payload)
    assert result["maxZScore"] < 0.5, \
        f"Nominal sample has unexpectedly high drift: {result['maxZScore']}"
    assert not result["isDrifted"]

def test_extreme_drift_high(extreme_payload):
    """3× std sample MUST trigger drift (max Z-score > 2.0)."""
    import sys, os
    sys.path.insert(0, str(BASE))
    os.environ.setdefault("API_KEYS", "test-key-123")
    from main import detect_drift
    result = detect_drift(extreme_payload)
    assert result["maxZScore"] > 2.0, \
        f"Extreme sample has unexpectedly low drift: {result['maxZScore']}"

# ── API test ──────────────────────────────────────────────────────────────────
REQUIRED_DRIFT_REPORT_KEYS = {"total_predictions", "features_with_drift", "drift_threshold"}

def test_drift_report_endpoint(client, auth_headers):
    response = client.get("/drift-report", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    missing = REQUIRED_DRIFT_REPORT_KEYS - set(data.keys())
    assert not missing, f"/drift-report missing keys: {missing}"
    assert isinstance(data["drift_threshold"], (int, float))
    assert data["drift_threshold"] > 0
