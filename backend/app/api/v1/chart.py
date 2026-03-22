from __future__ import annotations
"""Chart data — delegates to chart agent."""

from fastapi import APIRouter, Query

from app.agents.chart_agent import ChartAgent

router = APIRouter()


@router.get("/data")
async def chart_data(
    ticker: str = Query(..., min_length=1, max_length=8),
    metric: str | None = None,
    timeframe: str | None = None,
):
    return await ChartAgent().run(
        {"ticker": ticker, "metric": metric, "timeframe": timeframe}
    )
