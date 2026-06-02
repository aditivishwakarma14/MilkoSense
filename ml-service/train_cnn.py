"""
MilkoSense — Real 1D-CNN for A1/A2 Spectral Classification
===========================================================
Trains a genuine TensorFlow/Keras 1D-CNN on synthetic NIR spectral data.

Input:  200-channel spectral fingerprint (simulating NIR spectrometer output)
Output: A1 / A2 / Mixed classification with confidence

Architecture:
  Conv1D(32) → BN → Conv1D(64) → BN → GlobalAvgPool → Dense(64) → Softmax(3)
"""

import numpy as np
import json
import os
from pathlib import Path

os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import classification_report

np.random.seed(42)
tf.random.set_seed(42)

N_CHANNELS = 200
N_PER_CLASS = 1000  # 1000 × 3 classes = 3000 samples

BASE        = Path(__file__).parent
MODELS_PATH = BASE / 'models'
MODELS_PATH.mkdir(exist_ok=True)

print("🧬 Generating synthetic NIR spectral dataset...")

# ── Spectral fingerprint generation per protein type ─────────────────────────
# NIR wavelengths 1000-2500nm mapped to 200 channels
# A2 milk: different beta-casein absorption peaks vs A1
def generate_spectrum(protein_type: str, n: int) -> np.ndarray:
    wavelengths = np.linspace(1000, 2500, N_CHANNELS)
    spectra = []
    for _ in range(n):
        # Base spectrum (all milk types share this)
        base = (0.3 * np.exp(-((wavelengths - 1450) ** 2) / (2 * 80**2)) +   # water band
                0.25 * np.exp(-((wavelengths - 1720) ** 2) / (2 * 60**2)) +  # fat band
                0.15 * np.exp(-((wavelengths - 2100) ** 2) / (2 * 100**2)))  # protein band

        if protein_type == 'A2':
            # A2: stronger 1725nm peak (different beta-casein structure)
            signal = base + 0.08 * np.exp(-((wavelengths - 1725) ** 2) / (2 * 30**2))
            signal += 0.04 * np.exp(-((wavelengths - 2180) ** 2) / (2 * 25**2))
        elif protein_type == 'A1':
            # A1: stronger 1715nm peak
            signal = base + 0.08 * np.exp(-((wavelengths - 1715) ** 2) / (2 * 30**2))
            signal += 0.03 * np.exp(-((wavelengths - 2160) ** 2) / (2 * 25**2))
        else:  # Mixed
            # Mixed: blend of both
            a1_comp = 0.04 * np.exp(-((wavelengths - 1715) ** 2) / (2 * 30**2))
            a2_comp = 0.04 * np.exp(-((wavelengths - 1725) ** 2) / (2 * 30**2))
            signal = base + a1_comp + a2_comp

        # Add realistic noise
        noise = np.random.normal(0, 0.005, N_CHANNELS)
        spectra.append((signal + noise).astype(np.float32))

    return np.array(spectra)

X_a2    = generate_spectrum('A2',    N_PER_CLASS)
X_a1    = generate_spectrum('A1',    N_PER_CLASS)
X_mixed = generate_spectrum('Mixed', N_PER_CLASS)

X = np.vstack([X_a2, X_a1, X_mixed])
y_raw = np.array(['A2'] * N_PER_CLASS + ['A1'] * N_PER_CLASS + ['Mixed'] * N_PER_CLASS)

le = LabelEncoder()
y = le.fit_transform(y_raw)
CLASS_NAMES = list(le.classes_)
print(f"   Classes: {CLASS_NAMES}, Samples: {len(X)}")

# Reshape for Conv1D: (samples, timesteps, channels)
X = X.reshape(-1, N_CHANNELS, 1)

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

# ── Model Architecture ────────────────────────────────────────────────────────
print("\n🧠 Building 1D-CNN architecture...")

model = keras.Sequential([
    layers.Input(shape=(N_CHANNELS, 1)),

    # Block 1
    layers.Conv1D(32, kernel_size=7, padding='same', activation='relu'),
    layers.BatchNormalization(),
    layers.Conv1D(32, kernel_size=5, padding='same', activation='relu'),
    layers.BatchNormalization(),
    layers.MaxPooling1D(pool_size=2),
    layers.Dropout(0.2),

    # Block 2
    layers.Conv1D(64, kernel_size=5, padding='same', activation='relu'),
    layers.BatchNormalization(),
    layers.Conv1D(64, kernel_size=3, padding='same', activation='relu'),
    layers.BatchNormalization(),
    layers.MaxPooling1D(pool_size=2),
    layers.Dropout(0.2),

    # Block 3
    layers.Conv1D(128, kernel_size=3, padding='same', activation='relu'),
    layers.BatchNormalization(),
    layers.GlobalAveragePooling1D(),

    # Classifier head
    layers.Dense(64, activation='relu'),
    layers.Dropout(0.3),
    layers.Dense(len(CLASS_NAMES), activation='softmax')
], name='MilkoSense_1DCNN_A1A2')

model.summary()

model.compile(
    optimizer=keras.optimizers.Adam(learning_rate=1e-3),
    loss='sparse_categorical_crossentropy',
    metrics=['accuracy']
)

callbacks = [
    keras.callbacks.EarlyStopping(patience=10, restore_best_weights=True, monitor='val_accuracy'),
    keras.callbacks.ReduceLROnPlateau(factor=0.5, patience=5, verbose=1)
]

print("\n🏋️  Training 1D-CNN...")
history = model.fit(
    X_train, y_train,
    epochs=60,
    batch_size=32,
    validation_split=0.15,
    callbacks=callbacks,
    verbose=1
)

# ── Evaluation ────────────────────────────────────────────────────────────────
test_loss, test_acc = model.evaluate(X_test, y_test, verbose=0)
print(f"\n📊 Test Accuracy: {test_acc:.4f}")

y_pred = np.argmax(model.predict(X_test, verbose=0), axis=1)
print(classification_report(y_test, y_pred, target_names=CLASS_NAMES))

# ── Save as TensorFlow SavedModel + TF.js ────────────────────────────────────
tf_path = MODELS_PATH / 'cnn_a1a2'
model.save(str(tf_path))
print(f"💾 TF SavedModel saved → {tf_path}")

# Save class names & metadata
cnn_meta = {
    "version":     "1.0.0",
    "model_type":  "1D-CNN",
    "task":        "A1/A2 Protein Classification",
    "n_channels":  N_CHANNELS,
    "classes":     CLASS_NAMES,
    "test_accuracy": round(float(test_acc), 4),
    "architecture": "Conv1D(32)→BN→Conv1D(32)→BN→Pool→Conv1D(64)→BN→Conv1D(64)→BN→Pool→Conv1D(128)→BN→GAP→Dense(64)→Softmax"
}
with open(MODELS_PATH / 'cnn_meta.json', 'w') as f:
    json.dump(cnn_meta, f, indent=2)

print(f"✅ 1D-CNN training complete! Accuracy: {test_acc:.2%}")
print(f"   Saved to: {tf_path}")
