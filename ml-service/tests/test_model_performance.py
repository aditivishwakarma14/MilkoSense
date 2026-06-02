"""
test_model_performance.py
─────────────────────────
Validates that both ONNX models meet minimum accuracy thresholds
on a held-out test split (random_state=99).
"""
import pickle
import numpy as np
import pandas as pd
import pytest
from pathlib import Path
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import accuracy_score, confusion_matrix
import onnxruntime as ort

BASE        = Path(__file__).parent.parent
MODELS_PATH = BASE / "models"
DATA_PATH   = BASE / "data" / "milk_dataset.csv"

FEATURES = [
    "pH", "fat", "SNF", "protein", "lactose", "density",
    "conductivity", "refractiveIndex", "turbidity", "temperature",
    "color_L", "color_a", "color_b", "tvc_log"
]

RF_MIN_ACCURACY  = 0.85
XGB_MIN_ACCURACY = 0.85
ENS_MIN_ACCURACY = 0.87

@pytest.fixture(scope="module")
def held_out_data():
    """50-sample held-out set with random_state=99 (never seen during training)."""
    df = pd.read_csv(DATA_PATH)
    le = LabelEncoder()
    y  = le.fit_transform(df["label_name"].values)
    X  = df[FEATURES].values.astype(np.float32)

    with open(MODELS_PATH / "scaler.pkl", "rb") as f:
        scaler = pickle.load(f)
    X_scaled = scaler.transform(X).astype(np.float32)

    _, X_test, _, y_test = train_test_split(
        X_scaled, y, test_size=50, random_state=99, stratify=y
    )
    return X_test, y_test, le.classes_

@pytest.fixture(scope="module")
def onnx_sessions():
    rf_session  = ort.InferenceSession(str(MODELS_PATH / "adulteration_rf.onnx"))
    xgb_session = ort.InferenceSession(str(MODELS_PATH / "adulteration_xgb.onnx"))
    return rf_session, xgb_session

def _predict_onnx(session, X):
    out = session.run(None, {session.get_inputs()[0].name: X})
    return np.array(out[0])

def _predict_ensemble_probs(rf_session, xgb_session, X):
    rf_out  = rf_session.run(None,  {rf_session.get_inputs()[0].name:  X})
    xgb_out = xgb_session.run(None, {xgb_session.get_inputs()[0].name: X})
    rf_probs  = np.array([[row.get(i, 0.0) for i in range(5)] for row in rf_out[1]])
    xgb_probs = np.array(xgb_out[1])
    return (rf_probs + xgb_probs) / 2.0

def test_rf_accuracy(held_out_data, onnx_sessions):
    X_test, y_test, classes = held_out_data
    rf_session, _ = onnx_sessions
    y_pred = _predict_onnx(rf_session, X_test)
    acc = accuracy_score(y_test, y_pred)
    print(f"\n[RF]  Accuracy on 50-sample held-out: {acc:.4f}")
    print(confusion_matrix(y_test, y_pred))
    assert acc >= RF_MIN_ACCURACY, \
        f"RandomForest accuracy {acc:.4f} below threshold {RF_MIN_ACCURACY}"

def test_xgb_accuracy(held_out_data, onnx_sessions):
    X_test, y_test, classes = held_out_data
    _, xgb_session = onnx_sessions
    y_pred = _predict_onnx(xgb_session, X_test)
    acc = accuracy_score(y_test, y_pred)
    print(f"\n[XGB] Accuracy on 50-sample held-out: {acc:.4f}")
    print(confusion_matrix(y_test, y_pred))
    assert acc >= XGB_MIN_ACCURACY, \
        f"XGBoost accuracy {acc:.4f} below threshold {XGB_MIN_ACCURACY}"

def test_ensemble_accuracy(held_out_data, onnx_sessions):
    X_test, y_test, _ = held_out_data
    rf_session, xgb_session = onnx_sessions
    ens_probs = _predict_ensemble_probs(rf_session, xgb_session, X_test)
    y_pred    = np.argmax(ens_probs, axis=1)
    acc = accuracy_score(y_test, y_pred)
    print(f"\n[ENS] Ensemble accuracy on 50-sample held-out: {acc:.4f}")
    print(confusion_matrix(y_test, y_pred))
    assert acc >= ENS_MIN_ACCURACY, \
        f"Ensemble accuracy {acc:.4f} below threshold {ENS_MIN_ACCURACY}"
