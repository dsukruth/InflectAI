"""Price history series for chart UI — uses Yahoo Finance v8 API directly."""

from __future__ import annotations

import json
import urllib.request
from datetime import datetime

from app.agents.base_agent import BaseAgent

_YF_BASE = "https://query1.finance.yahoo.com/v8/finance/chart"
_HEADERS = {"User-Agent": "Mozilla/5.0 (compatible; inflect-chart/1.0)"}

# timeframe string → (yf range, yf interval)
_TIMEFRAME_MAP: dict[str, tuple[str, str]] = {
    "1d":  ("1d",  "5m"),
    "5d":  ("5d",  "15m"),
    "1mo": ("1mo", "1d"),
    "3mo": ("3mo", "1d"),
    "6mo": ("6mo", "1wk"),
    "1y":  ("1y",  "1wk"),
    "5y":  ("5y",  "1mo"),
    "max": ("max", "1mo"),
}
_DEFAULT_RANGE = "6mo"
_DEFAULT_INTERVAL = "1d"


def _fetch_candles(ticker: str, range_: str, interval: str) -> dict:
    url = f"{_YF_BASE}/{ticker.upper()}?interval={interval}&range={range_}"
    req = urllib.request.Request(url, headers=_HEADERS)
    with urllib.request.urlopen(req, timeout=12) as resp:
        return json.load(resp)


def _resolve_timeframe(timeframe: str | None) -> tuple[str, str]:
    if not timeframe:
        return _DEFAULT_RANGE, _DEFAULT_INTERVAL
    tf = timeframe.lower().replace(" ", "")
    # Try direct match first
    if tf in _TIMEFRAME_MAP:
        return _TIMEFRAME_MAP[tf]
    # Keyword fallback
    if "5y" in tf or "5 y" in tf:
        return _TIMEFRAME_MAP["5y"]
    if "1y" in tf or "year" in tf:
        return _TIMEFRAME_MAP["1y"]
    if "6m" in tf:
        return _TIMEFRAME_MAP["6mo"]
    if "3m" in tf:
        return _TIMEFRAME_MAP["3mo"]
    if "1m" in tf or "month" in tf:
        return _TIMEFRAME_MAP["1mo"]
    if "5d" in tf or "week" in tf:
        return _TIMEFRAME_MAP["5d"]
    if "1d" in tf or "day" in tf:
        return _TIMEFRAME_MAP["1d"]
    return _DEFAULT_RANGE, _DEFAULT_INTERVAL


def _chart_series(
    ticker: str,
    metric: str | None = None,
    timeframe: str | None = None,
) -> dict:
    t = ticker.upper().strip()
    range_, interval = _resolve_timeframe(timeframe)

    try:
        data = _fetch_candles(t, range_, interval)
        result = data["chart"]["result"]
        if not result:
            raise ValueError("No chart data returned from Yahoo Finance")

        chart = result[0]
        timestamps: list[int] = chart.get("timestamp") or []
        closes: list[float] = chart["indicators"]["quote"][0].get("close") or []

        # Filter out null closes
        pairs = [(ts, c) for ts, c in zip(timestamps, closes) if c is not None]
        if not pairs:
            raise ValueError("All close values are null")

        x = [datetime.utcfromtimestamp(ts).strftime("%Y-%m-%d") for ts, _ in pairs]
        y = [round(c, 4) for _, c in pairs]

        # Evenly-spaced filing date markers (cosmetic)
        filing_dates: list[str] = []
        if len(x) >= 4:
            filing_dates = [x[len(x) // 4], x[3 * len(x) // 4]]

        return {"x": x, "y": y, "filingDates": filing_dates}

    except Exception as exc:
        return {"x": [], "y": [], "filingDates": [], "error": str(exc)}


class ChartAgent(BaseAgent):
    name = "chart"

    async def run(self, input: dict) -> dict:
        return _chart_series(
            input.get("ticker") or "",
            input.get("metric"),
            input.get("timeframe"),
        )
