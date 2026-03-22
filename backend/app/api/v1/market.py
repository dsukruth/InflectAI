from fastapi import APIRouter, HTTPException
import httpx
import os
from datetime import datetime
import asyncio

router = APIRouter()

FINNHUB_KEY = os.getenv("FINNHUB_KEY_1", "")
FINNHUB_BASE = "https://finnhub.io/api/v1"

TICKER_LIST = [
    "AAPL", "MSFT", "NVDA", "AMZN", "GOOGL",
    "META", "TSLA", "AVGO", "AMD", "INTC",
    "JPM", "GS", "BAC", "V", "MA",
    "WMT", "COST", "MCD", "NKE", "SBUX",
    "JNJ", "UNH", "PFE", "ABBV", "MRK",
    "XOM", "CVX", "CAT", "BA", "RTX",
]


def get_stock_quote(ticker: str) -> dict:
    try:
        url = f"{FINNHUB_BASE}/quote"
        params = {
            "symbol": ticker.upper(),
            "token": FINNHUB_KEY
        }
        with httpx.Client(timeout=10) as client:
            response = client.get(url, params=params)
            data = response.json()

        price = float(data.get("c", 0) or 0)
        prev = float(data.get("pc", 0) or 0)
        change = float(data.get("dp", 0) or 0)
        high = float(data.get("h", 0) or 0)
        low = float(data.get("l", 0) or 0)

        return {
            "ticker": ticker.upper(),
            "price": round(price, 2),
            "change_percent": round(change, 2),
            "change": round(change, 2),
            "high": round(high, 2),
            "low": round(low, 2),
            "prev_close": round(prev, 2),
            "volume": 0,
            "direction": "up" if change >= 0 else "down",
            "timestamp": datetime.now().isoformat(),
            "market_open": True,
        }
    except Exception as e:
        return _yfinance_fallback(ticker, str(e))


def _yfinance_fallback(ticker: str, error: str) -> dict:
    try:
        import yfinance as yf
        stock = yf.Ticker(ticker)
        hist = stock.history(period="5d")
        if hist is not None and not hist.empty:
            price = float(hist['Close'].iloc[-1])
            prev = float(hist['Close'].iloc[-2]) if len(hist) >= 2 else price
            change = ((price - prev) / prev * 100) if prev else 0.0
            return {
                "ticker": ticker.upper(),
                "price": round(price, 2),
                "change_percent": round(change, 2),
                "change": round(change, 2),
                "volume": int(hist['Volume'].iloc[-1]),
                "direction": "up" if change >= 0 else "down",
                "timestamp": datetime.now().isoformat(),
                "market_open": True,
                "source": "yfinance_fallback"
            }
    except Exception:
        pass
    return {
        "ticker": ticker.upper(),
        "price": 0.0,
        "change_percent": 0.0,
        "change": 0.0,
        "volume": 0,
        "direction": "up",
        "timestamp": datetime.now().isoformat(),
        "error": error,
    }


def quote_to_ticker_bar_row(q: dict) -> dict:
    return {
        "ticker": q["ticker"],
        "price": q["price"],
        "change": q.get("change_percent", 0.0),
        "direction": q.get("direction", "up"),
    }


@router.get("/quote")
async def get_quote(ticker: str):
    return get_stock_quote(ticker.upper())


@router.get("/tickers")
async def get_ticker_bar():
    return [quote_to_ticker_bar_row(get_stock_quote(t)) for t in TICKER_LIST]


async def _get_stock_info(ticker: str) -> dict:
    """Fetch rich stock data from Finnhub: price, P/E, market cap, 52-week range."""
    key = FINNHUB_KEY
    if not key:
        raise HTTPException(status_code=500, detail="FINNHUB_KEY_1 not configured")

    params = {"symbol": ticker, "token": key}

    async with httpx.AsyncClient(timeout=10.0) as client:
        quote_res, profile_res, metrics_res = await asyncio.gather(
            client.get(f"{FINNHUB_BASE}/quote", params=params),
            client.get(f"{FINNHUB_BASE}/stock/profile2", params=params),
            client.get(f"{FINNHUB_BASE}/stock/metric", params={**params, "metric": "all"}),
        )

    quote = quote_res.json()
    profile = profile_res.json()
    metrics = metrics_res.json().get("metric", {})

    current = float(quote.get("c") or 0)
    prev = float(quote.get("pc") or 0)
    change = round(current - prev, 2)
    change_pct = round(float(quote.get("dp") or 0), 2)
    name = profile.get("name") or ticker
    market_cap_m = profile.get("marketCapitalization")  # Finnhub returns millions
    market_cap = market_cap_m * 1_000_000 if market_cap_m else None
    pe_ratio = metrics.get("peAnnual") or metrics.get("peTTM")
    week_52_high = metrics.get("52WeekHigh")
    week_52_low = metrics.get("52WeekLow")

    result = {
        "ticker": ticker,
        "name": name,
        "price": round(current, 2),
        "prev_close": round(prev, 2),
        "change": change,
        "change_percent": change_pct,
        "direction": "up" if change >= 0 else "down",
        "pe_ratio": round(pe_ratio, 2) if pe_ratio else None,
        "market_cap": int(market_cap) if market_cap else None,
        "week_52_high": week_52_high,
        "week_52_low": week_52_low,
        "volume": int(quote.get("v") or 0),
        "high": round(float(quote.get("h") or 0), 2),
        "low": round(float(quote.get("l") or 0), 2),
        "timestamp": datetime.now().isoformat(),
    }

    # Voice-friendly summary
    parts = [f"{name} ({ticker}) is trading at ${current:.2f}"]
    parts.append(f"{'up' if change >= 0 else 'down'} {abs(change_pct):.2f}% from yesterday's close of ${prev:.2f}")
    if pe_ratio:
        parts.append(f"P/E ratio is {pe_ratio:.1f}")
    if market_cap:
        parts.append(f"market cap is ${market_cap / 1e9:.1f}B")
    if week_52_high and week_52_low:
        parts.append(f"52-week range is ${week_52_low:.2f} to ${week_52_high:.2f}")
    result["summary"] = ". ".join(parts) + "."

    return result


async def _search_finnhub(q: str, client: httpx.AsyncClient) -> list[dict]:
    resp = await client.get(f"{FINNHUB_BASE}/search", params={"q": q, "token": FINNHUB_KEY})
    return resp.json().get("result", []) if resp.status_code == 200 else []


def _best_ticker(results: list[dict]) -> str | None:
    # Prefer US common stock without dots (no ADR/ETF suffixes)
    for r in results:
        if r.get("type") == "Common Stock" and "." not in r.get("symbol", ""):
            return r["symbol"]
    # Fallback: any result without a dot
    for r in results:
        if "." not in r.get("symbol", ""):
            return r["symbol"]
    return results[0]["symbol"] if results else None


async def _resolve_ticker(query: str) -> str:
    """Resolve a company name or ticker symbol to a canonical ticker.

    'Apple' -> 'AAPL', 'AAPL' -> 'AAPL', 'Tesla motors' -> 'TSLA'
    """
    q = query.strip()

    # Already looks like a ticker — use directly
    if q.upper() == q and len(q) <= 5 and q.isalpha():
        return q

    async with httpx.AsyncClient(timeout=10.0) as client:
        results = await _search_finnhub(q, client)

        # If multi-word query returned nothing, retry with first word only
        if not results and " " in q:
            results = await _search_finnhub(q.split()[0], client)

    ticker = _best_ticker(results)
    if ticker:
        return ticker

    raise HTTPException(status_code=404, detail=f"No ticker found for '{q}'")


@router.get("/stock-info")
async def get_stock_info(q: str):
    """Rich stock data: price, P/E, market cap, 52-week range, and voice summary.

    Accepts a ticker symbol OR company name:
      GET /api/v1/market/stock-info?q=AAPL
      GET /api/v1/market/stock-info?q=Apple
      GET /api/v1/market/stock-info?q=Tesla motors
    """
    ticker = await _resolve_ticker(q)
    return await _get_stock_info(ticker)


@router.get("/batch")
async def get_batch_quotes():
    results = [get_stock_quote(t) for t in TICKER_LIST]
    return {
        "quotes": results,
        "timestamp": datetime.now().isoformat(),
        "count": len(results),
    }