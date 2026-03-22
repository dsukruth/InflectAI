"""Finnhub REST helpers — data only."""

from __future__ import annotations

import os
from datetime import datetime, timedelta, timezone
from typing import Any

import httpx


def get_price_finnhub(ticker: str) -> float:
    key = os.getenv("FINNHUB_KEY_1", "")
    r = httpx.get(
        "https://finnhub.io/api/v1/quote",
        params={"symbol": ticker, "token": key},
        timeout=10,
    )
    return float(r.json().get("c", 0) or 0)


def get_live_news(ticker: str, days: int = 7, limit: int = 8) -> list[dict[str, Any]]:
    """
    Fetch recent company news from Finnhub.
    Returns list of dicts: headline, summary, source, url, published_at, sentiment (None — scored later).
    Falls back to empty list on error or missing key.
    """
    key = os.getenv("FINNHUB_KEY", "") or os.getenv("FINNHUB_KEY_1", "")
    if not key:
        return []
    today = datetime.now(timezone.utc).date()
    from_date = (today - timedelta(days=days)).isoformat()
    to_date = today.isoformat()
    try:
        r = httpx.get(
            "https://finnhub.io/api/v1/company-news",
            params={"symbol": ticker.upper(), "from": from_date, "to": to_date, "token": key},
            timeout=10,
        )
        if r.status_code != 200:
            return []
        articles = r.json() or []
        result = []
        for a in articles[:limit]:
            headline = (a.get("headline") or "").strip()
            if not headline:
                continue
            result.append({
                "headline": headline,
                "summary": (a.get("summary") or "").strip()[:300],
                "source": a.get("source") or "",
                "url": a.get("url") or "",
                "published_at": datetime.fromtimestamp(a["datetime"], tz=timezone.utc).strftime("%Y-%m-%d")
                if a.get("datetime") else None,
                "sentiment": None,
            })
        return result
    except Exception:
        return []
