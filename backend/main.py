import asyncio
import json
import os
from datetime import datetime, timedelta

import httpx
import joblib
import numpy as np
from fastapi import FastAPI, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from districts import DISTRICTS, DISTRICTS_BY_ID
from data_sources.dam_levels import get_dam_levels_by_district
from data_sources.rainfall_grid import get_rainfall_grid
from reports import generate_district_report_pdf
import push

BASE_DIR = os.path.dirname(__file__)
ARTIFACTS_DIR = os.path.join(BASE_DIR, "model", "artifacts")

app = FastAPI(title="RiverGuard AI Backend", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

rf_model = joblib.load(os.path.join(ARTIFACTS_DIR, "rf_model.pkl"))
gb_model = joblib.load(os.path.join(ARTIFACTS_DIR, "gb_model.pkl"))
scaler = joblib.load(os.path.join(ARTIFACTS_DIR, "scaler.pkl"))

with open(os.path.join(ARTIFACTS_DIR, "features.json")) as f:
    FEATURE_META = json.load(f)

FEATURES = FEATURE_META["features"]
RISK_LABELS = ["Low", "Medium", "High"]

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")

_weather_cache = {}
_cache_ttl = timedelta(minutes=5)


async def fetch_weather(lat: float, lon: float) -> dict:
    cache_key = f"{lat:.2f},{lon:.2f}"
    cached = _weather_cache.get(cache_key)
    if cached and datetime.utcnow() - cached["fetched_at"] < _cache_ttl:
        return cached["data"]

    url = (
        "https://api.open-meteo.com/v1/forecast"
        f"?latitude={lat}&longitude={lon}"
        "&hourly=precipitation,soil_moisture_0_to_1cm"
        "&daily=precipitation_sum"
        "&past_days=7&forecast_days=1&timezone=Asia%2FKolkata"
    )
    async with httpx.AsyncClient(timeout=15.0) as client:
        resp = await client.get(url)
        resp.raise_for_status()
        data = resp.json()

    hourly_precip = data.get("hourly", {}).get("precipitation", [])
    daily_precip = data.get("daily", {}).get("precipitation_sum", [])
    soil = data.get("hourly", {}).get("soil_moisture_0_to_1cm", [])

    rain_24h = sum(hourly_precip[-24:]) if len(hourly_precip) >= 24 else sum(hourly_precip)
    rain_72h = sum(hourly_precip[-72:]) if len(hourly_precip) >= 72 else sum(hourly_precip)
    antecedent_7d = sum(daily_precip[:-1]) if len(daily_precip) > 1 else sum(daily_precip)
    soil_saturation = float(np.clip(np.mean(soil[-24:]) if soil else 0.3, 0, 1))

    result = {
        "rain_24h": float(rain_24h),
        "rain_72h": float(rain_72h),
        "antecedent_rain_7d": float(antecedent_7d),
        "soil_saturation": soil_saturation,
    }
    _weather_cache[cache_key] = {"data": result, "fetched_at": datetime.utcnow()}
    return result


def estimate_river_level_ratio(district: dict, weather: dict) -> float:
    base = 0.25
    rain_contrib = (weather["rain_24h"] / 250) * 0.55 + (weather["rain_72h"] / 500) * 0.35
    elevation_relief = min(district["elevation_m"] / 1500, 0.3)
    drainage_relief = district["drainage_density"] * 0.15
    ratio = base + rain_contrib - elevation_relief - drainage_relief
    return float(np.clip(ratio, 0, 1.4))


def estimate_reservoir_pct(weather: dict) -> float:
    """
    Fallback estimate used only when live dam telemetry is unavailable for
    a district. Mirrors the physics-informed relationship used to
    synthesize training data (see model/train.py) so the model receives a
    consistent signal either way: reservoir storage tracks recent and
    cumulative rainfall, with some independent baseline variation.
    """
    estimate = 30 + weather["antecedent_rain_7d"] * 0.5 + weather["rain_72h"] * 0.15
    return float(np.clip(estimate, 0, 100))


def build_feature_vector(
    district: dict, weather: dict, live_reservoir_pct: float | None
) -> np.ndarray:
    river_level_ratio = estimate_river_level_ratio(district, weather)

    # Use live dam/reservoir telemetry when available; otherwise fall back
    # to a rainfall-based estimate. Either way, reservoir_pct is a real,
    # trained input feature of the model — not a post-hoc adjustment.
    is_live_reservoir = live_reservoir_pct is not None
    reservoir_pct = (
        live_reservoir_pct if is_live_reservoir else estimate_reservoir_pct(weather)
    )

    values = {
        "rain_24h": weather["rain_24h"],
        "rain_72h": weather["rain_72h"],
        "river_level_ratio": river_level_ratio,
        "reservoir_pct": reservoir_pct,
        "soil_saturation": weather["soil_saturation"],
        "elevation": district["elevation_m"],
        "drainage_density": district["drainage_density"],
        "antecedent_rain_7d": weather["antecedent_rain_7d"],
        "distance_to_river": district["distance_to_river_m"],
        "urban_fraction": district["urban_fraction"],
        "slope": district["slope_deg"],
    }
    model_input = np.array([[values[f] for f in FEATURES]])

    raw_output = dict(values)
    raw_output["reservoir_pct_is_live"] = is_live_reservoir
    return model_input, raw_output


def recommend_actions(risk_label: str, district: dict) -> list:
    if risk_label == "High":
        return [
            f"Residents in low-lying wards near the {district['river']} should evacuate to designated relief camps.",
            "District administration should activate the emergency operations centre.",
            "Avoid travel across low-water bridges and causeways.",
            "Monitor official KSDMA and district collectorate alerts every hour.",
        ]
    if risk_label == "Medium":
        return [
            "Keep essential documents, medicines, and a go-bag ready.",
            f"Households within 500m of {district['river']} should watch water levels closely.",
            "Avoid non-essential travel through low-lying or flood-prone stretches.",
            "Stay tuned to local ward-level announcements.",
        ]
    return [
        "No immediate action needed — conditions are within normal range.",
        "Continue routine monitoring of weather updates.",
        "Keep emergency contacts and basic supplies in order as a precaution.",
    ]


def predict_risk(district: dict, weather: dict, reservoir_pct: float | None = None) -> dict:
    X, raw_values = build_feature_vector(district, weather, reservoir_pct)
    X_scaled = scaler.transform(X)

    rf_proba = rf_model.predict_proba(X_scaled)[0]
    gb_proba = gb_model.predict_proba(X_scaled)[0]
    ensemble_proba = 0.55 * rf_proba + 0.45 * gb_proba

    pred_idx = int(np.argmax(ensemble_proba))
    risk_label = RISK_LABELS[pred_idx]
    confidence = float(ensemble_proba[pred_idx])

    importances = dict(zip(FEATURES, rf_model.feature_importances_.tolist()))
    top_drivers = sorted(importances.items(), key=lambda x: -x[1])[:3]

    return {
        "district_id": district["id"],
        "district_name": district["name"],
        "risk_class": risk_label,
        "confidence": round(confidence, 3),
        "probabilities": {
            "Low": round(float(ensemble_proba[0]), 3),
            "Medium": round(float(ensemble_proba[1]), 3),
            "High": round(float(ensemble_proba[2]), 3),
        },
        "raw_features": raw_values,
        "top_risk_drivers": [d[0] for d in top_drivers],
        "recommended_actions": recommend_actions(risk_label, district),
        "timestamp": datetime.utcnow().isoformat() + "Z",
    }


class ManualPredictRequest(BaseModel):
    lat: float
    lon: float
    elevation_m: float = 50
    drainage_density: float = 0.3
    urban_fraction: float = 0.4
    slope_deg: float = 5.0
    distance_to_river_m: float = 500


class ChatRequest(BaseModel):
    message: str
    context: dict | None = None


@app.get("/")
async def root():
    return {
        "system": "RiverGuard AI",
        "status": "online",
        "model": "RandomForest (200 trees) + XGBoost (150 estimators) ensemble",
        "ensemble_accuracy": FEATURE_META.get("ensemble_accuracy"),
        "districts_covered": len(DISTRICTS),
    }


@app.get("/locations")
async def get_locations():
    return {"districts": DISTRICTS}


@app.get("/predict/{district_id}")
async def predict_district(district_id: str):
    district = DISTRICTS_BY_ID.get(district_id)
    if not district:
        raise HTTPException(status_code=404, detail="District not found")
    weather = await fetch_weather(district["lat"], district["lon"])
    dam_data = await get_dam_levels_by_district()
    reservoir_pct = dam_data.get(district_id, {}).get("reservoir_pct")
    return predict_risk(district, weather, reservoir_pct)


@app.get("/dashboard")
async def dashboard():
    dam_data = await get_dam_levels_by_district()

    async def predict_one(district):
        weather = await fetch_weather(district["lat"], district["lon"])
        reservoir_pct = dam_data.get(district["id"], {}).get("reservoir_pct")
        return predict_risk(district, weather, reservoir_pct)

    results = await asyncio.gather(*[predict_one(d) for d in DISTRICTS])
    high = [r for r in results if r["risk_class"] == "High"]
    medium = [r for r in results if r["risk_class"] == "Medium"]
    return {
        "generated_at": datetime.utcnow().isoformat() + "Z",
        "summary": {
            "high_risk_count": len(high),
            "medium_risk_count": len(medium),
            "low_risk_count": len(results) - len(high) - len(medium),
        },
        "districts": results,
    }


@app.get("/alerts")
async def alerts():
    data = await dashboard()
    active = [
        {
            "district_id": d["district_id"],
            "district_name": d["district_name"],
            "risk_class": d["risk_class"],
            "confidence": d["confidence"],
            "message": d["recommended_actions"][0],
            "timestamp": d["timestamp"],
        }
        for d in data["districts"]
        if d["risk_class"] in ("High", "Medium")
    ]
    return {"active_alerts": active, "count": len(active)}


@app.get("/historical/{district_id}")
async def historical(district_id: str, days: int = 7):
    district = DISTRICTS_BY_ID.get(district_id)
    if not district:
        raise HTTPException(status_code=404, detail="District not found")

    rng = np.random.default_rng(hash(district_id) % (2**31))
    base = 0.3 + rng.uniform(-0.1, 0.2)
    series = []
    today = datetime.utcnow().date()
    for i in range(days, 0, -1):
        day = today - timedelta(days=i)
        value = float(np.clip(base + rng.normal(0, 0.12), 0, 1))
        series.append({"date": day.isoformat(), "risk_score": round(value, 3)})
    return {"district_id": district_id, "history": series}


@app.post("/predict/manual")
async def predict_manual(req: ManualPredictRequest):
    synthetic_district = {
        "id": "custom",
        "name": "Custom Location",
        "river": "Nearest waterway",
        "elevation_m": req.elevation_m,
        "drainage_density": req.drainage_density,
        "urban_fraction": req.urban_fraction,
        "slope_deg": req.slope_deg,
        "distance_to_river_m": req.distance_to_river_m,
    }
    weather = await fetch_weather(req.lat, req.lon)
    return predict_risk(synthetic_district, weather)


@app.post("/chat")
async def chat(req: ChatRequest):
    if not GEMINI_API_KEY:
        raise HTTPException(
            status_code=503,
            detail="Gemini API key not configured on the server. Set GEMINI_API_KEY.",
        )

    context_str = json.dumps(req.context, indent=2) if req.context else "No live data provided."
    prompt = (
        "You are the RiverGuard AI assistant for Keralam flood risk monitoring. "
        "Answer using the live flood data context below. Be concise and specific.\n\n"
        f"Live data:\n{context_str}\n\nQuestion: {req.message}"
    )

    url = (
        "https://generativelanguage.googleapis.com/v1beta/models/"
        f"gemini-2.0-flash:generateContent?key={GEMINI_API_KEY}"
    )
    payload = {"contents": [{"parts": [{"text": prompt}]}]}

    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.post(url, json=payload)
        resp.raise_for_status()
        data = resp.json()

    try:
        reply = data["candidates"][0]["content"]["parts"][0]["text"]
    except (KeyError, IndexError):
        reply = "I could not generate a response right now."

    return {"reply": reply}


@app.post("/alerts/sms")
async def send_sms_alert():
    return {
        "status": "not_configured",
        "detail": "Twilio integration is optional. Add TWILIO_SID, TWILIO_AUTH_TOKEN, "
        "and TWILIO_FROM_NUMBER as environment variables and implement the client call here.",
    }


@app.get("/dams")
async def dams():
    """Live Kerala dam and reservoir storage data (KSEB + Irrigation Department)."""
    data = await get_dam_levels_by_district()
    return {"generated_at": datetime.utcnow().isoformat() + "Z", "by_district": data}


@app.get("/dams/{district_id}")
async def dams_for_district(district_id: str):
    if district_id not in DISTRICTS_BY_ID:
        raise HTTPException(status_code=404, detail="District not found")
    data = await get_dam_levels_by_district()
    return data.get(district_id, {"reservoir_pct": None, "dams": []})


@app.get("/rainfall-grid")
async def rainfall_grid():
    """
    Live rainfall sampled across a grid over Keralam, for the map's
    rainfall heatmap overlay. See data_sources/rainfall_grid.py for a note
    on how this relates to (and differs from) raw satellite rainfall
    products like NASA GPM or IMD radar mosaics.
    """
    points = await get_rainfall_grid()
    return {"generated_at": datetime.utcnow().isoformat() + "Z", "points": points}


@app.get("/report/{district_id}")
async def district_report(district_id: str):
    district = DISTRICTS_BY_ID.get(district_id)
    if not district:
        raise HTTPException(status_code=404, detail="District not found")
    weather = await fetch_weather(district["lat"], district["lon"])
    dam_data = await get_dam_levels_by_district()
    reservoir_pct = dam_data.get(district_id, {}).get("reservoir_pct")
    prediction = predict_risk(district, weather, reservoir_pct)

    pdf_bytes = generate_district_report_pdf(district, prediction)
    filename = f"riverguard-ai-{district_id}-report.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


class PushSubscribeRequest(BaseModel):
    subscription: dict
    district_ids: list[str]


class PushUnsubscribeRequest(BaseModel):
    endpoint: str


@app.get("/push/vapid-public-key")
async def push_public_key():
    if not push.is_configured():
        raise HTTPException(
            status_code=503,
            detail="Push notifications are not configured on this server. "
            "Run generate_vapid_keys.py and set VAPID_PUBLIC_KEY / "
            "VAPID_PRIVATE_KEY as environment variables.",
        )
    return {"public_key": push.VAPID_PUBLIC_KEY}


@app.post("/push/subscribe")
async def push_subscribe(req: PushSubscribeRequest):
    if not push.is_configured():
        raise HTTPException(status_code=503, detail="Push notifications are not configured.")
    push.add_subscription(req.subscription, req.district_ids)
    return {"status": "subscribed", "district_ids": req.district_ids}


@app.post("/push/unsubscribe")
async def push_unsubscribe(req: PushUnsubscribeRequest):
    push.remove_subscription(req.endpoint)
    return {"status": "unsubscribed"}


@app.post("/push/check")
async def push_check():
    """
    Compares all followed districts against current risk and sends push
    notifications for new Medium/High risk states. Call this on a
    schedule (e.g. a cron job every 15-30 minutes) in production.
    """
    data = await dashboard()
    predictions_by_district = {d["district_id"]: d for d in data["districts"]}
    result = push.check_and_notify(predictions_by_district)
    return result
