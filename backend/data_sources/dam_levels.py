"""
Live Kerala dam and reservoir storage data.

Source: amith-vp/Kerala-Dam-Water-Levels on GitHub
(https://github.com/amith-vp/Kerala-Dam-Water-Levels), a publicly
maintained, automatically updated (via GitHub Actions) mirror of Kerala
State Electricity Board (KSEB) and Irrigation Department dam telemetry.
This is real, live, dated data — not synthetic.

No API key is required. If the feed is briefly unreachable, callers should
fall back to rainfall-only estimation rather than failing the request.
"""

import math
from datetime import datetime, timedelta

import httpx

from districts import DISTRICTS

KSEB_LIVE_URL = (
    "https://raw.githubusercontent.com/amith-vp/Kerala-Dam-Water-Levels/"
    "main/live.json"
)
IRRIGATION_LIVE_URL = (
    "https://raw.githubusercontent.com/amith-vp/Kerala-Dam-Water-Levels/"
    "main/irrigation_live.json"
)

_cache: dict = {"data": None, "fetched_at": None}
_CACHE_TTL = timedelta(minutes=30)


def _nearest_district_id(lat: float, lon: float) -> str:
    best_id = None
    best_dist = float("inf")
    for d in DISTRICTS:
        dist = math.hypot(d["lat"] - lat, d["lon"] - lon)
        if dist < best_dist:
            best_dist = dist
            best_id = d["id"]
    return best_id


def _safe_float(value) -> float | None:
    try:
        if value in (None, "", "-"):
            return None
        return float(value)
    except (TypeError, ValueError):
        return None


async def _fetch_feed(url: str) -> dict:
    async with httpx.AsyncClient(timeout=12.0) as client:
        resp = await client.get(url)
        resp.raise_for_status()
        return resp.json()


async def get_dam_levels_by_district() -> dict:
    """
    Returns a mapping of district_id -> {
        "reservoir_pct": float | None,   # highest storage % among dams in that district
        "dams": [ { name, storage_pct, water_level, date, remarks }, ... ]
    }
    Returns an empty dict on any fetch failure — callers must treat that as
    "real dam data unavailable right now" and fall back gracefully.
    """
    now = datetime.utcnow()
    if _cache["data"] is not None and now - _cache["fetched_at"] < _CACHE_TTL:
        return _cache["data"]

    try:
        kseb = await _fetch_feed(KSEB_LIVE_URL)
        irrigation = await _fetch_feed(IRRIGATION_LIVE_URL)
    except Exception:
        return _cache["data"] or {}

    by_district: dict = {}

    for feed in (kseb, irrigation):
        for dam in feed.get("dams", []):
            lat = dam.get("latitude")
            lon = dam.get("longitude")
            if lat is None or lon is None:
                continue
            district_id = _nearest_district_id(float(lat), float(lon))

            series = dam.get("data") or []
            latest = series[-1] if series else {}
            storage_pct = _safe_float(latest.get("storagePercentage"))

            entry = {
                "name": dam.get("name"),
                "official_name": dam.get("officialName"),
                "storage_pct": storage_pct,
                "water_level": _safe_float(latest.get("waterLevel")),
                "date": latest.get("date"),
                "remarks": latest.get("remarks") or "",
            }

            bucket = by_district.setdefault(
                district_id, {"reservoir_pct": None, "dams": []}
            )
            bucket["dams"].append(entry)
            if storage_pct is not None:
                if bucket["reservoir_pct"] is None or storage_pct > bucket["reservoir_pct"]:
                    bucket["reservoir_pct"] = storage_pct

    _cache["data"] = by_district
    _cache["fetched_at"] = now
    return by_district
