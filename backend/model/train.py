import json
import os
import sys

import numpy as np
import joblib
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score
from xgboost import XGBClassifier

sys.path.append(os.path.join(os.path.dirname(__file__), ".."))
from districts import DISTRICTS

FEATURES = [
    "rain_24h",
    "rain_72h",
    "river_level_ratio",
    "reservoir_pct",
    "soil_saturation",
    "elevation",
    "drainage_density",
    "antecedent_rain_7d",
    "distance_to_river",
    "urban_fraction",
    "slope",
]

# reservoir_pct is weighted deliberately close to river_level_ratio: the
# 2018 Kerala Floods story is largely a story about dam/reservoir
# management (54 of 61 dams releasing water in close succession), so
# reservoir state is treated as a first-class driver of risk, not a minor
# adjustment. All other weights are scaled down proportionally so the
# full set still sums to 1.0.
WEIGHTS = {
    "rain_24h": 0.2533,
    "rain_72h": 0.2448,
    "river_level_ratio": 0.2159,
    "reservoir_pct": 0.15,
    "soil_saturation": 0.0442,
    "elevation": 0.0221,
    "drainage_density": 0.0187,
    "antecedent_rain_7d": 0.017,
    "distance_to_river": 0.0153,
    "urban_fraction": 0.0111,
    "slope": 0.0077,
}

RNG = np.random.default_rng(42)
N_SAMPLES = 8000


def generate_sample():
    district = DISTRICTS[RNG.integers(0, len(DISTRICTS))]

    rain_24h = RNG.gamma(2.0, 25.0)
    rain_72h = rain_24h * RNG.uniform(1.8, 3.2)
    antecedent = RNG.gamma(1.5, 15.0)
    soil_saturation = np.clip(
        0.15 + antecedent / 400 + rain_72h / 600 + RNG.normal(0, 0.05), 0, 1
    )
    elevation = district["elevation_m"] * RNG.uniform(0.9, 1.1)
    drainage_density = district["drainage_density"] * RNG.uniform(0.85, 1.15)
    distance_to_river = district["distance_to_river_m"] * RNG.uniform(0.7, 1.3)
    urban_fraction = np.clip(district["urban_fraction"] * RNG.uniform(0.9, 1.1), 0, 1)
    slope = district["slope_deg"] * RNG.uniform(0.85, 1.15)

    base_level = 0.25
    rain_contrib = (rain_24h / 250) * 0.55 + (rain_72h / 500) * 0.35
    elevation_relief = np.clip(elevation / 1500, 0, 0.3)
    drainage_relief = drainage_density * 0.15
    river_level_ratio = np.clip(
        base_level + rain_contrib - elevation_relief - drainage_relief
        + RNG.normal(0, 0.05),
        0,
        1.4,
    )

    # Reservoir storage rises with recent and cumulative rainfall, plus a
    # baseline that varies independently (a reservoir can already be
    # nearly full from earlier in the season regardless of this week's
    # rain, or kept low by planned pre-monsoon drawdown).
    reservoir_pct = np.clip(
        30 + antecedent * 0.5 + rain_72h * 0.15 + RNG.normal(0, 15),
        0,
        100,
    )

    features = {
        "rain_24h": rain_24h,
        "rain_72h": rain_72h,
        "river_level_ratio": river_level_ratio,
        "reservoir_pct": reservoir_pct,
        "soil_saturation": soil_saturation,
        "elevation": elevation,
        "drainage_density": drainage_density,
        "antecedent_rain_7d": antecedent,
        "distance_to_river": distance_to_river,
        "urban_fraction": urban_fraction,
        "slope": slope,
    }

    norm = {
        "rain_24h": rain_24h / 150,
        "rain_72h": rain_72h / 350,
        "river_level_ratio": river_level_ratio,
        "reservoir_pct": reservoir_pct / 100,
        "soil_saturation": soil_saturation,
        "elevation": 1 - np.clip(elevation / 1500, 0, 1),
        "drainage_density": 1 - drainage_density,
        "antecedent_rain_7d": antecedent / 120,
        "distance_to_river": 1 - np.clip(distance_to_river / 1000, 0, 1),
        "urban_fraction": urban_fraction,
        "slope": 1 - np.clip(slope / 25, 0, 1),
    }

    score = sum(WEIGHTS[k] * np.clip(norm[k], 0, 1.3) for k in WEIGHTS)
    score += RNG.normal(0, 0.04)

    if score < 0.38:
        label = 0
    elif score < 0.60:
        label = 1
    else:
        label = 2

    return features, label


def main():
    X = []
    y = []
    for _ in range(N_SAMPLES):
        feats, label = generate_sample()
        X.append([feats[f] for f in FEATURES])
        y.append(label)

    X = np.array(X)
    y = np.array(y)

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.15, random_state=42, stratify=y
    )

    scaler = StandardScaler()
    X_train_s = scaler.fit_transform(X_train)
    X_test_s = scaler.transform(X_test)

    rf = RandomForestClassifier(
        n_estimators=200, max_depth=12, random_state=42, n_jobs=-1
    )
    rf.fit(X_train_s, y_train)

    gb = XGBClassifier(
        n_estimators=150,
        max_depth=5,
        learning_rate=0.08,
        random_state=42,
        eval_metric="mlogloss",
    )
    gb.fit(X_train_s, y_train)

    rf_acc = accuracy_score(y_test, rf.predict(X_test_s))
    gb_acc = accuracy_score(y_test, gb.predict(X_test_s))

    rf_proba = rf.predict_proba(X_test_s)
    gb_proba = gb.predict_proba(X_test_s)
    ensemble_proba = 0.55 * rf_proba + 0.45 * gb_proba
    ensemble_pred = np.argmax(ensemble_proba, axis=1)
    ensemble_acc = accuracy_score(y_test, ensemble_pred)

    print(f"RandomForest accuracy: {rf_acc:.3f}")
    print(f"XGBoost accuracy: {gb_acc:.3f}")
    print(f"Ensemble accuracy: {ensemble_acc:.3f}")

    out_dir = os.path.join(os.path.dirname(__file__), "artifacts")
    os.makedirs(out_dir, exist_ok=True)

    joblib.dump(rf, os.path.join(out_dir, "rf_model.pkl"))
    joblib.dump(gb, os.path.join(out_dir, "gb_model.pkl"))
    joblib.dump(scaler, os.path.join(out_dir, "scaler.pkl"))

    importances = dict(zip(FEATURES, rf.feature_importances_.tolist()))
    with open(os.path.join(out_dir, "feature_importance.json"), "w") as f:
        json.dump(importances, f, indent=2)

    with open(os.path.join(out_dir, "features.json"), "w") as f:
        json.dump(
            {"features": FEATURES, "weights": WEIGHTS, "ensemble_accuracy": ensemble_acc},
            f,
            indent=2,
        )

    print(f"Artifacts saved to {out_dir}")


if __name__ == "__main__":
    main()
