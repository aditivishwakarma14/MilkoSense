"""
MilkoSense — Synthetic Milk Dataset Generator
=============================================
Generates a statistically realistic dataset of 4000 milk samples.

Classes (adulteration types):
  0 = Pure
  1 = Water Added
  2 = Urea Added
  3 = Detergent Added
  4 = Starch Added

Features based on real dairy science literature:
  pH, fat, SNF, protein, lactose, density, conductivity,
  refractiveIndex, turbidity, temperature, color_L, color_a, color_b,
  tvc_log (log10 of total viable count)
"""

import numpy as np
import pandas as pd
from pathlib import Path

np.random.seed(42)

N_PER_CLASS = 800   # 800 × 5 classes = 4000 total samples

# ─── Parameter distributions per class ───────────────────────────────────────
# Format: (mean, std)  — derived from FSSAI & dairy science literature

PARAMS = {
    # Feature:          Pure           WaterAdded      UreaAdded       DetergentAdded  StarchAdded
    'pH':             [(6.65, 0.10), (6.80, 0.12),  (7.20, 0.18),   (8.50, 0.30),   (6.70, 0.12)],
    'fat':            [(4.20, 0.35), (2.80, 0.40),  (4.10, 0.40),   (3.90, 0.50),   (4.00, 0.38)],
    'SNF':            [(8.70, 0.30), (6.50, 0.45),  (9.10, 0.35),   (8.40, 0.40),   (9.80, 0.50)],
    'protein':        [(3.30, 0.20), (2.20, 0.25),  (3.40, 0.22),   (3.10, 0.28),   (3.25, 0.20)],
    'lactose':        [(4.80, 0.20), (3.50, 0.30),  (4.75, 0.22),   (4.60, 0.25),   (4.70, 0.20)],
    'density':        [(1.032,0.001),(1.024,0.002), (1.033,0.001),  (1.029,0.002),  (1.034,0.002)],
    'conductivity':   [(4.50, 0.30), (3.20, 0.40),  (6.80, 0.60),   (8.50, 0.80),   (4.55, 0.35)],
    'refractiveIndex':[(1.3425,5e-4),(1.3380,6e-4), (1.3430,5e-4),  (1.3400,6e-4),  (1.3440,5e-4)],
    'turbidity':      [(15.0, 3.0),  (8.0,  2.5),   (16.0, 3.5),    (35.0, 8.0),    (28.0, 6.0)],
    'temperature':    [(4.50, 0.50), (4.60, 0.55),  (4.50, 0.50),   (4.55, 0.52),   (4.50, 0.50)],
    'color_L':        [(90.5, 1.5),  (92.0, 2.0),   (90.0, 1.8),    (88.0, 3.0),    (89.0, 2.5)],
    'color_a':        [(-2.3, 0.4),  (-2.0, 0.5),   (-2.4, 0.4),    (-3.0, 0.6),    (-2.5, 0.5)],
    'color_b':        [(7.5,  0.8),  (6.0,  1.0),   (7.4,  0.9),    (6.8,  1.2),    (7.2,  0.9)],
    'tvc_log':        [(4.10, 0.40), (4.50, 0.50),  (4.20, 0.45),   (4.80, 0.60),   (4.30, 0.45)],
}

CLASS_NAMES = ['Pure', 'WaterAdded', 'UreaAdded', 'DetergentAdded', 'StarchAdded']

rows = []
for class_idx, class_name in enumerate(CLASS_NAMES):
    for _ in range(N_PER_CLASS):
        row = {'label': class_idx, 'label_name': class_name}
        for feature, distributions in PARAMS.items():
            mean, std = distributions[class_idx]
            row[feature] = np.random.normal(mean, std)
        rows.append(row)

df = pd.DataFrame(rows).sample(frac=1, random_state=42).reset_index(drop=True)

# Clip physiologically impossible values
df['pH']          = df['pH'].clip(5.5, 10.0)
df['fat']         = df['fat'].clip(0.5, 8.0)
df['SNF']         = df['SNF'].clip(5.0, 12.0)
df['protein']     = df['protein'].clip(1.0, 5.0)
df['lactose']     = df['lactose'].clip(1.5, 6.5)
df['density']     = df['density'].clip(1.010, 1.045)
df['conductivity']= df['conductivity'].clip(1.0, 15.0)
df['turbidity']   = df['turbidity'].clip(1.0, 80.0)
df['tvc_log']     = df['tvc_log'].clip(3.0, 8.0)

out_path = Path(__file__).parent / 'data' / 'milk_dataset.csv'
out_path.parent.mkdir(exist_ok=True)
df.to_csv(out_path, index=False)

print(f"✅ Dataset generated: {len(df)} samples → {out_path}")
print(df['label_name'].value_counts())
print("\nFeature stats:")
print(df.drop(columns=['label','label_name']).describe().round(3))
