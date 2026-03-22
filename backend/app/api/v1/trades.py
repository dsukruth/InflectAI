"""Paper trades — execute, persist, and retrieve."""

from typing import Optional

from fastapi import APIRouter, Header, HTTPException

from app.agents.trade_agent import TradeAgent
from app.schemas.trade import TradeRequest
from app.services.trade_store import (
    get_equity_curve,
    get_positions,
    get_profile,
    get_trades,
    init_db,
    insert_trade,
    update_buying_power,
    upsert_position_buy,
    upsert_position_sell,
)

init_db()
router = APIRouter()

_ANON = "anon"


def _user_id(authorization: Optional[str]) -> str:
    """Stable user id from bearer token, or 'anon' in dev mode."""
    if authorization and authorization.startswith("Bearer "):
        token = authorization[7:]
        return token[:40] if len(token) >= 8 else _ANON
    return _ANON


@router.post("/execute")
async def execute_trade(
    order: TradeRequest,
    authorization: Optional[str] = Header(default=None),
):
    result = await TradeAgent().run(order.model_dump())
    if result.get("status") == "failed":
        raise HTTPException(status_code=400, detail=result.get("error", "Trade failed"))

    user_id = _user_id(authorization)
    ticker = result["ticker"]
    side = result["side"]
    quantity = float(result["quantity"])
    fill_price = float(result["fill_price"])
    total_value = float(result["total_value"])

    trade_row = insert_trade(user_id, ticker, side, quantity, fill_price, total_value)

    if side == "buy":
        upsert_position_buy(user_id, ticker, quantity, fill_price)
    else:
        upsert_position_sell(user_id, ticker, quantity)

    profile = get_profile(user_id)
    new_bp = profile["buying_power"] - total_value if side == "buy" else profile["buying_power"] + total_value
    update_buying_power(user_id, new_bp)

    return {**result, "trade_id": trade_row["id"], "buying_power": round(new_bp, 2)}


@router.get("/history")
async def trade_history(
    authorization: Optional[str] = Header(default=None),
    limit: int = 50,
):
    return {"trades": get_trades(_user_id(authorization), limit)}


@router.get("/positions")
async def trade_positions(
    authorization: Optional[str] = Header(default=None),
):
    return {"positions": get_positions(_user_id(authorization))}


@router.get("/portfolio")
async def portfolio(
    authorization: Optional[str] = Header(default=None),
):
    user_id = _user_id(authorization)
    return {
        "positions": get_positions(user_id),
        "trades": get_trades(user_id, limit=50),
        "buying_power": get_profile(user_id)["buying_power"],
    }


@router.get("/equity-curve")
async def equity_curve(
    authorization: Optional[str] = Header(default=None),
):
    return {"snapshots": get_equity_curve(_user_id(authorization))}
