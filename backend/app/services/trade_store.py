"""
SQLite-backed trade and position store.
Persists trades and positions locally — no Supabase dependency.
DB file: backend/data/inflect_trades.db (auto-created on first use).
"""

from __future__ import annotations

import sqlite3
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

_DB_PATH = Path(__file__).resolve().parents[3] / "data" / "inflect_trades.db"


def _conn() -> sqlite3.Connection:
    _DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    con = sqlite3.connect(_DB_PATH)
    con.row_factory = sqlite3.Row
    return con


def init_db() -> None:
    with _conn() as con:
        con.executescript("""
            CREATE TABLE IF NOT EXISTS trades (
                id          TEXT PRIMARY KEY,
                user_id     TEXT NOT NULL,
                ticker      TEXT NOT NULL,
                side        TEXT NOT NULL,
                quantity    REAL NOT NULL,
                fill_price  REAL NOT NULL,
                total_value REAL NOT NULL,
                status      TEXT NOT NULL DEFAULT 'filled',
                created_at  TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS positions (
                id              TEXT PRIMARY KEY,
                user_id         TEXT NOT NULL,
                ticker          TEXT NOT NULL,
                quantity        REAL NOT NULL,
                avg_cost_basis  REAL NOT NULL,
                created_at      TEXT NOT NULL,
                updated_at      TEXT NOT NULL,
                UNIQUE(user_id, ticker)
            );
        """)


# ── Trades ──────────────────────────────────────────────────────────────────

def insert_trade(
    user_id: str,
    ticker: str,
    side: str,
    quantity: float,
    fill_price: float,
    total_value: float,
) -> dict[str, Any]:
    now = datetime.now(timezone.utc).isoformat()
    row_id = str(uuid.uuid4())
    with _conn() as con:
        con.execute(
            """INSERT INTO trades (id, user_id, ticker, side, quantity, fill_price, total_value, status, created_at)
               VALUES (?,?,?,?,?,?,?,'filled',?)""",
            (row_id, user_id, ticker, side, quantity, fill_price, total_value, now),
        )
    return {
        "id": row_id, "user_id": user_id, "ticker": ticker, "side": side,
        "quantity": quantity, "fill_price": fill_price,
        "total_value": total_value, "status": "filled", "created_at": now,
    }


def get_trades(user_id: str, limit: int = 50) -> list[dict[str, Any]]:
    with _conn() as con:
        rows = con.execute(
            "SELECT * FROM trades WHERE user_id=? ORDER BY created_at DESC LIMIT ?",
            (user_id, limit),
        ).fetchall()
    return [dict(r) for r in rows]


# ── Positions ────────────────────────────────────────────────────────────────

def upsert_position_buy(
    user_id: str, ticker: str, quantity: float, fill_price: float
) -> dict[str, Any]:
    now = datetime.now(timezone.utc).isoformat()
    with _conn() as con:
        existing = con.execute(
            "SELECT * FROM positions WHERE user_id=? AND ticker=?", (user_id, ticker)
        ).fetchone()
        if existing:
            new_qty = existing["quantity"] + quantity
            new_avg = (existing["quantity"] * existing["avg_cost_basis"] + quantity * fill_price) / new_qty
            con.execute(
                "UPDATE positions SET quantity=?, avg_cost_basis=?, updated_at=? WHERE id=?",
                (new_qty, new_avg, now, existing["id"]),
            )
            return {**dict(existing), "quantity": new_qty, "avg_cost_basis": new_avg, "updated_at": now}
        else:
            row_id = str(uuid.uuid4())
            con.execute(
                """INSERT INTO positions (id, user_id, ticker, quantity, avg_cost_basis, created_at, updated_at)
                   VALUES (?,?,?,?,?,?,?)""",
                (row_id, user_id, ticker, quantity, fill_price, now, now),
            )
            return {
                "id": row_id, "user_id": user_id, "ticker": ticker,
                "quantity": quantity, "avg_cost_basis": fill_price,
                "created_at": now, "updated_at": now,
            }


def upsert_position_sell(
    user_id: str, ticker: str, quantity: float
) -> dict[str, Any] | None:
    now = datetime.now(timezone.utc).isoformat()
    with _conn() as con:
        existing = con.execute(
            "SELECT * FROM positions WHERE user_id=? AND ticker=?", (user_id, ticker)
        ).fetchone()
        if not existing:
            return None
        new_qty = existing["quantity"] - quantity
        if new_qty <= 0:
            con.execute("DELETE FROM positions WHERE id=?", (existing["id"],))
            return None
        con.execute(
            "UPDATE positions SET quantity=?, updated_at=? WHERE id=?",
            (new_qty, now, existing["id"]),
        )
        return {**dict(existing), "quantity": new_qty, "updated_at": now}


def get_positions(user_id: str) -> list[dict[str, Any]]:
    with _conn() as con:
        rows = con.execute(
            "SELECT * FROM positions WHERE user_id=? ORDER BY ticker", (user_id,)
        ).fetchall()
    return [dict(r) for r in rows]


def get_profile(user_id: str) -> dict[str, Any]:
    """Buying power stored per user in a simple key-value record."""
    with _conn() as con:
        con.execute("""
            CREATE TABLE IF NOT EXISTS profiles (
                user_id      TEXT PRIMARY KEY,
                buying_power REAL NOT NULL DEFAULT 100000
            )
        """)
        row = con.execute("SELECT buying_power FROM profiles WHERE user_id=?", (user_id,)).fetchone()
        if row:
            return {"buying_power": row["buying_power"]}
        con.execute("INSERT INTO profiles(user_id, buying_power) VALUES(?,100000)", (user_id,))
        return {"buying_power": 100000.0}


def update_buying_power(user_id: str, new_value: float) -> None:
    with _conn() as con:
        con.execute("""
            CREATE TABLE IF NOT EXISTS profiles (
                user_id      TEXT PRIMARY KEY,
                buying_power REAL NOT NULL DEFAULT 100000
            )
        """)
        con.execute(
            "INSERT INTO profiles(user_id, buying_power) VALUES(?,?) ON CONFLICT(user_id) DO UPDATE SET buying_power=?",
            (user_id, new_value, new_value),
        )


# ── Equity curve ─────────────────────────────────────────────────────────────

_INITIAL_BUYING_POWER = 100_000.0


def get_equity_curve(user_id: str) -> list[dict[str, Any]]:
    """Reconstruct portfolio value at every trade using fill prices.

    Returns chronological snapshots: [{date, value, cash, positions_value}].
    The first point is the starting $100k before any trades.
    """
    with _conn() as con:
        rows = con.execute(
            "SELECT ticker, side, quantity, fill_price, total_value, created_at "
            "FROM trades WHERE user_id=? ORDER BY created_at ASC",
            (user_id,),
        ).fetchall()

    trades = [dict(r) for r in rows]

    if not trades:
        return []

    cash = _INITIAL_BUYING_POWER
    # ticker -> {qty, avg_cost}
    holdings: dict[str, dict[str, float]] = {}
    snapshots: list[dict[str, Any]] = []

    # Opening point
    snapshots.append({"date": trades[0]["created_at"][:10], "value": cash, "cash": cash, "positions_value": 0.0})

    for t in trades:
        if t["side"] == "buy":
            cash -= t["total_value"]
            existing = holdings.get(t["ticker"])
            if existing:
                new_qty = existing["qty"] + t["quantity"]
                new_avg = (existing["qty"] * existing["avg_cost"] + t["quantity"] * t["fill_price"]) / new_qty
                holdings[t["ticker"]] = {"qty": new_qty, "avg_cost": new_avg}
            else:
                holdings[t["ticker"]] = {"qty": t["quantity"], "avg_cost": t["fill_price"]}
        else:
            cash += t["total_value"]
            existing = holdings.get(t["ticker"])
            if existing:
                new_qty = existing["qty"] - t["quantity"]
                if new_qty <= 0:
                    del holdings[t["ticker"]]
                else:
                    holdings[t["ticker"]] = {"qty": new_qty, "avg_cost": existing["avg_cost"]}

        # Value positions at their last known fill price (best approximation without tick data)
        positions_value = sum(h["qty"] * h["avg_cost"] for h in holdings.values())
        total = round(cash + positions_value, 2)

        snapshots.append({
            "date": t["created_at"][:10],
            "value": total,
            "cash": round(cash, 2),
            "positions_value": round(positions_value, 2),
        })

    return snapshots
