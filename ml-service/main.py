"""
MilkoSense ML Microservice — FastAPI Server (v3.0 — Production Grade)
=====================================================================
New in v3.0:
  ✅ API Key auth middleware (X-API-Key header)
  ✅ Auth failure audit log (SQLite)
  ✅ Async inference (ThreadPoolExecutor — ONNX never blocks event loop)
  ✅ asyncpg PostgreSQL with SQLite fallback
  ✅ JSON structured logging
  ✅ Enriched /health (models_loaded, db_connected, uptime_seconds)
"""

import asyncio
import hashlib
import json
import logging
import os
import pickle
import sqlite3
import time
import uuid
from concurrent.futures import ThreadPoolExecutor
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from pathlib import Path

import numpy as np
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import PlainTextResponse
from pydantic import BaseModel, Field
import onnxruntime as ort

# ─── Structured JSON Logger ──────────────────────────────────────────────────
class JsonFormatter(logging.Formatter):
    def format(self, record):
        log = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level":     record.levelname,
            "service":   "milkosense-ml",
            "message":   record.getMessage(),
        }
        for key in ("endpoint", "duration_ms", "predicted_class", "client_ip"):
            if hasattr(record, key):
                log[key] = getattr(record, key)
        return json.dumps(log)

handler = logging.StreamHandler()
handler.setFormatter(JsonFormatter())
logger = logging.getLogger("milkosense")
logger.setLevel(logging.INFO)
logger.addHandler(handler)
logger.propagate = False

# ─── Paths ────────────────────────────────────────────────────────────────────
BASE        = Path(__file__).parent
MODELS_PATH = BASE / "models"
DB_PATH     = BASE / "data" / "predictions.db"
DB_PATH.parent.mkdir(exist_ok=True)

SERVICE_START = time.time()

# ─── Config ───────────────────────────────────────────────────────────────────
API_KEYS_RAW  = os.environ.get("API_KEYS", "dev-key-milkosense")
VALID_API_KEYS = set(k.strip() for k in API_KEYS_RAW.split(",") if k.strip())
DATABASE_URL   = os.environ.get("DATABASE_URL", "")          # optional PostgreSQL
AUTH_EXEMPT    = {"/health", "/docs", "/openapi.json", "/redoc"}

# ─── Thread pool for ONNX/SHAP (never block async event loop) ────────────────
executor = ThreadPoolExecutor(max_workers=4)

# ─── Load models ──────────────────────────────────────────────────────────────
logger.info("Loading MilkoSense ML models...")
_models_loaded = False

try:
    with open(MODELS_PATH / "model_meta.json") as f:
        MODEL_META = json.load(f)
    with open(MODELS_PATH / "training_stats.json") as f:
        TRAINING_STATS = json.load(f)

    FEATURES = MODEL_META["features"]
    CLASSES  = MODEL_META["classes"]
    MODEL_VER = MODEL_META.get("version", "1.0.0")

    rf_session  = ort.InferenceSession(str(MODELS_PATH / "adulteration_rf.onnx"))
    xgb_session = ort.InferenceSession(str(MODELS_PATH / "adulteration_xgb.onnx"))

    with open(MODELS_PATH / "scaler.pkl",          "rb") as f: scaler     = pickle.load(f)
    with open(MODELS_PATH / "isolation_forest.pkl", "rb") as f: iso_forest = pickle.load(f)
    with open(MODELS_PATH / "rf_model.pkl",         "rb") as f: rf_model   = pickle.load(f)

    _models_loaded = True
    logger.info("ONNX models loaded", extra={"predicted_class": "init"})
except Exception as e:
    logger.error(f"Model load error: {e}")
    MODEL_META   = {}
    FEATURES     = []
    CLASSES      = []
    MODEL_VER    = "unknown"

shap_explainer = None
try:
    import shap
    with open(MODELS_PATH / "shap_explainer.pkl", "rb") as f:
        shap_explainer = pickle.load(f)
    logger.info("SHAP explainer loaded")
except Exception as e:
    logger.warning(f"SHAP not available: {e}")

cnn_model   = None
cnn_meta    = None
cnn_classes = ["A1", "A2", "Mixed"]
try:
    import tensorflow as tf
    cnn_model   = tf.saved_model.load(str(MODELS_PATH / "cnn_a1a2"))
    with open(MODELS_PATH / "cnn_meta.json") as f:
        cnn_meta = json.load(f)
    cnn_classes = cnn_meta.get("classes", cnn_classes)
    logger.info(f"1D-CNN loaded — accuracy {cnn_meta.get('test_accuracy')}")
except Exception as e:
    logger.warning(f"1D-CNN not available: {e}")

# ─── In-memory counters ───────────────────────────────────────────────────────
METRICS = {
    "total_predictions": 0, "drift_alerts": 0,
    "pure_count": 0, "adulterated_count": 0,
    "auth_failures": 0,
    "service_start": datetime.now(timezone.utc).isoformat(),
}

# ─── Database helpers ─────────────────────────────────────────────────────────
_db_connected = False
_asyncpg_pool = None

async def init_db():
    global _asyncpg_pool, _db_connected
    if DATABASE_URL:
        try:
            import asyncpg
            _asyncpg_pool = await asyncpg.create_pool(DATABASE_URL, min_size=2, max_size=10)
            async with _asyncpg_pool.acquire() as conn:
                await conn.execute("SELECT 1")
                await conn.execute("""
                    CREATE TABLE IF NOT EXISTS predictions (
                        id              TEXT PRIMARY KEY,
                        timestamp       TIMESTAMPTZ NOT NULL,
                        endpoint        TEXT,
                        input_hash      TEXT,
                        predicted_class TEXT,
                        confidence      FLOAT,
                        drift_score     FLOAT,
                        anomaly_score   FLOAT
                    )""")
                await conn.execute("""
                    CREATE TABLE IF NOT EXISTS auth_failures (
                        id        SERIAL PRIMARY KEY,
                        timestamp TIMESTAMPTZ NOT NULL,
                        client_ip TEXT,
                        endpoint  TEXT,
                        key_hint  TEXT
                    )""")
            _db_connected = True
            logger.info("PostgreSQL connected")
        except Exception as e:
            logger.warning(f"PostgreSQL unavailable: {e} — falling back to SQLite")
            _init_sqlite()
    else:
        logger.warning("WARNING: Using SQLite — not suitable for production")
        _init_sqlite()
        _db_connected = True          # SQLite always available

def _init_sqlite():
    global _db_connected
    con = sqlite3.connect(str(DB_PATH))
    con.execute("""CREATE TABLE IF NOT EXISTS predictions (
        id TEXT PRIMARY KEY, timestamp TEXT, endpoint TEXT,
        input_hash TEXT, predicted_class TEXT, confidence REAL,
        drift_score REAL, anomaly_score REAL)""")
    con.execute("""CREATE TABLE IF NOT EXISTS auth_failures (
        id INTEGER PRIMARY KEY AUTOINCREMENT, timestamp TEXT,
        client_ip TEXT, endpoint TEXT, key_hint TEXT)""")
    con.commit(); con.close()
    _db_connected = True

async def _log_prediction_pg(row: dict):
    async with _asyncpg_pool.acquire() as conn:
        await conn.execute(
            "INSERT INTO predictions VALUES($1,$2,$3,$4,$5,$6,$7,$8)",
            row["id"], row["timestamp"], row["endpoint"],
            row["input_hash"], row["predicted_class"],
            row["confidence"], row["drift_score"], row["anomaly_score"])

def _log_prediction_sqlite(row: dict):
    con = sqlite3.connect(str(DB_PATH))
    con.execute("INSERT INTO predictions VALUES(?,?,?,?,?,?,?,?)",
        (row["id"], row["timestamp"].isoformat(), row["endpoint"],
         row["input_hash"], row["predicted_class"],
         row["confidence"], row["drift_score"], row["anomaly_score"]))
    con.commit(); con.close()

async def log_prediction(endpoint: str, input_data: dict, result: dict):
    row = {
        "id":              str(uuid.uuid4()),
        "timestamp":       datetime.now(timezone.utc),
        "endpoint":        endpoint,
        "input_hash":      hashlib.sha256(json.dumps(input_data, sort_keys=True).encode()).hexdigest(),
        "predicted_class": result.get("ensemble", {}).get("predictedClass", "Unknown"),
        "confidence":      result.get("ensemble", {}).get("confidence", 0.0),
        "drift_score":     result.get("drift", {}).get("maxZScore", 0.0),
        "anomaly_score":   result.get("anomaly", {}).get("isolationForestScore", 0.0),
    }
    try:
        if _asyncpg_pool:
            await _log_prediction_pg(row)
        else:
            await asyncio.get_event_loop().run_in_executor(
                executor, lambda: _log_prediction_sqlite(row))
    except Exception as e:
        logger.warning(f"Audit log write failed: {e}")

async def log_auth_failure(client_ip: str, endpoint: str, key_hint: str):
    METRICS["auth_failures"] += 1
    ts = datetime.now(timezone.utc)
    try:
        if _asyncpg_pool:
            async with _asyncpg_pool.acquire() as conn:
                await conn.execute(
                    "INSERT INTO auth_failures(timestamp,client_ip,endpoint,key_hint) VALUES($1,$2,$3,$4)",
                    ts, client_ip, endpoint, key_hint)
        else:
            def _write():
                con = sqlite3.connect(str(DB_PATH))
                con.execute("INSERT INTO auth_failures(timestamp,client_ip,endpoint,key_hint) VALUES(?,?,?,?)",
                    (ts.isoformat(), client_ip, endpoint, key_hint))
                con.commit(); con.close()
            await asyncio.get_event_loop().run_in_executor(executor, _write)
    except Exception as e:
        logger.warning(f"Auth failure log write failed: {e}")

# ─── FastAPI lifespan ─────────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield
    if _asyncpg_pool:
        await _asyncpg_pool.close()
    executor.shutdown(wait=False)

app = FastAPI(
    title="MilkoSense ML Service",
    description="Production-grade milk adulteration detection",
    version=MODEL_VER,
    lifespan=lifespan
)

# SEC-01 FIX: Restrict CORS to known origins — set ALLOWED_ORIGINS env var in production
_raw_origins = os.environ.get("ALLOWED_ORIGINS", "http://localhost:5000,http://localhost:5173")
ALLOWED_ORIGINS = [o.strip() for o in _raw_origins.split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_methods=["GET", "POST"],
    allow_headers=["X-API-Key", "Content-Type"],
)

# ─── Auth middleware ──────────────────────────────────────────────────────────
@app.middleware("http")
async def api_key_middleware(request: Request, call_next):
    path = request.url.path

    # Exempt public endpoints
    if path in AUTH_EXEMPT or path.startswith("/docs") or path.startswith("/redoc"):
        return await call_next(request)

    api_key = request.headers.get("X-API-Key", "")
    if api_key not in VALID_API_KEYS:
        client_ip = request.client.host if request.client else "unknown"
        key_hint  = (api_key[:4] + "***") if api_key else "missing"
        logger.warning(f"Auth failure from {client_ip} at {path}",
                       extra={"client_ip": client_ip, "endpoint": path})
        await log_auth_failure(client_ip, path, key_hint)
        from fastapi.responses import JSONResponse
        return JSONResponse(status_code=401, content={"error": "unauthorized"})

    return await call_next(request)

# ─── Drift Detection ──────────────────────────────────────────────────────────
DRIFT_THRESHOLD_ZSCORE = 3.5

def detect_drift(raw_input: dict) -> dict:
    drifted, z_scores = [], {}
    for feat in FEATURES:
        val = raw_input.get(feat)
        if val is None: continue
        stats = TRAINING_STATS.get(feat, {})
        mean, std = stats.get("mean", 0), stats.get("std", 1)
        if std == 0: continue
        z = abs((val - mean) / std)
        z_scores[feat] = round(float(z), 3)
        if z > DRIFT_THRESHOLD_ZSCORE:
            drifted.append({"feature": feat, "value": val, "zScore": round(float(z), 3),
                            "trainingMean": mean, "trainingStd": std})

    max_z = max(z_scores.values(), default=0.0)
    if drifted: METRICS["drift_alerts"] += 1
    return {"isDrifted": bool(drifted), "maxZScore": round(max_z, 3),
            "driftedFeatures": drifted, "allZScores": z_scores,
            "retrainRecommended": max_z > 5.0}

# ─── Uncertainty ──────────────────────────────────────────────────────────────
def _compute_uncertainty_sync(x_scaled: np.ndarray) -> dict:
    tree_preds = np.array([t.predict_proba(x_scaled)[0] for t in rf_model.estimators_])
    mean_probs = tree_preds.mean(axis=0)
    std_probs  = tree_preds.std(axis=0)
    idx = int(np.argmax(mean_probs))
    ci_l = float(mean_probs[idx] - 1.96 * std_probs[idx])
    ci_u = float(mean_probs[idx] + 1.96 * std_probs[idx])
    return {
        "meanProbability": round(float(mean_probs[idx]) * 100, 2),
        "stdProbability":  round(float(std_probs[idx]) * 100, 4),
        "ci95Lower":       round(max(0, ci_l) * 100, 2),
        "ci95Upper":       round(min(1, ci_u) * 100, 2),
        "nTrees":          len(rf_model.estimators_),
        "interpretability":"High" if std_probs[idx] < 0.05 else "Moderate",
    }

# ─── SHAP ─────────────────────────────────────────────────────────────────────
def _compute_shap_sync(x_scaled: np.ndarray, class_idx: int) -> dict:
    if shap_explainer is None:
        return {"available": False, "message": "Run compute_shap.py to enable SHAP"}
    try:
        shap_vals = shap_explainer.shap_values(x_scaled)
        if isinstance(shap_vals, list):
            class_shap = shap_vals[class_idx][0]
        elif isinstance(shap_vals, np.ndarray):
            if len(shap_vals.shape) == 3:
                class_shap = shap_vals[0, :, class_idx]
            elif len(shap_vals.shape) == 2:
                class_shap = shap_vals[0]
            else:
                class_shap = shap_vals.ravel()
        else:
            class_shap = np.zeros(len(FEATURES))
    except Exception as e:
        logger.warning(f"Error computing SHAP values: {e}")
        class_shap = np.zeros(len(FEATURES))

    contributions = sorted([
        {"feature": f, "shapValue": round(float(v), 5),
         "direction": "increases_risk" if v > 0 else "decreases_risk",
         "magnitude": abs(round(float(v), 5))}
        for f, v in zip(FEATURES, class_shap)
    ], key=lambda x: x["magnitude"], reverse=True)
    return {
        "available": True,
        "topFeatures": contributions[:5],
        "allContributions": contributions,
        "explanation": f"Top driver: {contributions[0]['feature']} "
                       f"({'↑' if contributions[0]['shapValue'] > 0 else '↓'} "
                       f"confidence by {contributions[0]['magnitude']:.4f})"
    }

# ─── Core ONNX Inference (sync — runs in executor) ────────────────────────────
def _run_onnx_sync(x_scaled: np.ndarray):
    rf_out  = rf_session.run(None,  {rf_session.get_inputs()[0].name:  x_scaled})
    xgb_out = xgb_session.run(None, {xgb_session.get_inputs()[0].name: x_scaled})
    return rf_out, xgb_out

# ─── Full Prediction (async) ──────────────────────────────────────────────────
async def run_prediction(sample_dict: dict) -> dict:
    t0 = time.time()
    loop = asyncio.get_event_loop()

    x_raw    = np.array([[sample_dict[f] for f in FEATURES]], dtype=np.float32)
    x_scaled = scaler.transform(x_raw).astype(np.float32)

    # ONNX — off event loop
    rf_out, xgb_out = await loop.run_in_executor(executor, lambda: _run_onnx_sync(x_scaled))

    rf_class  = int(rf_out[0][0])
    rf_probs  = np.array([rf_out[1][0].get(i, 0.0) for i in range(len(CLASSES))], dtype=float)
    xgb_class = int(xgb_out[0][0])
    xgb_probs = np.array(xgb_out[1][0], dtype=float)

    ens_probs     = (rf_probs + xgb_probs) / 2.0
    ens_class_idx = int(np.argmax(ens_probs))
    ens_class     = CLASSES[ens_class_idx]
    ens_conf      = float(ens_probs[ens_class_idx])
    prob_dict     = {CLASSES[i]: round(float(ens_probs[i]) * 100, 2) for i in range(len(CLASSES))}

    # IsolationForest — off event loop
    iso_score, is_anomaly = await loop.run_in_executor(
        executor,
        lambda: (float(iso_forest.score_samples(x_scaled)[0]),
                 iso_forest.predict(x_scaled)[0] == -1)
    )
    anomaly_risk = max(0.0, min(100.0, (-iso_score + 0.2) * 200))

    # Uncertainty — off event loop
    uncertainty = await loop.run_in_executor(executor, lambda: _compute_uncertainty_sync(x_scaled))

    # SHAP — off event loop
    explanation = await loop.run_in_executor(executor, lambda: _compute_shap_sync(x_scaled, ens_class_idx))

    # Drift (CPU-light — keep on loop)
    drift = detect_drift(sample_dict)

    breakdown = {
        "waterPercent":          round(prob_dict.get("WaterAdded",    0) * 0.25, 2),
        "ureaAdulteration":      round(prob_dict.get("UreaAdded",     0) * 0.20, 2),
        "detergentAdulteration": round(prob_dict.get("DetergentAdded",0) * 0.15, 2),
        "starchAdulteration":    round(prob_dict.get("StarchAdded",   0) * 0.15, 2),
        "syntheticMilk":         round(anomaly_risk * 0.05, 2),
    }
    total_risk   = round(sum(breakdown.values()), 2)
    overall_risk = "Low" if ens_class == "Pure" else ("Moderate" if ens_conf < 0.85 else "High")

    METRICS["total_predictions"] += 1
    if ens_class == "Pure": METRICS["pure_count"] += 1
    else:                    METRICS["adulterated_count"] += 1

    latency_ms = round((time.time() - t0) * 1000, 2)
    logger.info("Prediction complete",
                extra={"endpoint": "/predict", "duration_ms": latency_ms, "predicted_class": ens_class})

    return {
        "ensemble":      {"predictedClass": ens_class, "confidence": round(ens_conf*100,2),
                          "isPure": ens_class=="Pure", "overallRisk": overall_risk,
                          "classProbabilities": prob_dict},
        "models":        {"randomForest": {"predictedClass": CLASSES[rf_class],
                                           "confidence": round(float(np.max(rf_probs))*100,2)},
                          "xgboost":      {"predictedClass": CLASSES[xgb_class],
                                           "confidence": round(float(np.max(xgb_probs))*100,2)}},
        "anomaly":       {"isolationForestScore": round(iso_score,4),
                          "isAnomaly": bool(is_anomaly), "anomalyRiskPercent": round(anomaly_risk,2)},
        "uncertainty":   uncertainty,
        "explanation":   explanation,
        "drift":         drift,
        "breakdown":     breakdown,
        "totalRiskValue":total_risk,
        "modelVersion":  MODEL_VER,
        "latencyMs":     latency_ms,
    }

# ─── Request schemas ──────────────────────────────────────────────────────────
class MilkSample(BaseModel):
    pH:             float = Field(..., ge=4.0,   le=10.0)
    fat:            float = Field(..., ge=0.1,   le=10.0)
    SNF:            float = Field(..., ge=4.0,   le=14.0)
    protein:        float = Field(..., ge=1.0,   le=6.0)
    lactose:        float = Field(..., ge=1.0,   le=7.0)
    density:        float = Field(..., ge=1.010, le=1.050)
    conductivity:   float = Field(..., ge=0.5,   le=20.0)
    refractiveIndex:float = Field(..., ge=1.330, le=1.360)
    turbidity:      float = Field(..., ge=0.0,   le=100.0)
    temperature:    float = Field(..., ge=0.0,   le=45.0)
    color_L:        float = Field(90.5)
    color_a:        float = Field(-2.3)
    color_b:        float = Field(7.5)
    tvc_log:        float = Field(4.1)

class SpectralSample(BaseModel):
    channels: list[float] = Field(..., min_length=200, max_length=200)

# ─── Routes ───────────────────────────────────────────────────────────────────
@app.get("/health")
async def health():
    db_ok = False
    try:
        if _asyncpg_pool:
            async with _asyncpg_pool.acquire() as conn:
                await conn.execute("SELECT 1")
                db_ok = True
        else:
            sqlite3.connect(str(DB_PATH)).execute("SELECT 1")
            db_ok = True
    except Exception:
        pass

    return {
        "status":         "ok" if _models_loaded else "degraded",
        "version":        MODEL_VER,
        "models_loaded":  _models_loaded,
        "db_connected":   db_ok,
        "shap_enabled":   shap_explainer is not None,
        "cnn_enabled":    cnn_model is not None,
        "uptime_seconds": int(time.time() - SERVICE_START),
        "metrics":        METRICS,
    }

@app.post("/predict")
async def predict(sample: MilkSample, request: Request):
    if not _models_loaded:
        raise HTTPException(
            status_code=503,
            detail="Machine learning models are not loaded. Ensure ONNX models, scaler.pkl, and rf_model.pkl are present in models/."
        )
    try:
        sample_dict = sample.model_dump()
        result = await run_prediction(sample_dict)
        await log_prediction("/predict", sample_dict, result)
        return {"success": True, "prediction": result}
    except Exception as e:
        logger.error(f"Prediction error: {e}", extra={"endpoint": "/predict"})
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/predict/spectral")
async def predict_spectral(sample: SpectralSample):
    if cnn_model is None:
        raise HTTPException(status_code=503,
            detail="CNN model not available. Run: python train_cnn.py")
    try:
        import tensorflow as tf
        loop = asyncio.get_event_loop()
        x = np.array(sample.channels, dtype=np.float32).reshape(1, 200, 1)

        def _infer():
            x_tensor = tf.constant(x)
            infer    = cnn_model.signatures["serving_default"]
            output   = infer(x_tensor)
            return list(output.values())[0].numpy()[0]

        probs      = await loop.run_in_executor(executor, _infer)
        class_idx  = int(np.argmax(probs))
        class_name = cnn_classes[class_idx]
        return {
            "success": True,
            "prediction": {
                "proteinType":   class_name,
                "confidence":    round(float(probs[class_idx]) * 100, 2),
                "probabilities": {cnn_classes[i]: round(float(probs[i]) * 100, 2)
                                  for i in range(len(cnn_classes))},
                "modelVersion":  cnn_meta.get("version") if cnn_meta else "unknown",
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/feature-importance")
async def feature_importance():
    if not _models_loaded:
        raise HTTPException(
            status_code=503,
            detail="Machine learning models are not loaded. Ensure ONNX models, scaler.pkl, and rf_model.pkl are present in models/."
        )
    return {"success": True, "model": "RandomForest + SHAP",
            "importance": MODEL_META.get("feature_importance", {})}

@app.get("/drift-report")
async def drift_report():
    try:
        loop = asyncio.get_event_loop()
        def _query():
            con = sqlite3.connect(str(DB_PATH))
            rows = con.execute(
                "SELECT drift_score, predicted_class FROM predictions ORDER BY timestamp DESC LIMIT 100"
            ).fetchall()
            con.close(); return rows
        rows = await loop.run_in_executor(executor, _query)
        scores = [r[0] for r in rows] if rows else [0.0]
        class_dist = {c: sum(1 for r in rows if r[1] == c) for c in CLASSES}
        return {
            "total_predictions":    len(rows),
            "features_with_drift":  METRICS["drift_alerts"],
            "drift_threshold":      DRIFT_THRESHOLD_ZSCORE,
            "avgDriftScore":        round(float(np.mean(scores)), 3),
            "maxDriftScore":        round(float(np.max(scores)), 3),
            "classDistribution":    class_dist,
        }
    except Exception as e:
        return {"total_predictions": 0, "features_with_drift": 0,
                "drift_threshold": DRIFT_THRESHOLD_ZSCORE, "error": str(e)}

@app.get("/metrics")
async def metrics():
    lines = [
        f'milkosense_total_predictions {METRICS["total_predictions"]}',
        f'milkosense_drift_alerts {METRICS["drift_alerts"]}',
        f'milkosense_pure_count {METRICS["pure_count"]}',
        f'milkosense_adulterated_count {METRICS["adulterated_count"]}',
        f'milkosense_auth_failures {METRICS["auth_failures"]}',
        f'milkosense_uptime_seconds {int(time.time() - SERVICE_START)}',
    ]
    return PlainTextResponse("\n".join(lines))

@app.get("/audit-log")
async def audit_log(limit: int = 20):
    loop = asyncio.get_event_loop()
    def _query():
        con = sqlite3.connect(str(DB_PATH))
        rows = con.execute(
            "SELECT id, timestamp, endpoint, predicted_class, confidence, drift_score, anomaly_score "
            "FROM predictions ORDER BY timestamp DESC LIMIT ?", (limit,)
        ).fetchall(); con.close(); return rows
    rows = await loop.run_in_executor(executor, _query)
    return {
        "count": len(rows),
        "predictions": [
            {"id": r[0], "timestamp": r[1], "endpoint": r[2], "predictedClass": r[3],
             "confidence": r[4], "driftScore": r[5], "anomalyScore": r[6]}
            for r in rows
        ]
    }
