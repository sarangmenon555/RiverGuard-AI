"""
Rainfall heatmap grid.

This samples live precipitation data from Open-Meteo across a grid of
points covering Keralam, to drive a rainfall intensity heatmap overlay on
the map. Open-Meteo blends satellite, radar, and model data depending on
region and is genuinely live — but it is not the same thing as directly
ingesting raw IMD or NASA GPM satellite tiles, which require registered
access (IMD) or an Earthdata login and heavier raster processing (NASA
GES DISC). This grid is a real, live, keyless approximation of the same
idea: a spatial rainfall surface rather than only per-district numbers.
"""

from datetime import datetime, timedelta

import httpx

GRID_LATS = [8.4, 9.2, 10.0, 10.8, 11.6, 12.4]
GRID_LONS = [75.0, 75.8, 76.6, 77.2]

_cache = {"data": None, "fetched_at": None}
_CACHE_TTL = timedelta(minutes=10)


async def _fetch_point(client: httpx.AsyncClient, lat: float, lon: float) -> dict:
    url = (
        "https://api.open-meteo.com/v1/forecast"
        f"?latitude={lat}&longitude={lon}"
        "&hourly=precipitation&past_days=1&forecast_days=1&timezone=Asia%2FKolkata"
    )
    try:
        resp = await client.get(url, timeout=10.0)
        resp.raise_for_status()
        data = resp.json()
        hourly = data.get("hourly", {}).get("precipitation", [])
        rain_24h = sum(hourly[-24:]) if len(hourly) >= 24 else sum(hourly)
    except Exception:
        rain_24h = 0.0
    return {"lat": lat, "lon": lon, "rain_24h": round(float(rain_24h), 1)}


async def get_rainfall_grid() -> list:
    now = datetime.utcnow()
    if _cache["data"] is not None and now - _cache["fetched_at"] < _CACHE_TTL:
        return _cache["data"]

    points = [(lat, lon) for lat in GRID_LATS for lon in GRID_LONS]
    async with httpx.AsyncClient() as client:
        import asyncio
        results = await asyncio.gather(
            *[_fetch_point(client, lat, lon) for lat, lon in points]
        )
        results = list(results)

    _cache["data"] = results
    _cache["fetched_at"] = now
    return results
