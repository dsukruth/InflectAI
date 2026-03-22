import { useState, useEffect, useCallback, useMemo } from "react";
import { usePortfolioStore } from "@/store/portfolioStore";
import { fetchPortfolio } from "@/api/trades";
import { useStockQuotes } from "@/hooks/useStockQuotes";
import StatCards from "@/components/portfolio/StatCards";
import EquityCurve from "@/components/portfolio/EquityCurve";
import ActivePositions from "@/components/portfolio/ActivePositions";
import AIInsights from "@/components/portfolio/AIInsights";
import QuickTrade from "@/components/portfolio/QuickTrade";
import Watchlist from "@/components/portfolio/Watchlist";

const AppHome = () => {
  const { positions, trades, buyingPower, setPositions, setTrades, setBuyingPower } = usePortfolioStore();
  const [isLoading, setIsLoading] = useState(true);
  const [tradeCount, setTradeCount] = useState(0);

  const positionTickers = useMemo(() => positions.map((p) => p.ticker), [positions]);
  const { quotes, refetch: refetchQuotes } = useStockQuotes(positionTickers, 30_000);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await fetchPortfolio();
      setPositions(data.positions);
      setTrades(data.trades);
      setBuyingPower(data.buying_power);
    } catch (e) {
      console.error("Portfolio load error:", e);
    } finally {
      setIsLoading(false);
    }
  }, [setPositions, setTrades, setBuyingPower]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleTradeComplete = useCallback(async () => {
    await fetchData();
    refetchQuotes();
    setTradeCount((n) => n + 1);
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
          <EquityCurve refreshKey={tradeCount} />
          <ActivePositions positions={positions} quotes={quotes} isLoading={isLoading} />
          <AIInsights />
        </div>
        <div className="space-y-4">
          <QuickTrade onTradeComplete={handleTradeComplete} quotes={quotes} />
          <Watchlist onTickerClick={() => {}} />
        </div>
      </div>
    </div>
  );
};

export default AppHome;
