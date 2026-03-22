import { useState, useEffect, useRef, useCallback } from "react";

export interface TickerQuote {
  ticker: string;
  price: number;
  change: number;
  direction: "up" | "down";
}

const MOCK_QUOTES: TickerQuote[] = [
  { ticker: "AAPL", price: 189.5, change: 2.4, direction: "up" },
  { ticker: "MSFT", price: 415.2, change: 0.9, direction: "up" },
  { ticker: "NVDA", price: 892.3, change: 3.1, direction: "up" },
  { ticker: "AMZN", price: 178.4, change: 1.2, direction: "up" },
  { ticker: "GOOGL", price: 172.3, change: -0.4, direction: "down" },
  { ticker: "META", price: 521.4, change: 1.8, direction: "up" },
  { ticker: "TSLA", price: 245.1, change: -1.8, direction: "down" },
  { ticker: "JPM", price: 198.6, change: 0.5, direction: "up" },
  { ticker: "V", price: 276.9, change: 0.3, direction: "up" },
  { ticker: "UNH", price: 521.3, change: -0.6, direction: "down" },
  { ticker: "XOM", price: 118.4, change: 0.8, direction: "up" },
  { ticker: "JNJ", price: 147.2, change: -0.2, direction: "down" },
  { ticker: "WMT", price: 68.5, change: 0.4, direction: "up" },
  { ticker: "AMD", price: 178.9, change: 2.8, direction: "up" },
  { ticker: "NFLX", price: 628.4, change: 1.5, direction: "up" },
  { ticker: "INTC", price: 30.2, change: -1.2, direction: "down" },
  { ticker: "AVGO", price: 1342.5, change: 1.9, direction: "up" },
  { ticker: "CRM", price: 298.7, change: 0.7, direction: "up" },
  { ticker: "QCOM", price: 168.3, change: -0.8, direction: "down" },
  { ticker: "GS", price: 487.2, change: 1.1, direction: "up" },
  { ticker: "BAC", price: 38.4, change: 0.3, direction: "up" },
  { ticker: "MA", price: 462.8, change: 0.6, direction: "up" },
  { ticker: "COST", price: 728.9, change: 0.9, direction: "up" },
  { ticker: "MCD", price: 289.4, change: -0.3, direction: "down" },
  { ticker: "NKE", price: 94.2, change: -1.1, direction: "down" },
  { ticker: "SBUX", price: 79.6, change: 0.4, direction: "up" },
  { ticker: "PFE", price: 27.3, change: -0.5, direction: "down" },
  { ticker: "CVX", price: 152.4, change: 0.7, direction: "up" },
  { ticker: "CAT", price: 348.9, change: 1.3, direction: "up" },
  { ticker: "BA", price: 178.2, change: -0.9, direction: "down" },
];

const API_URL =
  import.meta.env.VITE_API_URL || "https://inflect-backend-symvnfqjla-uc.a.run.app";

export type MarketStatus = "live" | "premarket" | "afterhours" | "closed";

function getMarketStatus(): MarketStatus {
  const now = new Date();
  const day = now.getUTCDay();
  const isWeekday = day >= 1 && day <= 5;
  if (!isWeekday) return "closed";

  const etHours = now.getUTCHours() - 5 + now.getUTCMinutes() / 60;
  if (etHours >= 9.5 && etHours < 16) return "live";
  if (etHours >= 4 && etHours < 9.5) return "premarket";
  if (etHours >= 16 && etHours < 20) return "afterhours";
  return "closed";
}

export function useTicker() {
  const [quotes, setQuotes] = useState<TickerQuote[]>(MOCK_QUOTES);
  const [flashedTickers, setFlashedTickers] = useState<Set<string>>(new Set());
  const [marketStatus, setMarketStatus] = useState<MarketStatus>(getMarketStatus);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  const fetchQuotes = useCallback(async () => {
    if (!API_URL) return;
    try {
      const res = await fetch(`${API_URL}/api/v1/market/tickers`);
      if (!res.ok) return;
      const data: TickerQuote[] = await res.json();
      setQuotes((prev) => {
        const changed = new Set<string>();
        data.forEach((q) => {
          const old = prev.find((p) => p.ticker === q.ticker);
          if (old && old.price !== q.price) changed.add(q.ticker);
        });
        if (changed.size > 0) {
          setFlashedTickers(changed);
          setTimeout(() => setFlashedTickers(new Set()), 500);
        }
        return data;
      });
    } catch {
      // silently fall back to current data
    }
  }, []);

  useEffect(() => {
    fetchQuotes();
    intervalRef.current = setInterval(fetchQuotes, 60_000);
    const statusInterval = setInterval(() => setMarketStatus(getMarketStatus()), 30_000);
    return () => {
      clearInterval(intervalRef.current);
      clearInterval(statusInterval);
    };
  }, [fetchQuotes]);

  return { quotes, flashedTickers, marketStatus };
}
