"""
MilkoSense — ML Model Training & ONNX Export
=============================================
Trains:
  1. RandomForest  — primary adulteration classifier
  2. XGBoost       — ensemble validator
  3. IsolationForest — unsupervised anomaly detector

Exports:
  • adulteration_rf.onnx   — RandomForest → ONNX
  • adulteration_xgb.onnx  — XGBoost → ONNX
  • scaler.pkl             — StandardScaler (for inference normalization)
  • label_encoder.pkl      — LabelEncoder
  • model_meta.json        — accuracy, feature names, class names, version
"""

import json
import pickle
import numpy as np
import pandas as pd
from pathlib import Path
from datetime import datetime

from sklearn.ensemble import RandomForestClassifier, IsolationForest
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score
import xgboost as xgb

# ONNX export
from skl2onnx import convert_sklearn
from skl2onnx.common.data_types import FloatTensorType
from skl2onnx.proto import onnx_proto

# ─── Paths ────────────────────────────────────────────────────────────────────
BASE = Path(__file__).parent
DATA_PATH    = BASE / 'data' / 'milk_dataset.csv'
MODELS_PATH  = BASE / 'models'
MODELS_PATH.mkdir(exist_ok=True)

# ─── Load dataset ─────────────────────────────────────────────────────────────
print("📂 Loading dataset...")
df = pd.read_csv(DATA_PATH)

FEATURES = [
    'pH', 'fat', 'SNF', 'protein', 'lactose', 'density',
    'conductivity', 'refractiveIndex', 'turbidity', 'temperature',
    'color_L', 'color_a', 'color_b', 'tvc_log'
]

X = df[FEATURES].values.astype(np.float32)
y_raw = df['label_name'].values

le = LabelEncoder()
y = le.fit_transform(y_raw)
CLASS_NAMES = list(le.classes_)
print(f"   Classes: {CLASS_NAMES}")
print(f"   Samples: {len(X)}, Features: {len(FEATURES)}")

# ─── Preprocess ───────────────────────────────────────────────────────────────
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X).astype(np.float32)

X_train, X_test, y_train, y_test = train_test_split(
    X_scaled, y, test_size=0.2, random_state=42, stratify=y
)

# ─── 1. RandomForest ──────────────────────────────────────────────────────────
print("\n🌳 Training RandomForest...")
rf = RandomForestClassifier(
    n_estimators=200,
    max_depth=12,
    min_samples_split=4,
    min_samples_leaf=2,
    class_weight='balanced',
    random_state=42,
    n_jobs=-1
)
rf.fit(X_train, y_train)
rf_pred = rf.predict(X_test)
rf_acc  = accuracy_score(y_test, rf_pred)
rf_cv   = cross_val_score(rf, X_scaled, y, cv=5, scoring='accuracy').mean()
print(f"   Test Accuracy:  {rf_acc:.4f}")
print(f"   5-Fold CV Mean: {rf_cv:.4f}")
print(classification_report(y_test, rf_pred, target_names=CLASS_NAMES))

# ─── 2. XGBoost ───────────────────────────────────────────────────────────────
print("\n🚀 Training XGBoost...")
xgb_model = xgb.XGBClassifier(
    n_estimators=300,
    max_depth=6,
    learning_rate=0.05,
    subsample=0.8,
    colsample_bytree=0.8,
    use_label_encoder=False,
    eval_metric='mlogloss',
    random_state=42,
    n_jobs=-1
)
xgb_model.fit(X_train, y_train, eval_set=[(X_test, y_test)], verbose=False)
xgb_pred = xgb_model.predict(X_test)
xgb_acc  = accuracy_score(y_test, xgb_pred)
print(f"   Test Accuracy: {xgb_acc:.4f}")
print(classification_report(y_test, xgb_pred, target_names=CLASS_NAMES))

# ─── 3. IsolationForest (Anomaly Detector) ────────────────────────────────────
print("\n🔍 Training IsolationForest (unsupervised anomaly detector)...")
pure_idx = np.where(y_train == le.transform(['Pure'])[0])[0]
X_pure   = X_train[pure_idx]

iso = IsolationForest(
    n_estimators=200,
    contamination=0.05,
    random_state=42,
    n_jobs=-1
)
iso.fit(X_pure)
# Score: positive = more normal, negative = anomaly
iso_scores = iso.score_samples(X_test)
print(f"   IsolationForest trained on {len(X_pure)} pure samples")
print(f"   Anomaly score range: [{iso_scores.min():.3f}, {iso_scores.max():.3f}]")

# ─── ONNX Export — RandomForest ───────────────────────────────────────────────
print("\n📦 Exporting RandomForest → ONNX...")
initial_type = [('float_input', FloatTensorType([None, len(FEATURES)]))]
rf_onnx = convert_sklearn(rf, initial_types=initial_type, target_opset=12)
rf_onnx_path = MODELS_PATH / 'adulteration_rf.onnx'
with open(rf_onnx_path, 'wb') as f:
    f.write(rf_onnx.SerializeToString())
print(f"   Saved → {rf_onnx_path}")

# ─── ONNX Export — XGBoost ────────────────────────────────────────────────────
print("📦 Exporting XGBoost → ONNX...")
from onnxmltools import convert_xgboost
from onnxmltools.convert.common.data_types import FloatTensorType as OMLFloatTensorType
xgb_onnx = convert_xgboost(
    xgb_model,
    initial_types=[('float_input', OMLFloatTensorType([None, len(FEATURES)]))]
)
xgb_onnx_path = MODELS_PATH / 'adulteration_xgb.onnx'
with open(xgb_onnx_path, 'wb') as f:
    f.write(xgb_onnx.SerializeToString())
print(f"   Saved → {xgb_onnx_path}")

# ─── Save Scaler & Encoders ───────────────────────────────────────────────────
with open(MODELS_PATH / 'scaler.pkl', 'wb') as f:
    pickle.dump(scaler, f)
with open(MODELS_PATH / 'label_encoder.pkl', 'wb') as f:
    pickle.dump(le, f)
with open(MODELS_PATH / 'isolation_forest.pkl', 'wb') as f:
    pickle.dump(iso, f)
# Save RF pkl for SHAP explainer (compute_shap.py uses this)
with open(MODELS_PATH / 'rf_model.pkl', 'wb') as f:
    pickle.dump(rf, f)
print("💾 Saved scaler.pkl, label_encoder.pkl, isolation_forest.pkl, rf_model.pkl")

# ─── Feature Importance ───────────────────────────────────────────────────────
feat_importance = dict(zip(FEATURES, rf.feature_importances_.round(4)))
feat_sorted = dict(sorted(feat_importance.items(), key=lambda x: x[1], reverse=True))
print("\n📊 Feature Importance (RandomForest):")
for feat, imp in feat_sorted.items():
    bar = '█' * int(imp * 100)
    print(f"   {feat:<20} {imp:.4f}  {bar}")

# ─── Model Metadata ───────────────────────────────────────────────────────────
meta = {
    "version": "1.0.0",
    "trained_at": datetime.utcnow().isoformat() + "Z",
    "dataset_size": len(df),
    "features": FEATURES,
    "classes": CLASS_NAMES,
    "n_classes": len(CLASS_NAMES),
    "models": {
        "random_forest": {
            "test_accuracy": round(rf_acc, 4),
            "cv_mean_accuracy": round(rf_cv, 4),
            "n_estimators": 200,
            "onnx_file": "adulteration_rf.onnx"
        },
        "xgboost": {
            "test_accuracy": round(xgb_acc, 4),
            "n_estimators": 300,
            "onnx_file": "adulteration_xgb.onnx"
        },
        "isolation_forest": {
            "type": "unsupervised_anomaly_detection",
            "trained_on_pure_samples": int(len(X_pure)),
            "pkl_file": "isolation_forest.pkl"
        }
    },
    "feature_importance": feat_sorted
}

with open(MODELS_PATH / 'model_meta.json', 'w') as f:
    json.dump(meta, f, indent=2)
print(f"\n✅ Training complete! Model metadata saved → {MODELS_PATH / 'model_meta.json'}")
print(f"   RF  accuracy: {rf_acc:.2%}")
print(f"   XGB accuracy: {xgb_acc:.2%}")
