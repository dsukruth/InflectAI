"""
Coordinates intent classification, SEC retrieval, validation, citation,
optional Wolfram + local data hints, and answer generation.
"""

from __future__ import annotations

import asyncio
import json
import os
import re
from typing import Any

from groq import Groq

from app.agents.sec_research.answer_agent import AnswerAgent
from app.agents.sec_research.citation_agent import CitationAgent
from app.agents.sec_research.retrieval_agent import RetrievalAgent
from app.agents.sec_research.validator_agent import ValidatorAgent, parse_answer_meta
from app.services.market_service import get_quote_snapshot
from app.services.news_service import build_local_context_block
from app.services.wolfram_service import fetch_wolfram_result
from app.schemas.query import QueryRequest


INTENT_PROMPT = """You are a financial intent classifier.
Extract structured data from the user message.
Return ONLY valid JSON, no markdown:
{
  "intent_type": "research|price_check|trade|thesis",
  "ticker": "AAPL or null",
  "metric": "gross_margin|revenue|eps|pe_ratio or null",
  "timeframe": "Q4 2023|last year or null",
  "confidence": 0.95,
  "side": "buy|sell or null",
  "quantity": 0
}"""


def _extract_json(raw: str) -> dict:
    s = raw.strip()
    if s.startswith("```"):
        s = re.sub(r"^```(?:json)?\s*", "", s, flags=re.IGNORECASE)
        s = re.sub(r"\s*```\s*$", "", s)
    return json.loads(s)


def _default_intent() -> dict[str, Any]:
    return {
        "intent_type": "research",
        "ticker": None,
        "metric": None,
        "timeframe": None,
        "confidence": 0.5,
        "side": None,
        "quantity": 0,
    }


def _classify_intent_sync(user_text: str) -> dict[str, Any]:
    intent = _default_intent()
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        return intent
    client = Groq(api_key=api_key)
    try:
        intent_resp = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {"role": "system", "content": INTENT_PROMPT},
                {"role": "user", "content": user_text},
            ],
            temperature=0.0,
            max_tokens=220,
        )
        raw = intent_resp.choices[0].message.content or "{}"
        return {**intent, **_extract_json(raw)}
    except Exception:
        return intent


def _format_price_answer(snap: dict[str, Any]) -> tuple[str, str, None]:
    body = (
        f"{snap['ticker']} is at ${snap['price']:.2f}, {snap['direction']} "
        f"{abs(snap['change_percent']):.2f}% vs prior close. "
        f"Volume ~{snap['volume']:,}. "
        f"SOURCE: Market Data\nCONFIDENCE: HIGH\n"
        f"Educational only. Not investment advice."
    )
    return body, "MARKET_DATA", None


def _looks_computational(q: str) -> bool:
    lower = q.lower()
    return bool(
        re.search(r"\d+\s*%|\bpe ratio\b|\beps\b|\bcompute\b|\bcalculate\b", lower)
        or re.search(r"^what is \d", lower)
    )


def _trade_ack(intent: dict) -> str:
    side = intent.get("side") or "trade"
    qty = intent.get("quantity") or ""
    tk = intent.get("ticker") or "the name"
    return (
        f"I interpreted a {side} request for {qty} shares of {tk}. "
        f"Confirm the order in the trade dialog when it appears. "
        f"I cannot execute trades or give recommendations. "
        f"SOURCE: Market Data\nCONFIDENCE: MEDIUM\n"
        f"Educational only. Not investment advice."
    )


def _thesis_pointer(ticker: str | None) -> str:
    t = ticker or "that company"
    return (
        f"For a structured HOLD / WATCH / AVOID thesis on {t}, "
        f"use the Thesis action in the research panel. "
        f"SOURCE: LLM\nCONFIDENCE: MEDIUM\n"
        f"Educational only. Not investment advice."
    )


async def run_query_pipeline(request: QueryRequest) -> dict[str, Any]:
    intent = await asyncio.to_thread(_classify_intent_sync, request.text)

    ticker = intent.get("ticker") or request.session_context.get("ticker") or None
    if isinstance(ticker, str):
        ticker = ticker.upper().strip() or None

    intent_type = intent.get("intent_type") or "research"

    if intent_type == "price_check" and ticker:
        snap = await asyncio.to_thread(get_quote_snapshot, ticker)
        answer, source, citation = _format_price_answer(snap)
        return {
            "intent_type": intent_type,
            "ticker": ticker,
            "metric": intent.get("metric"),
            "timeframe": intent.get("timeframe"),
            "confidence": float(intent.get("confidence") or 0.9),
            "answer": answer,
            "source": source,
            "citation": citation,
            "confidence_level": "HIGH",
        }

    if intent_type == "trade":
        answer = _trade_ack(intent)
        source, citation, conf = parse_answer_meta(answer)
        return {
            "intent_type": intent_type,
            "ticker": ticker,
            "metric": intent.get("metric"),
            "timeframe": intent.get("timeframe"),
            "confidence": float(intent.get("confidence") or 0.75),
            "answer": answer,
            "source": source,
            "citation": citation,
            "confidence_level": conf,
            "side": intent.get("side"),
            "quantity": int(intent.get("quantity") or 0) or None,
        }

    if intent_type == "thesis":
        answer = _thesis_pointer(ticker)
        return {
            "intent_type": intent_type,
            "ticker": ticker,
            "metric": intent.get("metric"),
            "timeframe": intent.get("timeframe"),
            "confidence": float(intent.get("confidence") or 0.7),
            "answer": answer,
            "source": "LLM",
            "citation": None,
            "confidence_level": "MEDIUM",
        }

    retrieval = RetrievalAgent()
    citation_agent = CitationAgent()
    validator = ValidatorAgent()
    answer_agent = AnswerAgent()

    ret_out = await retrieval.run(
        {"ticker": ticker, "query": request.text, "limit": 5}
    )
    chunks = ret_out["chunks"]

    cit_out = await citation_agent.run({"chunks": chunks})
    rag_block = cit_out["rag_block"]
    rag_citation = cit_out["citation"]

    await validator.run({"chunks": chunks})

    supplemental = ""
    if len(chunks) < 2 and _looks_computational(request.text):
        wf = await fetch_wolfram_result(request.text)
        if wf:
            supplemental = f"\n\nWolfram Alpha result: {wf}\n"

    local_ctx = build_local_context_block(ticker)

    if not os.getenv("GROQ_API_KEY"):
        return {
            "intent_type": intent_type,
            "ticker": ticker,
            "metric": intent.get("metric"),
            "timeframe": intent.get("timeframe"),
            "confidence": 0.3,
            "answer": "GROQ_API_KEY is not set; cannot run the research pipeline.",
            "source": "LLM",
            "citation": rag_citation,
            "confidence_level": "LOW",
        }

    user_content = (
        f"User question: {request.text}\n"
        f"Ticker focus: {ticker or 'none'}\n"
        f"Metric: {intent.get('metric')}\n"
        f"Timeframe: {intent.get('timeframe')}\n\n"
    )
    if rag_block:
        user_content += "SEC filing excerpts:\n" + rag_block + supplemental
    else:
        user_content += (
            "No SEC excerpts retrieved (database offline or no keyword match). "
            "Answer from general public knowledge and note uncertainty."
        ) + supplemental
    user_content += local_ctx

    ans_out = await answer_agent.run({"user_content": user_content})
    answer = ans_out.get("answer", "")
    await validator.run({"chunks": chunks, "answer": answer})

    source, citation, confidence_level = parse_answer_meta(answer)
    if chunks:
        citation = citation or rag_citation
        if source == "LLM":
            source = "SEC_FILING"

    return {
        "intent_type": intent_type,
        "ticker": ticker,
        "metric": intent.get("metric"),
        "timeframe": intent.get("timeframe"),
        "confidence": float(intent.get("confidence") or 0.8),
        "answer": answer,
        "source": source,
        "citation": citation or rag_citation,
        "confidence_level": confidence_level,
    }
