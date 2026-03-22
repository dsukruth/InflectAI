"""
3-source thesis synthesis.

Data pulled from:
  1. Snowflake FUNDAMENTALS  — valuation, margins, growth, balance sheet
  2. Snowflake NEWS           — recent headlines + pre-scored sentiment
  3. Snowflake RECOMMENDATIONS — analyst consensus (strong_buy/buy/hold/sell/strong_sell)
  4. Snowflake PRICES         — RSI(14) calculated in-DB

LLM (Groq) synthesises all four signals into a structured thesis JSON.
"""

from __future__ import annotations

import asyncio
import json
import os
from typing import Any

from groq import Groq

from app.agents.base_agent import BaseAgent
from app.services.finnhub_service import get_live_news
from app.services.snowflake_rag_service import (
    get_full_fundamentals,
    get_news_detailed,
    get_recommendations,
    get_snowflake_connection,
)


EDU = "Educational only. Not investment advice."

THESIS_PROMPT = """You are a professional equity analyst. Generate a structured investment thesis for {ticker}.

You will receive live data from three sources:
  • FUNDAMENTALS  — valuation ratios, margins, revenue growth, balance sheet
  • NEWS          — recent headlines with sentiment scores (-1 to +1)
  • ANALYST RECS  — professional analyst recommendation counts

Return ONLY valid JSON, no markdown, no extra text:
{{
  "fundamental": {{
    "signal": "BULLISH|NEUTRAL|BEARISH",
    "reason": "one concise sentence on valuation and financial health",
    "citation": "Snowflake FUNDAMENTALS"
  }},
  "technical": {{
    "signal": "BULLISH|NEUTRAL|BEARISH",
    "reason": "RSI level, 52-week position, and momentum description",
    "rsi": 50,
    "week_52_position": "NEAR_HIGH|MID_RANGE|NEAR_LOW"
  }},
  "sentiment": {{
    "signal": "POSITIVE|NEUTRAL|NEGATIVE",
    "reason": "summary of dominant news themes in one sentence",
    "score": 0.0,
    "headlines": ["headline 1", "headline 2", "headline 3"]
  }},
  "analyst": {{
    "signal": "BULLISH|NEUTRAL|BEARISH",
    "reason": "interpretation of analyst consensus in one sentence",
    "consensus": "BUY|HOLD|SELL"
  }},
  "key_risks": ["specific risk 1", "specific risk 2", "specific risk 3"],
  "key_catalysts": ["specific catalyst 1", "specific catalyst 2", "specific catalyst 3"],
  "verdict": "HOLD|WATCH|AVOID",
  "confidence": "HIGH|MEDIUM|LOW"
}}

Rules:
- verdict HOLD = at least 2 bullish signals; WATCH = mixed; AVOID = 2+ bearish/negative signals
- NEVER output BUY or SELL in verdict field
- key_risks and key_catalysts must be specific to this company (not generic boilerplate)
- Educational only. Not investment advice."""


def _calculate_rsi(ticker: str) -> float:
    """RSI(14) via Snowflake window function on PRICES table."""
    try:
        conn = get_snowflake_connection()
        try:
            cur = conn.cursor()
            cur.execute(
                """
                WITH daily AS (
                    SELECT CLOSE_PRICE,
                           LAG(CLOSE_PRICE) OVER (ORDER BY TRADE_DATE) AS prev
                    FROM PRICES
                    WHERE TICKER = %s
                    ORDER BY TRADE_DATE DESC
                    LIMIT 15
                ),
                changes AS (
                    SELECT CLOSE_PRICE - prev AS chg
                    FROM daily
                    WHERE prev IS NOT NULL
                )
                SELECT
                    AVG(CASE WHEN chg > 0 THEN chg ELSE 0 END) AS avg_gain,
                    AVG(CASE WHEN chg < 0 THEN ABS(chg) ELSE 0 END) AS avg_loss
                FROM changes
                """,
                (ticker.upper(),),
            )
            row = cur.fetchone()
            if row and row[1] and float(row[1]) > 0:
                rs = float(row[0]) / float(row[1])
                return round(100 - (100 / (1 + rs)), 1)
            return 50.0
        finally:
            cur.close()
            conn.close()
    except Exception:
        return 50.0


def _week_52_position(current_price: float | None, high: float | None, low: float | None) -> str:
    if not current_price or not high or not low or high == low:
        return "MID_RANGE"
    pct = (current_price - low) / (high - low)
    if pct >= 0.75:
        return "NEAR_HIGH"
    if pct <= 0.25:
        return "NEAR_LOW"
    return "MID_RANGE"


def _analyst_signal(rec: dict) -> str:
    total = rec.get("total", 0)
    if not total:
        return "NEUTRAL"
    bullish = (rec.get("strong_buy", 0) + rec.get("buy", 0)) / total
    bearish = (rec.get("sell", 0) + rec.get("strong_sell", 0)) / total
    if bullish >= 0.5:
        return "BULLISH"
    if bearish >= 0.3:
        return "BEARISH"
    return "NEUTRAL"


def _build_context(
    ticker: str,
    fund: dict,
    news: list[dict],
    rec: dict,
    rsi: float,
) -> str:
    parts: list[str] = [f"=== {ticker} INVESTMENT DATA ===\n"]

    # --- FUNDAMENTALS ---
    parts.append("[ SOURCE 1: FUNDAMENTALS (Snowflake) ]")
    name = fund.get("company_name") or ticker
    sector = fund.get("sector") or "N/A"
    parts.append(f"Company: {name} | Sector: {sector} | Industry: {fund.get('industry') or 'N/A'}")

    def _fmt(v: Any, pct: bool = False, mult: float = 1.0) -> str:
        if v is None:
            return "N/A"
        try:
            val = float(v) * mult
            return f"{val:.1f}%" if pct else f"{val:.2f}"
        except (TypeError, ValueError):
            return "N/A"

    def _fmt_big(v: Any) -> str:
        if v is None:
            return "N/A"
        try:
            val = float(v)
            if val >= 1e12:
                return f"${val/1e12:.2f}T"
            if val >= 1e9:
                return f"${val/1e9:.1f}B"
            if val >= 1e6:
                return f"${val/1e6:.0f}M"
            return f"${val:.0f}"
        except (TypeError, ValueError):
            return "N/A"

    mc = fund.get("market_cap")
    rev = fund.get("revenue")
    parts.append(
        f"Market Cap: {_fmt_big(mc)} | Revenue: {_fmt_big(rev)} | "
        f"EBITDA: {_fmt_big(fund.get('ebitda'))}"
    )
    parts.append(
        f"PE: {_fmt(fund.get('pe_ratio'))} | Forward PE: {_fmt(fund.get('forward_pe'))} | "
        f"EPS: {_fmt(fund.get('eps'))} | P/Book: {_fmt(fund.get('price_to_book'))}"
    )
    parts.append(
        f"Gross Margin: {_fmt(fund.get('gross_margin'), pct=True, mult=100)} | "
        f"Profit Margin: {_fmt(fund.get('profit_margin'), pct=True, mult=100)} | "
        f"Operating Margin: {_fmt(fund.get('operating_margins'), pct=True, mult=100)}"
    )
    parts.append(
        f"Revenue Growth: {_fmt(fund.get('revenue_growth'), pct=True, mult=100)} | "
        f"ROE: {_fmt(fund.get('roe'), pct=True, mult=100)} | "
        f"ROA: {_fmt(fund.get('roa'), pct=True, mult=100)}"
    )
    parts.append(
        f"Debt/Equity: {_fmt(fund.get('debt_equity'))} | "
        f"Current Ratio: {_fmt(fund.get('current_ratio'))} | "
        f"FCF: {_fmt_big(fund.get('fcf'))}"
    )
    high52 = fund.get("high_52w")
    low52 = fund.get("low_52w")
    parts.append(
        f"52W High: {_fmt_big(high52)} | 52W Low: {_fmt_big(low52)} | "
        f"Beta: {_fmt(fund.get('beta'))} | Div Yield: {_fmt(fund.get('div_yield'), pct=True, mult=100)}"
    )

    # --- NEWS ---
    parts.append("\n[ SOURCE 2: NEWS (Snowflake — most recent 8 articles) ]")
    if news:
        scores = [n["sentiment"] for n in news if n.get("sentiment") is not None]
        avg_score = sum(scores) / len(scores) if scores else 0.0
        parts.append(f"Average Sentiment Score: {avg_score:.3f} (range -1.0 negative to +1.0 positive)")
        for i, art in enumerate(news[:8], 1):
            h = (art.get("headline") or "").strip()
            src = art.get("source") or ""
            score = art.get("sentiment")
            date = (art.get("published_at") or "")[:10]
            score_str = f" [score={score:.2f}]" if score is not None else ""
            parts.append(f"  {i}. [{date}] {h} — {src}{score_str}")
    else:
        parts.append("  No recent news available.")

    # --- ANALYST RECOMMENDATIONS ---
    parts.append("\n[ SOURCE 3: ANALYST RECOMMENDATIONS (Snowflake) ]")
    if rec and rec.get("total", 0) > 0:
        total = rec["total"]
        period = rec.get("period") or "latest"
        parts.append(f"Period: {period} | Total analysts: {total}")
        parts.append(
            f"  Strong Buy: {rec.get('strong_buy',0)} | Buy: {rec.get('buy',0)} | "
            f"Hold: {rec.get('hold',0)} | Sell: {rec.get('sell',0)} | "
            f"Strong Sell: {rec.get('strong_sell',0)}"
        )
        bullish_pct = round((rec.get("strong_buy", 0) + rec.get("buy", 0)) / total * 100)
        bearish_pct = round((rec.get("sell", 0) + rec.get("strong_sell", 0)) / total * 100)
        parts.append(
            f"  Bullish: {bullish_pct}% | Neutral: {100-bullish_pct-bearish_pct}% | Bearish: {bearish_pct}%"
        )
        parts.append(f"  Consensus: {rec.get('consensus', 'HOLD')}")
    else:
        parts.append("  No analyst recommendations available.")

    # --- TECHNICAL ---
    parts.append("\n[ TECHNICAL (Snowflake PRICES — RSI proxy) ]")
    parts.append(f"RSI(14 proxy): {rsi}")
    pos = _week_52_position(None, high52, low52)
    parts.append(f"52-week position: {pos}")
    rsi_note = "oversold" if rsi < 35 else "overbought" if rsi > 65 else "neutral range"
    parts.append(f"RSI interpretation: {rsi_note}")

    return "\n".join(parts)


def compute_verdict(thesis: dict) -> str:
    """
    4-signal verdict:
      3+ bearish/negative → AVOID
      2+ bearish → AVOID if analyst also bearish, else WATCH
      2+ bullish → HOLD
      else → WATCH
    """
    fund_sig = (thesis.get("fundamental") or {}).get("signal", "NEUTRAL")
    tech_sig = (thesis.get("technical") or {}).get("signal", "NEUTRAL")
    sent_sig = (thesis.get("sentiment") or {}).get("signal", "NEUTRAL")
    anal_sig = (thesis.get("analyst") or {}).get("signal", "NEUTRAL")

    bear = sum([
        fund_sig == "BEARISH",
        tech_sig == "BEARISH",
        sent_sig == "NEGATIVE",
        anal_sig == "BEARISH",
    ])
    bull = sum([
        fund_sig == "BULLISH",
        tech_sig == "BULLISH",
        sent_sig == "POSITIVE",
        anal_sig == "BULLISH",
    ])

    if bear >= 3:
        return "AVOID"
    if bear >= 2 and anal_sig == "BEARISH":
        return "AVOID"
    if bear >= 2:
        return "WATCH"
    if bull >= 3:
        return "HOLD"
    if bull >= 2 and bear == 0:
        return "HOLD"
    return "WATCH"


def _merge_news(snowflake_news: list[dict], live_news: list[dict]) -> list[dict]:
    """
    Combine Snowflake cached news and live Finnhub news.
    Deduplicate by headline prefix (first 60 chars), keep newest first.
    Live news takes precedence (appears first).
    """
    seen: set[str] = set()
    merged: list[dict] = []
    for article in live_news + snowflake_news:
        key = (article.get("headline") or "")[:60].lower().strip()
        if key and key not in seen:
            seen.add(key)
            merged.append(article)
    return merged[:10]


def _generate_thesis_sync(ticker: str) -> dict:
    rsi = _calculate_rsi(ticker)
    fund = get_full_fundamentals(ticker)
    snowflake_news = get_news_detailed(ticker, limit=8)
    live_news = get_live_news(ticker, days=7, limit=8)
    news = _merge_news(snowflake_news, live_news)
    rec = get_recommendations(ticker)

    # Compute average news sentiment (pre-scored in DB; fallback to Groq if missing)
    news_scores = [n["sentiment"] for n in news if n.get("sentiment") is not None]
    avg_news_score = sum(news_scores) / len(news_scores) if news_scores else 0.0

    # If no pre-scored sentiment, score via Groq
    if not news_scores and news:
        headlines = [(n.get("headline") or "") for n in news if n.get("headline")]
        if headlines:
            try:
                client = Groq(api_key=os.getenv("GROQ_API_KEY"))
                resp = client.chat.completions.create(
                    model="llama-3.1-8b-instant",
                    messages=[{
                        "role": "user",
                        "content": (
                            "Score overall sentiment of these financial headlines "
                            "from -1.0 (very negative) to +1.0 (very positive). "
                            "Return ONLY a number.\n\n"
                            + "\n".join(headlines[:5])
                        ),
                    }],
                    max_tokens=10,
                    temperature=0,
                )
                avg_news_score = float(resp.choices[0].message.content.strip())
            except Exception:
                avg_news_score = 0.0

    context = _build_context(ticker, fund, news, rec, rsi)

    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        # Fallback: deterministic thesis from raw data
        rec_signal = _analyst_signal(rec)
        return _fallback_thesis(ticker, fund, news, rec, rec_signal, avg_news_score, rsi)

    client = Groq(api_key=api_key)
    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": THESIS_PROMPT.format(ticker=ticker)},
                {"role": "user", "content": context},
            ],
            temperature=0.15,
            max_tokens=800,
        )
        raw = response.choices[0].message.content or "{}"
        raw = raw.replace("```json", "").replace("```", "").strip()
        thesis = json.loads(raw)
    except Exception as e:
        return _fallback_thesis(ticker, fund, news, rec, _analyst_signal(rec), avg_news_score, rsi, error=str(e))

    # Merge analyst counts from DB into thesis (LLM only provides signal/reason/consensus)
    thesis.setdefault("analyst", {})
    if rec:
        thesis["analyst"].update({
            "strong_buy": rec.get("strong_buy", 0),
            "buy": rec.get("buy", 0),
            "hold": rec.get("hold", 0),
            "sell": rec.get("sell", 0),
            "strong_sell": rec.get("strong_sell", 0),
            "total": rec.get("total", 0),
        })
        thesis["analyst"].setdefault("consensus", rec.get("consensus", "HOLD"))

    # Merge news score + top headlines
    thesis.setdefault("sentiment", {})
    thesis["sentiment"]["score"] = round(avg_news_score, 3)
    if news and not thesis["sentiment"].get("headlines"):
        thesis["sentiment"]["headlines"] = [
            (n.get("headline") or "")[:100] for n in news[:3] if n.get("headline")
        ]

    # Merge technical extras
    thesis.setdefault("technical", {})
    thesis["technical"]["rsi"] = rsi
    thesis["technical"]["week_52_position"] = _week_52_position(
        None, fund.get("high_52w"), fund.get("low_52w")
    )

    thesis["ticker"] = ticker
    thesis["verdict"] = compute_verdict(thesis)
    thesis["educational_note"] = EDU
    return thesis


def _fallback_thesis(
    ticker: str,
    fund: dict,
    news: list[dict],
    rec: dict,
    rec_signal: str,
    avg_news_score: float,
    rsi: float,
    error: str = "",
) -> dict:
    """Deterministic thesis when LLM is unavailable."""
    pe = fund.get("pe_ratio")
    margin = fund.get("profit_margin")
    rev_growth = fund.get("revenue_growth")

    fund_signal = "NEUTRAL"
    if pe and margin:
        if float(pe) < 20 and float(margin or 0) > 0.1:
            fund_signal = "BULLISH"
        elif float(pe) > 50 or float(margin or 0) < 0:
            fund_signal = "BEARISH"

    sent_signal = "POSITIVE" if avg_news_score > 0.1 else "NEGATIVE" if avg_news_score < -0.1 else "NEUTRAL"
    tech_signal = "BULLISH" if rsi < 35 else "BEARISH" if rsi > 65 else "NEUTRAL"

    thesis = {
        "fundamental": {
            "signal": fund_signal,
            "reason": f"PE: {pe or 'N/A'}, Profit margin: {margin or 'N/A'}, Revenue growth: {rev_growth or 'N/A'}",
            "citation": "Snowflake FUNDAMENTALS",
        },
        "technical": {
            "signal": tech_signal,
            "reason": f"RSI at {rsi} — {'oversold territory' if rsi < 35 else 'overbought territory' if rsi > 65 else 'neutral range'}",
            "rsi": rsi,
            "week_52_position": _week_52_position(None, fund.get("high_52w"), fund.get("low_52w")),
        },
        "sentiment": {
            "signal": sent_signal,
            "reason": f"Average news sentiment score: {avg_news_score:.2f}",
            "score": round(avg_news_score, 3),
            "headlines": [(n.get("headline") or "")[:100] for n in news[:3] if n.get("headline")],
        },
        "analyst": {
            "signal": rec_signal,
            "reason": f"Analyst consensus: {rec.get('consensus', 'N/A')} ({rec.get('total', 0)} analysts)",
            "consensus": rec.get("consensus", "HOLD"),
            "strong_buy": rec.get("strong_buy", 0),
            "buy": rec.get("buy", 0),
            "hold": rec.get("hold", 0),
            "sell": rec.get("sell", 0),
            "strong_sell": rec.get("strong_sell", 0),
            "total": rec.get("total", 0),
        },
        "key_risks": ["Insufficient LLM context for detailed risks"],
        "key_catalysts": ["Insufficient LLM context for detailed catalysts"],
        "verdict": "WATCH",
        "confidence": "LOW",
        "ticker": ticker,
        "educational_note": EDU,
    }
    thesis["verdict"] = compute_verdict(thesis)
    if error:
        thesis["error"] = error
    return thesis


class ThesisAgent(BaseAgent):
    name = "thesis"

    async def run(self, input: dict) -> dict:
        ticker = (input.get("ticker") or "").upper().strip()
        if not ticker:
            return {"error": "Ticker required"}
        return await asyncio.to_thread(_generate_thesis_sync, ticker)
