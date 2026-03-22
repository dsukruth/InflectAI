from fastapi import APIRouter, HTTPException
from datetime import datetime

from app.services.snowflake_rag_service import get_snowflake_connection, snowflake_configured

router = APIRouter()


def _get_quote_from_snowflake(ticker: str) -> dict:
    conn = get_snowflake_connection()
    try:
        cur = conn.cursor()
        cur.execute(
            """
            SELECT CLOSE_PRICE, OPEN_PRICE, HIGH_PRICE, LOW_PRICE, VOLUME, TRADE_DATE
            FROM PRICES
            WHERE TICKER = %s
            ORDER BY TRADE_DATE DESC
            LIMIT 2
            """,
            (ticker.upper(),),
        )
        rows = cur.fetchall()
        if not rows:
            return {}
        current = rows[0]
        prev_close = rows[1][0] if len(rows) > 1 else current[0]
        price = float(current[0])
        change = round(price - float(prev_close), 2)
        change_pct = round((change / float(prev_close)) * 100, 2) if prev_close else 0.0
        return {
            "ticker": ticker.upper(),
            "price": round(price, 2),
            "open": round(float(current[1]), 2),
            "high": round(float(current[2]), 2),
            "low": round(float(current[3]), 2),
            "volume": int(current[4]),
            "trade_date": str(current[5]),
            "change": change,
            "change_percent": change_pct,
            "prev_close": round(float(prev_close), 2),
            "direction": "up" if change >= 0 else "down",
            "timestamp": datetime.now().isoformat(),
        }
    finally:
        conn.close()


def _get_stock_info_from_snowflake(ticker: str) -> dict:
    conn = get_snowflake_connection()
    try:
        cur = conn.cursor()
        # Get fundamentals
        cur.execute(
            """
            SELECT TICKER, COMPANY_NAME, PE_RATIO, FORWARD_PE, EPS, REVENUE,
                   GROSS_MARGIN, PROFIT_MARGIN, MARKET_CAP, BETA, ROE, DIV_YIELD,
                   SECTOR, INDUSTRY, DESCRIPTION, HIGH_52W, LOW_52W, AVG_VOLUME,
                   PRICE_TO_BOOK, DEBT_EQUITY, CURRENT_RATIO, REVENUE_GROWTH,
                   EBITDA, CEO, EMPLOYEES, WEBSITE
            FROM FUNDAMENTALS
            WHERE TICKER = %s
            """,
            (ticker.upper(),),
        )
        row = cur.fetchone()
        if not row:
            return {}
        cols = [c[0].lower() for c in cur.description]
        data = dict(zip(cols, row))

        # Get latest price
        quote = _get_quote_from_snowflake(ticker)
        price = quote.get("price", 0)
        change_pct = quote.get("change_percent", 0)
        change = quote.get("change", 0)
        prev_close = quote.get("prev_close", price)

        # Get latest recommendations
        cur.execute(
            """
            SELECT STRONG_BUY, BUY, HOLD, SELL, STRONG_SELL
            FROM RECOMMENDATIONS
            WHERE TICKER = %s
            ORDER BY PERIOD DESC
            LIMIT 1
            """,
            (ticker.upper(),),
        )
        rec = cur.fetchone()

        name = data.get("company_name") or ticker.upper()
        market_cap = data.get("market_cap")
        pe = data.get("pe_ratio")
        high_52w = data.get("high_52w")
        low_52w = data.get("low_52w")

        parts = [f"{name} ({ticker.upper()}) is trading at ${price:.2f}"]
        parts.append(f"{'up' if change >= 0 else 'down'} {abs(change_pct):.2f}% from yesterday's close of ${prev_close:.2f}")
        if pe:
            parts.append(f"P/E ratio is {pe:.1f}")
        if market_cap:
            parts.append(f"market cap is ${market_cap / 1e9:.1f}B")
        if high_52w and low_52w:
            parts.append(f"52-week range is ${low_52w:.2f} to ${high_52w:.2f}")

        result = {
            **quote,
            "name": name,
            "sector": data.get("sector"),
            "industry": data.get("industry"),
            "description": data.get("description"),
            "pe_ratio": pe,
            "forward_pe": data.get("forward_pe"),
            "eps": data.get("eps"),
            "revenue": data.get("revenue"),
            "market_cap": int(market_cap) if market_cap else None,
            "beta": data.get("beta"),
            "roe": data.get("roe"),
            "div_yield": data.get("div_yield"),
            "week_52_high": high_52w,
            "week_52_low": low_52w,
            "price_to_book": data.get("price_to_book"),
            "debt_equity": data.get("debt_equity"),
            "revenue_growth": data.get("revenue_growth"),
            "ebitda": data.get("ebitda"),
            "ceo": data.get("ceo"),
            "employees": data.get("employees"),
            "website": data.get("website"),
            "avg_volume": data.get("avg_volume"),
            "recommendations": {
                "strong_buy": rec[0], "buy": rec[1], "hold": rec[2],
                "sell": rec[3], "strong_sell": rec[4],
            } if rec else None,
            "summary": ". ".join(parts) + ".",
        }
        return result
    finally:
        conn.close()


def _get_ticker_list() -> list[str]:
    if not snowflake_configured():
        return []
    conn = get_snowflake_connection()
    try:
        cur = conn.cursor()
        cur.execute("SELECT DISTINCT TICKER FROM FUNDAMENTALS ORDER BY TICKER")
        return [row[0] for row in cur.fetchall()]
    finally:
        conn.close()


def _search_tickers(query: str, limit: int = 10) -> list[dict]:
    if not snowflake_configured():
        return []
    conn = get_snowflake_connection()
    try:
        cur = conn.cursor()
        q = query.upper()
        cur.execute(
            """
            SELECT TICKER, COMPANY_NAME, SECTOR
            FROM FUNDAMENTALS
            WHERE TICKER ILIKE %s OR COMPANY_NAME ILIKE %s
            ORDER BY
                CASE WHEN TICKER = %s THEN 0
                     WHEN TICKER ILIKE %s THEN 1
                     ELSE 2 END,
                TICKER
            LIMIT %s
            """,
            (f"{q}%", f"%{query}%", q, f"{q}%", limit),
        )
        return [
            {"symbol": row[0], "description": row[1] or row[0], "sector": row[2]}
            for row in cur.fetchall()
        ]
    finally:
        conn.close()


@router.get("/quote")
async def get_quote(ticker: str):
    if not snowflake_configured():
        raise HTTPException(status_code=503, detail="Snowflake not configured")
    result = _get_quote_from_snowflake(ticker.upper())
    if not result:
        raise HTTPException(status_code=404, detail=f"No price data for {ticker.upper()}")
    return result


@router.get("/stock-info")
async def get_stock_info(q: str):
    if not snowflake_configured():
        raise HTTPException(status_code=503, detail="Snowflake not configured")
    result = _get_stock_info_from_snowflake(q.upper())
    if not result:
        raise HTTPException(status_code=404, detail=f"No data found for {q.upper()}")
    return result


@router.get("/search")
async def search_tickers(q: str, limit: int = 10):
    return _search_tickers(q, limit)


@router.get("/tickers")
async def get_ticker_bar():
    tickers = _get_ticker_list()
    if not tickers:
        raise HTTPException(status_code=503, detail="Snowflake not configured")
    # Return price bar rows for first 50 tickers
    results = []
    conn = get_snowflake_connection()
    try:
        cur = conn.cursor()
        cur.execute(
            """
            WITH latest AS (
                SELECT TICKER, CLOSE_PRICE, TRADE_DATE,
                       LAG(CLOSE_PRICE) OVER (PARTITION BY TICKER ORDER BY TRADE_DATE) AS prev_close
                FROM PRICES
                WHERE TICKER IN (
                    SELECT TICKER FROM FUNDAMENTALS
                    WHERE TICKER IN ('AAPL','MSFT','NVDA','AMZN','GOOGL','META','TSLA',
                                     'JPM','V','MA','WMT','JNJ','UNH','XOM','AVGO',
                                     'AMD','GS','BAC','COST','MCD','NKE','ABBV','PFE',
                                     'MRK','CVX','CAT','BA','RTX','INTC','SBUX')
                )
            ),
            ranked AS (
                SELECT *, ROW_NUMBER() OVER (PARTITION BY TICKER ORDER BY TRADE_DATE DESC) AS rn
                FROM latest
            )
            SELECT TICKER, CLOSE_PRICE, prev_close
            FROM ranked WHERE rn = 1
            ORDER BY TICKER
            """
        )
        for row in cur.fetchall():
            ticker, price, prev = row
            price = float(price)
            prev = float(prev) if prev else price
            change_pct = round(((price - prev) / prev) * 100, 2) if prev else 0.0
            results.append({
                "ticker": ticker,
                "price": round(price, 2),
                "change": change_pct,
                "direction": "up" if change_pct >= 0 else "down",
            })
    finally:
        conn.close()
    return results


@router.get("/batch")
async def get_batch_quotes():
    tickers = _get_ticker_list()
    results = []
    conn = get_snowflake_connection()
    try:
        cur = conn.cursor()
        cur.execute(
            """
            WITH ranked AS (
                SELECT TICKER, CLOSE_PRICE, OPEN_PRICE, HIGH_PRICE, LOW_PRICE, VOLUME, TRADE_DATE,
                       ROW_NUMBER() OVER (PARTITION BY TICKER ORDER BY TRADE_DATE DESC) AS rn
                FROM PRICES
            )
            SELECT TICKER, CLOSE_PRICE, TRADE_DATE FROM ranked WHERE rn = 1
            ORDER BY TICKER
            LIMIT 100
            """
        )
        for row in cur.fetchall():
            results.append({
                "ticker": row[0],
                "price": round(float(row[1]), 2),
                "trade_date": str(row[2]),
                "direction": "up",
                "change": 0.0,
            })
    finally:
        conn.close()
    return {"quotes": results, "timestamp": datetime.now().isoformat(), "count": len(results)}
