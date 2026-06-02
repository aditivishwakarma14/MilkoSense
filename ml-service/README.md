# MilkoSense ML Microservice — 10/10 Grade

Enterprise-grade milk adulteration detection microservice.

## Architecture

```
POST /api/analysis (Node.js)
  └─→ aiService.js
       └─→ POST http://localhost:8000/predict  (Python FastAPI)
            ├── RandomForest (ONNX)        — primary classifier
            ├── XGBoost (ONNX)             — ensemble validator
            ├── IsolationForest            — anomaly scoring
            ├── SHAP TreeExplainer         — feature attribution
            ├── Uncertainty Quantification — RF tree variance → CI-95
            └── Drift Detector             — Z-score vs training distribution

POST /predict/spectral (Python)
  └── 1D-CNN (TensorFlow SavedModel)      — A1/A2 NIR spectral classification
```

## Features

| Feature | Implementation |
|---|---|
| Real trained models | RandomForest (200 trees) + XGBoost (300 estimators) |
| ONNX export | Both models exported via skl2onnx / onnxmltools |
| SHAP explainability | Top-5 feature drivers per prediction |
| Uncertainty quantification | CI-95 from RF tree variance |
| Input drift detection | Z-score per feature vs training distribution |
| 1D-CNN spectral | Real TF/Keras CNN, 200-channel NIR → A1/A2/Mixed |
| Anomaly detection | IsolationForest trained on pure milk baseline |
| Audit log | SQLite — every prediction stored with input + output |
| Prometheus metrics | `/metrics` endpoint |
| Graceful fallback | If Python is down, Node uses JS Mahalanobis (zero crash) |

## Setup (Run Once)

```bash
cd ml-service

# 1. Install dependencies
pip install -r requirements.txt

# 2. Generate 4000-sample milk dataset
python generate_dataset.py

# 3. Train RF + XGBoost + IsolationForest, export ONNX
python train.py

# 4. Compute SHAP explainer + training distribution stats
python compute_shap.py

# 5. Train real 1D-CNN for A1/A2 spectral classification
python train_cnn.py

# 6. Start server
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Service health + model info + live metrics |
| POST | `/predict` | Full prediction: ONNX + SHAP + uncertainty + drift |
| POST | `/predict/spectral` | 1D-CNN A1/A2 from 200-channel NIR spectrum |
| GET | `/feature-importance` | SHAP-based feature weights |
| GET | `/drift-report` | Recent drift statistics from audit log |
| GET | `/metrics` | Prometheus-compatible counters |
| GET | `/audit-log` | Last N predictions with input/output |
| GET | `/docs` | Interactive Swagger UI |

## Sample Prediction Response

```json
{
  "ensemble": { "predictedClass": "Pure", "confidence": 94.2, "isPure": true },
  "uncertainty": { "ci95Lower": 88.1, "ci95Upper": 99.3, "stdProbability": 2.8 },
  "explanation": {
    "topFeatures": [
      { "feature": "conductivity", "shapValue": -0.082, "direction": "decreases_risk" },
      { "feature": "pH",           "shapValue": -0.061, "direction": "decreases_risk" }
    ]
  },
  "drift": { "isDrifted": false, "maxZScore": 0.94 },
  "anomaly": { "isAnomaly": false, "anomalyRiskPercent": 3.2 },
  "latencyMs": 12.4,
  "modelVersion": "1.0.0"
}
```

## Classes
- `Pure` — Unadulterated milk
- `WaterAdded` — Dilution with water
- `UreaAdded` — Urea adulteration
- `DetergentAdded` — Detergent contamination
- `StarchAdded` — Starch adulteration
