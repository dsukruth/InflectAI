import { apiCall } from "./client";
import type { StockQuote } from "@/types/api";

export type MarketHistoryRange = "7d" | "30d" | "90d";

export interface MarketHistory {
  ticker: string;
  range: MarketHistoryRange;
  points: { date: string; close: number }[];
  sparkline: { v: number }[];
}

export interface MetricCardApi {
  metric_key: string;
  metric: string;
  value: string;
  period: string;
  change: string | null;
  change_direction: "up" | "down" | null;
  source: "SNOWFLAKE" | "YFINANCE" | "UNAVAILABLE";
  citation: string | null;
}

export async function getQuote(ticker: string): Promise<StockQuote> {
  return apiCall<StockQuote>(`/api/v1/market/quote?ticker=${encodeURIComponent(ticker)}`);
}

export async function getMarketHistory(
  ticker: string,
  range: MarketHistoryRange = "30d"
): Promise<MarketHistory> {
  const q = new URLSearchParams({ ticker, range });
  return apiCall<MarketHistory>(`/api/v1/market/history?${q.toString()}`);
}

export async function getMetricCard(ticker: string, metric: string): Promise<MetricCardApi> {
  const q = new URLSearchParams({ ticker, metric });
  return apiCall<MetricCardApi>(`/api/v1/market/metric?${q.toString()}`);
}
