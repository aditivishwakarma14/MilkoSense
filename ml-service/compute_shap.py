"""
MilkoSense — SHAP Explainability Pre-computation
=================================================
Computes SHAP values for the RandomForest model and saves:
  - shap_explainer.pkl     (TreeExplainer — fast at inference)
  - shap_base_values.json  (expected output per class)
  - training_stats.json    (mean/std per feature — for drift detection)
"""

import pickle
import json
import numpy as np
import pandas as pd
import shap
from pathlib import Path

BASE        = Path(__file__).parent
MODELS_PATH = BASE / 'models'
DATA_PATH   = BASE / 'data' / 'milk_dataset.csv'

print("📂 Loading dataset and RandomForest model...")
df = pd.read_csv(DATA_PATH)

FEATURES = [
    'pH', 'fat', 'SNF', 'protein', 'lactose', 'density',
    'conductivity', 'refractiveIndex', 'turbidity', 'temperature',
    'color_L', 'color_a', 'color_b', 'tvc_log'
]

X = df[FEATURES].values.astype(np.float32)

with open(MODELS_PATH / 'scaler.pkl', 'rb') as f:
    scaler = pickle.load(f)

# Load RF from pickle (train.py also saves a pkl copy for SHAP)
try:
    with open(MODELS_PATH / 'rf_model.pkl', 'rb') as f:
        rf = pickle.load(f)
except FileNotFoundError:
    print("⚠️  rf_model.pkl not found. Re-training RF quickly...")
    from sklearn.ensemble import RandomForestClassifier
    from sklearn.preprocessing import LabelEncoder
    le = LabelEncoder()
    y = le.fit_transform(df['label_name'].values)
    X_scaled = scaler.transform(X).astype(np.float32)
    rf = RandomForestClassifier(n_estimators=200, max_depth=12, random_state=42, n_jobs=-1)
    rf.fit(X_scaled, y)
    with open(MODELS_PATH / 'rf_model.pkl', 'wb') as f:
        pickle.dump(rf, f)

X_scaled = scaler.transform(X).astype(np.float32)

# ── SHAP TreeExplainer ────────────────────────────────────────────────────────
print("🔍 Building SHAP TreeExplainer...")
explainer = shap.TreeExplainer(rf)

# Compute on a background sample (200 rows for speed)
bg_idx = np.random.choice(len(X_scaled), 200, replace=False)
X_bg = X_scaled[bg_idx]

print("   Computing SHAP values on background sample (this takes ~30s)...")
shap_values = explainer.shap_values(X_bg)  # shape: (n_classes, n_samples, n_features)

# Save explainer
with open(MODELS_PATH / 'shap_explainer.pkl', 'wb') as f:
    pickle.dump(explainer, f)
print(f"✅ SHAP explainer saved → {MODELS_PATH / 'shap_explainer.pkl'}")

# Base values (expected model output)
base_values = {
    "expected_values": [round(float(v), 4) for v in explainer.expected_value]
}
with open(MODELS_PATH / 'shap_base_values.json', 'w') as f:
    json.dump(base_values, f, indent=2)

# ── Training Distribution Stats (for drift detection) ────────────────────────
print("\n📊 Computing training feature statistics (for drift detection)...")
stats = {}
for feat in FEATURES:
    col = df[feat]
    stats[feat] = {
        "mean": round(float(col.mean()), 6),
        "std":  round(float(col.std()), 6),
        "min":  round(float(col.min()), 6),
        "max":  round(float(col.max()), 6),
        "p5":   round(float(col.quantile(0.05)), 6),
        "p95":  round(float(col.quantile(0.95)), 6)
    }

with open(MODELS_PATH / 'training_stats.json', 'w') as f:
    json.dump(stats, f, indent=2)
print(f"✅ Training stats saved → {MODELS_PATH / 'training_stats.json'}")
print("\nFeature distribution summary:")
for feat, s in stats.items():
    print(f"   {feat:<20} mean={s['mean']:.4f}  std={s['std']:.4f}")
