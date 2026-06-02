"""
test_api_endpoints.py
─────────────────────
Integration tests for FastAPI endpoints via TestClient.
"""
import pytest

REQUIRED_PREDICT_KEYS = {
    "ensemble", "models", "anomaly", "uncertainty",
    "explanation", "drift", "breakdown", "totalRiskValue", "latencyMs"
}

# ── POST /predict — valid payload ─────────────────────────────────────────────
def test_predict_valid(client, auth_headers, valid_payload):
    response = client.post("/predict", json=valid_payload, headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    pred = data["prediction"]
    missing = REQUIRED_PREDICT_KEYS - set(pred.keys())
    assert not missing, f"Prediction response missing keys: {missing}"
    assert "predictedClass" in pred["ensemble"]
    assert "confidence" in pred["ensemble"]
    assert isinstance(pred["ensemble"]["confidence"], (int, float))
    assert 0 <= pred["ensemble"]["confidence"] <= 100

def test_predict_has_shap_explanation(client, auth_headers, valid_payload):
    response = client.post("/predict", json=valid_payload, headers=auth_headers)
    assert response.status_code == 200
    explanation = response.json()["prediction"]["explanation"]
    assert "available" in explanation

def test_predict_has_uncertainty(client, auth_headers, valid_payload):
    response = client.post("/predict", json=valid_payload, headers=auth_headers)
    assert response.status_code == 200
    unc = response.json()["prediction"]["uncertainty"]
    assert "ci95Lower"  in unc
    assert "ci95Upper"  in unc
    assert "nTrees"     in unc

def test_predict_has_drift(client, auth_headers, valid_payload):
    response = client.post("/predict", json=valid_payload, headers=auth_headers)
    assert response.status_code == 200
    drift = response.json()["prediction"]["drift"]
    assert "isDrifted"  in drift
    assert "maxZScore"  in drift

# ── POST /predict — missing required field (422) ──────────────────────────────
def test_predict_missing_field_422(client, auth_headers):
    bad_payload = {"pH": 6.65, "fat": 4.20}   # missing most fields
    response = client.post("/predict", json=bad_payload, headers=auth_headers)
    assert response.status_code == 422

# ── POST /predict — no API key (401) ─────────────────────────────────────────
def test_predict_no_api_key_401(client, valid_payload):
    response = client.post("/predict", json=valid_payload)  # no headers
    assert response.status_code == 401
    assert response.json()["error"] == "unauthorized"

# ── POST /predict — wrong API key (401) ──────────────────────────────────────
def test_predict_wrong_api_key_401(client, valid_payload):
    response = client.post("/predict", json=valid_payload,
                           headers={"X-API-Key": "totally-wrong-key"})
    assert response.status_code == 401

# ── GET /health — no auth required ───────────────────────────────────────────
def test_health_no_auth(client):
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] in ("ok", "degraded")
    assert "models_loaded"  in data
    assert "db_connected"   in data
    assert "uptime_seconds" in data
    assert isinstance(data["uptime_seconds"], int)

# ── GET /metrics — auth required ─────────────────────────────────────────────
def test_metrics_auth(client, auth_headers):
    response = client.get("/metrics", headers=auth_headers)
    assert response.status_code == 200
    text = response.text
    assert "milkosense_total_predictions" in text

def test_metrics_no_auth(client):
    response = client.get("/metrics")
    assert response.status_code == 401

# ── GET /feature-importance ───────────────────────────────────────────────────
def test_feature_importance(client, auth_headers):
    response = client.get("/feature-importance", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "importance" in data
