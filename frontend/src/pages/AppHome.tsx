import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuthStore } from "@/store/authStore";
import { usePortfolioStore } from "@/store/portfolioStore";
import { supabase } from "@/integrations/supabase/client";
import { useStockQuotes } from "@/hooks/useStockQuotes";
import StatCards from "@/components/portfolio/StatCards";
import EquityCurve from "@/components/portfolio/EquityCurve";
import ActivePositions from "@/components/portfolio/ActivePositions";
import AIInsights from "@/components/portfolio/AIInsights";
import QuickTrade from "@/components/portfolio/QuickTrade";
import Watchlist from "@/components/portfolio/Watchlist";
import type { Position, Trade } from "@/types/api";

const AppHome = () => {
  const { user } = useAuthStore();
  const { positions, trades, buyingPower, setPositions, setTrades, setBuyingPower } = usePortfolioStore();
  const [isLoading, setIsLoading] = useState(true);

  const positionTickers = useMemo(() => positions.map((p) => p.ticker), [positions]);
  const { quotes, refetch: refetchQuotes } = useStockQuotes(positionTickers, 30_000);

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

  const handleTradeComplete = useCallback(() => {
    fetchData();
    refetchQuotes();
  }, [fetchData, refetchQuotes]);

  const positionsValue = positions.reduce((sum, p) => {
    const q = quotes[p.ticker];
    const price = q?.price ?? p.avg_cost_basis;
    return sum + price * p.quantity;
  }, 0);
  const portfolioValue = positionsValue + buyingPower;
  const todayPnl = positions.reduce((sum, p) => {
    const q = quotes[p.ticker];
    if (!q) return sum;
    return sum + (q.price - p.avg_cost_basis) * p.quantity;
  }, 0);

  const handleWatchlistClick = useCallback((_ticker: string) => {
    // Future: pre-fill quick trade
  }, []);

  return (
    <div className="relative z-[2]" style={{ padding: "20px" }}>
      <div className="grid gap-4" style={{ gridTemplateColumns: "65% 35%" }}>
        <div className="space-y-4">
          <StatCards
            portfolioValue={portfolioValue}
            todayPnl={todayPnl}
            buyingPower={buyingPower}
            positionCount={positions.length}
            isLoading={isLoading}
          />
          <EquityCurve />
          <ActivePositions positions={positions} quotes={quotes} isLoading={isLoading} />
          <AIInsights />
        </div>
        <div className="space-y-4">
          <QuickTrade onTradeComplete={handleTradeComplete} quotes={quotes} />
          <Watchlist onTickerClick={handleWatchlistClick} />
        </div>
      </div>
    </div>
  );
};

export default AppHome;
