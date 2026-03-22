import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuthStore } from "@/store/authStore";
import { usePortfolioStore } from "@/store/portfolioStore";
import { supabase } from "@/integrations/supabase/client";
import { useStockQuotes } from "@/hooks/useStockQuotes";
import { formatCurrency, formatPercent } from "@/utils/formatters";
import ActivePositions from "@/components/portfolio/ActivePositions";
import TradeHistory from "@/components/trading/TradeHistory";
import type { Position, Trade } from "@/types/api";

const AppPortfolio = () => {
  const { user } = useAuthStore();
  const { positions, trades, buyingPower, setPositions, setTrades, setBuyingPower } = usePortfolioStore();
  const [isLoading, setIsLoading] = useState(true);

  const positionTickers = useMemo(() => positions.map((p) => p.ticker), [positions]);
  const { quotes } = useStockQuotes(positionTickers, 30_000);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    const [posRes, tradeRes, profileRes] = await Promise.all([
      supabase.from("positions").select("*").eq("user_id", user.id),
      supabase.from("trades").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(50),
      supabase.from("profiles").select("buying_power").eq("id", user.id).single(),
    ]);
    if (posRes.data) setPositions(posRes.data as unknown as Position[]);
    if (tradeRes.data) setTrades(tradeRes.data as unknown as Trade[]);
    if (profileRes.data) setBuyingPower(profileRes.data.buying_power);
    setIsLoading(false);
  }, [user, setPositions, setTrades, setBuyingPower]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Portfolio stats
  const positionsValue = positions.reduce((sum, p) => {
    const q = quotes[p.ticker];
    return sum + (q?.price ?? p.avg_cost_basis) * p.quantity;
  }, 0);
  const totalValue = positionsValue + buyingPower;
  const totalPnl = positions.reduce((sum, p) => {
    const q = quotes[p.ticker];
    if (!q) return sum;
    return sum + (q.price - p.avg_cost_basis) * p.quantity;
  }, 0);

  const summaryCards = [
    { label: "TOTAL VALUE", value: formatCurrency(totalValue), color: "hsl(var(--foreground))" },
    { label: "BUYING POWER", value: formatCurrency(buyingPower), color: "hsl(var(--cyan))" },
    {
      label: "UNREALIZED P&L",
      value: `${totalPnl >= 0 ? "+" : ""}${formatCurrency(totalPnl)}`,
      color: totalPnl >= 0 ? "hsl(var(--bull))" : "hsl(var(--bear))",
    },
    { label: "POSITIONS", value: String(positions.length), color: "hsl(var(--gold))" },
  ];

  return (
    <div className="relative z-[2]" style={{ padding: "20px" }}>
      {/* Summary row */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {summaryCards.map((c) => (
          <div
            key={c.label}
            className="rounded-2xl"
            style={{
              background: "#0F1820",
              border: "1px solid hsl(var(--border))",
              borderTop: "2px solid hsl(var(--gold))",
              padding: 16,
            }}
          >
            <p className="uppercase" style={{ color: "hsl(var(--muted-foreground))", fontSize: 11, letterSpacing: "0.5px", marginBottom: 8 }}>
              {c.label}
            </p>
            {isLoading ? (
              <div className="h-7 rounded" style={{
                background: "linear-gradient(90deg, hsl(var(--border)) 25%, hsl(var(--muted)) 50%, hsl(var(--border)) 75%)",
                backgroundSize: "200% 100%", animation: "shimmer 1.5s infinite",
              }} />
            ) : (
              <p className="font-mono font-bold" style={{ color: c.color, fontSize: 22 }}>{c.value}</p>
            )}
          </div>
        ))}
      </div>

      {/* Positions */}
      <h3 className="uppercase mb-3" style={{ color: "hsl(var(--muted-foreground))", fontSize: 11, letterSpacing: "0.1em" }}>
        Active Positions
      </h3>
      <ActivePositions positions={positions} quotes={quotes} isLoading={isLoading} />

      {/* Trade History */}
      <h3 className="uppercase mt-8 mb-3" style={{ color: "hsl(var(--muted-foreground))", fontSize: 11, letterSpacing: "0.1em" }}>
        Trade History
      </h3>
      <TradeHistory trades={trades} isLoading={isLoading} />
    </div>
  );
};

export default AppPortfolio;
