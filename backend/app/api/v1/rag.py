from __future__ import annotations
"""Debug RAG search — uses retrieval agent."""

from fastapi import APIRouter
from pydantic import BaseModel

from app.agents.sec_research.retrieval_agent import RetrievalAgent

router = APIRouter()


class RagSearchRequest(BaseModel):
    ticker: str | None = None
    query: str
    limit: int = 5


@router.post("/search")
async def rag_search(req: RagSearchRequest):
    agent = RetrievalAgent()
    out = await agent.run(
        {
            "ticker": req.ticker,
            "query": req.query,
            "limit": min(req.limit, 20),
        }
    )
    chunks = out["chunks"]
    return {"count": len(chunks), "chunks": chunks}
