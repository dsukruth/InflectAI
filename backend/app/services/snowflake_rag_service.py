"""
SEC chunk retrieval from Snowflake (keyword / ILIKE fallback).

Full VECTOR_COSINE_SIMILARITY search needs a 1024-dim query embedding (BGE-M3).
When embeddings are not computed at request time, we match on ticker + text
keywords so the LLM still receives real filing excerpts when Snowflake is up.
"""

from __future__ import annotations

import os
import re
from typing import Any


def get_snowflake_connection():
    import snowflake.connector

    return snowflake.connector.connect(
        account=os.getenv("SNOWFLAKE_ACCOUNT"),
        user=os.getenv("SNOWFLAKE_USER"),
        password=os.getenv("SNOWFLAKE_PASSWORD"),
        warehouse=os.getenv("SNOWFLAKE_WAREHOUSE"),
        database=os.getenv("SNOWFLAKE_DATABASE"),
        schema=os.getenv("SNOWFLAKE_SCHEMA", "PUBLIC"),
    )


def snowflake_configured() -> bool:
    return bool(
        os.getenv("SNOWFLAKE_ACCOUNT")
        and os.getenv("SNOWFLAKE_USER")
        and os.getenv("SNOWFLAKE_PASSWORD")
    )


def _row_fundamentals(row: tuple) -> dict[str, Any]:
    """Map FUNDAMENTALS row to named fields (column order in SELECT)."""
    return {
        "ticker": row[0],
        "pe_ratio": row[1],
        "forward_pe": row[2],
        "eps": row[3],
        "revenue": row[4],
        "gross_margin": row[5],
        "profit_margin": row[6],
        "debt_equity": row[7],
        "market_cap": row[8],
        "beta": row[9],
        "roe": row[10],
        "fcf": row[11],
        "div_yield": row[12],
        "updated_at": row[13],
    }


def get_fundamentals(ticker: str) -> dict[str, Any]:
    """
    One row from FUNDAMENTALS for ticker.
    Column order: TICKER, PE_RATIO, FORWARD_PE, EPS, REVENUE, GROSS_MARGIN,
    PROFIT_MARGIN, DEBT_EQUITY, MARKET_CAP, BETA, ROE, FCF, DIV_YIELD, UPDATED_AT.
    """
    if not snowflake_configured():
        return {}
    conn = get_snowflake_connection()
    try:
        cur = conn.cursor()
        cur.execute(
            """
            SELECT TICKER, PE_RATIO, FORWARD_PE, EPS, REVENUE, GROSS_MARGIN,
                   PROFIT_MARGIN, DEBT_EQUITY, MARKET_CAP, BETA, ROE, FCF,
                   DIV_YIELD, UPDATED_AT
            FROM FUNDAMENTALS
            WHERE TICKER = %s
            """,
            (ticker.upper(),),
        )
        row = cur.fetchone()
        if not row:
            return {}
        return _row_fundamentals(row)
    except Exception:
        return {}
    finally:
        conn.close()


def _row_news(row: tuple) -> dict[str, Any]:
    """Map one NEWS row (HEADLINE, SENTIMENT, SUMMARY) to a dict."""
    return {
        "headline": row[0],
        "sentiment": row[1],
        "summary": row[2],
    }


def get_news(ticker: str) -> tuple[list[dict[str, Any]], list[str]]:
    """
    Up to 5 recent news rows (newest first), plus a list of headline strings
    for sentiment scoring (headline, or headline | summary when summary exists).
    """
    if not snowflake_configured():
        return [], []
    conn = get_snowflake_connection()
    try:
        cur = conn.cursor()
        cur.execute(
            """
            SELECT HEADLINE, SENTIMENT, SUMMARY
            FROM NEWS
            WHERE TICKER = %s
            ORDER BY PUBLISHED_AT DESC
            LIMIT 5
            """,
            (ticker.upper(),),
        )
        raw = cur.fetchall() or []
        rows = [_row_news(r) for r in raw]
        headlines: list[str] = []
        for d in rows:
            h = (d.get("headline") or "").strip()
            s = (d.get("summary") or "").strip()
            if h and s:
                headlines.append(f"{h} | {s}")
            elif h:
                headlines.append(h)
            elif s:
                headlines.append(s)
        return rows, headlines
    except Exception:
        return [], []
    finally:
        conn.close()


def get_recommendations(ticker: str) -> dict[str, Any]:
    """Latest analyst recommendations (strong_buy/buy/hold/sell/strong_sell)."""
    if not snowflake_configured():
        return {}
    conn = get_snowflake_connection()
    try:
        cur = conn.cursor()
        cur.execute(
            """
            SELECT STRONG_BUY, BUY, HOLD, SELL, STRONG_SELL, PERIOD
            FROM RECOMMENDATIONS
            WHERE TICKER = %s
            ORDER BY PERIOD DESC
            LIMIT 1
            """,
            (ticker.upper(),),
        )
        row = cur.fetchone()
        if not row:
            return {}
        strong_buy, buy, hold, sell, strong_sell, period = row
        sb, b, h, s, ss = (
            int(strong_buy or 0), int(buy or 0), int(hold or 0),
            int(sell or 0), int(strong_sell or 0),
        )
        total = sb + b + h + s + ss
        bullish = sb + b
        bearish = s + ss
        if total > 0:
            if bullish / total >= 0.5:
                consensus = "BUY"
            elif bearish / total >= 0.3:
                consensus = "SELL"
            else:
                consensus = "HOLD"
        else:
            consensus = "HOLD"
        return {
            "strong_buy": sb,
            "buy": b,
            "hold": h,
            "sell": s,
            "strong_sell": ss,
            "total": total,
            "consensus": consensus,
            "period": str(period) if period else None,
        }
    except Exception:
        return {}
    finally:
        conn.close()


def get_full_fundamentals(ticker: str) -> dict[str, Any]:
    """Rich FUNDAMENTALS row including company info, valuation, and financials."""
    if not snowflake_configured():
        return {}
    conn = get_snowflake_connection()
    try:
        cur = conn.cursor()
        cur.execute(
            """
            SELECT TICKER, COMPANY_NAME, SECTOR, INDUSTRY, MARKET_CAP,
                   PE_RATIO, FORWARD_PE, EPS, REVENUE, REVENUE_GROWTH,
                   GROSS_MARGIN, PROFIT_MARGIN, OPERATING_MARGINS, EBITDA,
                   DEBT_EQUITY, CURRENT_RATIO, ROE, ROA, FCF,
                   BETA, HIGH_52W, LOW_52W, DIV_YIELD, PRICE_TO_BOOK
            FROM FUNDAMENTALS
            WHERE TICKER = %s
            """,
            (ticker.upper(),),
        )
        row = cur.fetchone()
        if not row:
            return {}
        cols = [c[0].lower() for c in cur.description]
        return dict(zip(cols, row))
    except Exception:
        return {}
    finally:
        conn.close()


def get_news_detailed(ticker: str, limit: int = 8) -> list[dict[str, Any]]:
    """Recent news articles with headline, summary, source, date, and sentiment."""
    if not snowflake_configured():
        return []
    conn = get_snowflake_connection()
    try:
        cur = conn.cursor()
        cur.execute(
            """
            SELECT HEADLINE, SUMMARY, SOURCE_NAME, PUBLISHED_AT, SENTIMENT
            FROM NEWS
            WHERE TICKER = %s
            ORDER BY PUBLISHED_AT DESC
            LIMIT %s
            """,
            (ticker.upper(), limit),
        )
        rows = cur.fetchall() or []
        return [
            {
                "headline": row[0],
                "summary": row[1],
                "source": row[2],
                "published_at": str(row[3]) if row[3] else None,
                "sentiment": float(row[4]) if row[4] is not None else None,
            }
            for row in rows
        ]
    except Exception:
        return []
    finally:
        conn.close()


def _row_metrics(row: tuple) -> dict[str, Any]:
    """Map METRICS row to named fields (matches upload_market_data MERGE column order)."""
    return {
        "ticker": row[0],
        "high_52w": row[1],
        "low_52w": row[2],
        "beta": row[3],
        "revenue_growth": row[4],
    }


def get_metrics(ticker: str) -> dict[str, Any]:
    """
    One row from METRICS for ticker.
    Column order: TICKER, HIGH_52W, LOW_52W, BETA, REVENUE_GROWTH.
    """
    if not snowflake_configured():
        return {}
    conn = get_snowflake_connection()
    try:
        cur = conn.cursor()
        cur.execute(
            """
            SELECT TICKER, HIGH_52W, LOW_52W, BETA, REVENUE_GROWTH
            FROM METRICS
            WHERE TICKER = %s
            """,
            (ticker.upper(),),
        )
        row = cur.fetchone()
        if not row:
            return {}
        return _row_metrics(row)
    except Exception:
        return {}
    finally:
        conn.close()


def _query_keywords(text: str, max_terms: int = 8) -> list[str]:
    words = re.findall(r"[A-Za-z][A-Za-z0-9]{2,}", text)
    seen: set[str] = set()
    out: list[str] = []
    for w in words:
        lw = w.lower()
        if lw in seen or lw in {
            "the", "and", "for", "what", "how", "why", "when", "from", "with",
            "this", "that", "their", "they", "have", "been", "were", "will",
        }:
            continue
        seen.add(lw)
        out.append(w)
        if len(out) >= max_terms:
            break
    return out


def search_sec_chunks(
    ticker: str | None,
    user_query: str,
    limit: int = 5,
) -> list[dict[str, Any]]:
    """
    Return rows: chunk_id, ticker, form_type, filing_date, section, chunk_text.
    """
    if not snowflake_configured():
        return []

    terms = _query_keywords(user_query)
    if not terms:
        terms = [user_query.strip()[:40] or "revenue"]

    conn = get_snowflake_connection()
    try:
        cur = conn.cursor()
        ilike_clauses = " OR ".join(["CHUNK_TEXT ILIKE %s"] * len(terms))
        like_params = [f"%{t}%" for t in terms]

        if ticker:
            sql = f"""
                SELECT CHUNK_ID, TICKER, FORM_TYPE, FILING_DATE, SECTION, CHUNK_TEXT
                FROM SEC_EMBEDDINGS
                WHERE TICKER = %s AND ({ilike_clauses})
                LIMIT %s
            """
            cur.execute(sql, (ticker.upper(), *like_params, limit))
        else:
            sql = f"""
                SELECT CHUNK_ID, TICKER, FORM_TYPE, FILING_DATE, SECTION, CHUNK_TEXT
                FROM SEC_EMBEDDINGS
                WHERE {ilike_clauses}
                LIMIT %s
            """
            cur.execute(sql, (*like_params, limit))

        cols = [c[0].lower() for c in cur.description]
        rows = []
        for row in cur.fetchall():
            rows.append(dict(zip(cols, row)))
        return rows
    except Exception:
        return []
    finally:
        conn.close()
