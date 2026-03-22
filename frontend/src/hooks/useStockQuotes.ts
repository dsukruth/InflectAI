import { useState, useEffect, useCallback, useRef } from "react";

const API_URL =
  import.meta.env.VITE_API_URL || "https://inflect-backend-symvnfqjla-uc.a.run.app";

export interface LiveQuote {
  ticker: string;
  price: number;
  change_percent: number;
}

export function useStockQuotes(tickers: string[], refreshMs = 30_000) {
  const [quotes, setQuotes] = useState<Record<string, LiveQuote>>({});
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  const fetchAll = useCallback(async () => {
    if (tickers.length === 0) { setLoading(false); return; }
    try {
      const results = await Promise.all(
        tickers.map(async (t) => {
          try {
            const res = await fetch(`${API_URL}/api/v1/market/quote?ticker=${t}`);
            if (!res.ok) return null;
            const data = await res.json();
            return { ticker: t, price: data.price, change_percent: data.change_percent ?? 0 } as LiveQuote;
          } catch { return null; }
        })
      );
      const map: Record<string, LiveQuote> = {};
      results.forEach((r) => { if (r) map[r.ticker] = r; });
      setQuotes(map);
    } catch { /* silent */ }
    setLoading(false);
  }, [tickers.join(",")]);

  useEffect(() => {
    setLoading(true);
    fetchAll();
    intervalRef.current = setInterval(fetchAll, refreshMs);
    return () => clearInterval(intervalRef.current);
  }, [fetchAll, refreshMs]);

  return { quotes, loading, refetch: fetchAll };
}
