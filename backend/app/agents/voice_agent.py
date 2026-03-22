"""Voice agent — Groq LLM with live stock data tool calling."""

from __future__ import annotations

import json
import os

import httpx

from app.agents.base_agent import BaseAgent

GROQ_API_KEY = os.getenv("GROQ_API_KEY")

TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "get_stock_data",
            "description": (
                "Get live stock price, daily change, market cap, P/E ratio, and "
                "52-week range. Use this for ANY question about current or recent "
                "stock prices, performance, or market data."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "ticker": {
                        "type": "string",
                        "description": "Stock ticker symbol (e.g. AAPL) or company name (e.g. Apple, Tesla). Both are accepted.",
                    }
                },
                "required": ["ticker"],
            },
        },
    }
]

SYSTEM_PROMPT = """You are Inflect, a brilliant AI assistant built for a voice-first paper trading platform.

You can answer ANY question a person asks — finance, science, history, math, pop culture, anything.
You are knowledgeable, confident, and conversational.

You also have a live stock data tool. Use it automatically whenever someone asks about:
- Current stock prices or recent performance
- Whether a stock is up or down today
- Any real-time market data

For everything else — just answer directly and confidently from your knowledge.
Never say you cannot help. Never say you don't know — give your best answer.
Keep all responses under 3 sentences, clear and natural for voice.
Never use markdown, bullet points, or symbols."""


def _get_stock_data(query: str) -> str:
    """Fetch stock data from the internal market API. Accepts ticker or company name."""
    import os
    backend_url = os.getenv("BACKEND_URL", "http://localhost:8000")
    try:
        with httpx.Client(timeout=15.0) as client:
            resp = client.get(
                f"{backend_url}/api/v1/market/stock-info",
                params={"q": query},
            )
        if resp.status_code == 200:
            return resp.json().get("summary", f"No summary available for {query}.")
        return f"Could not retrieve data for {query}."
    except Exception as e:
        return f"Could not retrieve data for {query}: {str(e)}"


class VoiceAgent(BaseAgent):
    """Conversational agent for the voice pipeline.

    Input:  {"transcript": str}
    Output: {"response": str}
    """

    name = "voice"

    async def run(self, input: dict) -> dict:
        transcript = input.get("transcript", "").strip()
        if not transcript:
            return {"response": "I didn't catch that. Could you say it again?"}

        headers = {
            "Authorization": f"Bearer {GROQ_API_KEY}",
            "Content-Type": "application/json",
        }
        messages: list[dict] = [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": transcript},
        ]

        async with httpx.AsyncClient(timeout=30.0) as client:
            r = await client.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers=headers,
                json={
                    "model": "llama-3.3-70b-versatile",
                    "messages": messages,
                    "tools": TOOLS,
                    "tool_choice": "auto",
                    "temperature": 0.4,
                    "max_tokens": 300,
                },
            )

        result = r.json()
        message = result["choices"][0]["message"]

        if message.get("tool_calls"):
            tool_call = message["tool_calls"][0]
            args = json.loads(tool_call["function"]["arguments"])
            tool_result = _get_stock_data(args["ticker"])

            messages = [
                *messages,
                {
                    "role": "assistant",
                    "content": None,
                    "tool_calls": message["tool_calls"],
                },
                {
                    "role": "tool",
                    "tool_call_id": tool_call["id"],
                    "content": tool_result,
                },
            ]

            async with httpx.AsyncClient(timeout=30.0) as client:
                final = await client.post(
                    "https://api.groq.com/openai/v1/chat/completions",
                    headers=headers,
                    json={
                        "model": "llama-3.3-70b-versatile",
                        "messages": messages,
                        "temperature": 0.4,
                        "max_tokens": 300,
                    },
                )

            return {"response": final.json()["choices"][0]["message"]["content"].strip()}

        return {"response": message.get("content", "I'm sorry, I could not process that.").strip()}
