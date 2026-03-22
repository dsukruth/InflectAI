import { usePortfolioStore } from "@/store/portfolioStore";
import { useTicker } from "@/hooks/useTicker";
import { formatCurrency } from "@/utils/formatters";

const PortfolioWidget = () => {
  const { positions, buyingPower, trades } = usePortfolioStore();
  const { quotes } = useTicker();

  // Build a quote lookup from the ticker bar
  const quoteMap = Object.fromEntries(quotes.map((q) => [q.ticker, q]));

  const positionsWithPnl = positions.map((p) => {
    const q = quoteMap[p.ticker];
    const currentPrice = q?.price ?? p.avg_cost_basis;
    const pnl = (currentPrice - p.avg_cost_basis) * p.quantity;
    const pnlPct = ((currentPrice - p.avg_cost_basis) / p.avg_cost_basis) * 100;
    const marketValue = currentPrice * p.quantity;
    return { ...p, currentPrice, pnl, pnlPct, marketValue };
  });

  const totalMarketValue = positionsWithPnl.reduce((s, p) => s + p.marketValue, 0);
  const totalPnl = positionsWithPnl.reduce((s, p) => s + p.pnl, 0);
  const recentTrades = trades.slice(0, 3);

  return (
    <div className="glass-panel glass-edge-gold overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <h3 className="font-mono" style={{ color: "hsl(var(--muted-foreground))", fontSize: 10, letterSpacing: "0.15em" }}>
          MY PORTFOLIO
        </h3>
        <span className="font-mono" style={{ color: "hsl(var(--muted-foreground))", fontSize: 10 }}>
          {positions.length} position{positions.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-3 px-4 py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)", gap: 8 }}>
        <div>
          <p className="font-mono" style={{ color: "hsl(var(--muted-foreground))", fontSize: 9, letterSpacing: "0.1em", marginBottom: 2 }}>CASH</p>
          <p className="font-mono" style={{ color: "hsl(var(--cyan))", fontSize: 12, fontWeight: 700 }}>{formatCurrency(buyingPower)}</p>
        </div>
        <div>
          <p className="font-mono" style={{ color: "hsl(var(--muted-foreground))", fontSize: 9, letterSpacing: "0.1em", marginBottom: 2 }}>POSITIONS</p>
          <p className="font-mono" style={{ color: "hsl(var(--foreground))", fontSize: 12, fontWeight: 700 }}>{formatCurrency(totalMarketValue)}</p>
        </div>
        <div>
          <p className="font-mono" style={{ color: "hsl(var(--muted-foreground))", fontSize: 9, letterSpacing: "0.1em", marginBottom: 2 }}>UNREAL P&L</p>
          <p className="font-mono" style={{ color: totalPnl >= 0 ? "hsl(var(--bull))" : "hsl(var(--bear))", fontSize: 12, fontWeight: 700 }}>
            {totalPnl >= 0 ? "+" : ""}{formatCurrency(totalPnl)}
          </p>
        </div>
      </div>

      {/* Position rows */}
      {positionsWithPnl.length > 0 ? (
        <div>
          <div className="grid px-4 py-1" style={{ gridTemplateColumns: "1fr auto auto", gap: 8, borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
            {["TICKER", "SHARES · PRICE", "P&L"].map((h) => (
              <span key={h} className="font-mono" style={{ color: "hsl(var(--muted-foreground))", fontSize: 9, letterSpacing: "0.08em" }}>{h}</span>
            ))}
          </div>
          {positionsWithPnl.map((p) => {
            const isUp = p.pnl >= 0;
            const color = isUp ? "hsl(var(--bull))" : "hsl(var(--bear))";
            return (
              <div
                key={p.id}
                className="grid px-4 py-2.5 items-center"
                style={{ gridTemplateColumns: "1fr auto auto", gap: 8, borderBottom: "1px solid rgba(255,255,255,0.03)" }}
              >
                <div>
                  <p className="font-mono" style={{ color: "hsl(var(--gold))", fontSize: 12, fontWeight: 700 }}>{p.ticker}</p>
                  <p className="font-mono" style={{ color: "hsl(var(--muted-foreground))", fontSize: 10 }}>avg {formatCurrency(p.avg_cost_basis)}</p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <p className="font-mono" style={{ color: "hsl(var(--foreground))", fontSize: 11 }}>{p.quantity} @ {formatCurrency(p.currentPrice)}</p>
                  <p className="font-mono" style={{ color: "hsl(var(--muted-foreground))", fontSize: 10 }}>{formatCurrency(p.marketValue)}</p>
                </div>
                <div style={{ textAlign: "right", minWidth: 60 }}>
                  <p className="font-mono" style={{ color, fontSize: 11, fontWeight: 600 }}>
                    {isUp ? "+" : ""}{formatCurrency(p.pnl)}
                  </p>
                  <p className="font-mono" style={{ color, fontSize: 10 }}>
                    {isUp ? "▲" : "▼"} {Math.abs(p.pnlPct).toFixed(2)}%
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="px-4 py-4 text-center">
          <p style={{ color: "hsl(var(--muted-foreground))", fontSize: 11 }}>No positions yet.</p>
          <p style={{ color: "hsl(var(--muted-foreground))", fontSize: 10, marginTop: 2 }}>Execute a trade to see positions here.</p>
        </div>
      )}

      {/* Recent trades */}
      {recentTrades.length > 0 && (
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <p className="font-mono px-4 pt-3 pb-1" style={{ color: "hsl(var(--muted-foreground))", fontSize: 9, letterSpacing: "0.1em" }}>RECENT TRADES</p>
          {recentTrades.map((t) => (
            <div key={t.id} className="flex items-center justify-between px-4 py-2" style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
              <div className="flex items-center gap-2">
                <span
                  className="font-mono"
                  style={{
                    fontSize: 9,
                    padding: "2px 6px",
                    borderRadius: 4,
                    background: t.side === "buy" ? "rgba(0,214,143,0.15)" : "rgba(224,85,85,0.15)",
                    color: t.side === "buy" ? "hsl(var(--bull))" : "hsl(var(--bear))",
                    fontWeight: 700,
                    textTransform: "uppercase",
                  }}
                >
                  {t.side}
                </span>
                <span className="font-mono" style={{ color: "hsl(var(--gold))", fontSize: 11, fontWeight: 700 }}>{t.ticker}</span>
                <span style={{ color: "hsl(var(--muted-foreground))", fontSize: 10 }}>{t.quantity} shares</span>
              </div>
              <span className="font-mono" style={{ color: "hsl(var(--foreground))", fontSize: 11 }}>{formatCurrency(t.fill_price)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PortfolioWidget;
