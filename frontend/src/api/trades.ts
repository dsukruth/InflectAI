import { apiCall } from "./client";
import type { Position, Trade } from "@/types/api";

export interface TradeResult {
  fill_price: number;
  total_value: number;
  status: string;
  trade_id?: string;
  buying_power?: number;
}

export interface PortfolioData {
  positions: Position[];
  trades: Trade[];
  buying_power: number;
}

export async function executeTrade(order: {
  ticker: string;
  side: "buy" | "sell";
  quantity: number;
  order_type: "market";
}): Promise<TradeResult> {
  return apiCall<TradeResult>("/api/v1/trades/execute", {
    method: "POST",
    body: JSON.stringify(order),
  });
}

export async function fetchPortfolio(): Promise<PortfolioData> {
  return apiCall<PortfolioData>("/api/v1/trades/portfolio");
}
