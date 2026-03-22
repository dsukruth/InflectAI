import { useNavigate } from "react-router-dom";
import { formatCurrency } from "@/utils/formatters";
import type { Position } from "@/types/api";
import type { LiveQuote } from "@/hooks/useStockQuotes";

interface Props {
  positions: Position[];
  quotes: Record<string, LiveQuote>;
  isLoading: boolean;
}

const columns = ["TICKER", "SHARES", "AVG COST", "PRICE", "P&L", "CHANGE"];

const ActivePositions = ({ positions, quotes, isLoading }: Props) => {
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="rounded-2xl" style={{ background: "#0F1820", border: "1px solid hsl(var(--border))", padding: 40 }}>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-5 rounded mb-3"
            style={{
              background: "linear-gradient(90deg, hsl(var(--border)) 25%, hsl(var(--muted)) 50%, hsl(var(--border)) 75%)",
              backgroundSize: "200% 100%",
              animation: "shimmer 1.5s infinite",
            }}
          />
        ))}
      </div>
    );
  }

  if (positions.length === 0) {
    return (
      <div className="rounded-2xl text-center" style={{ background: "#0F1820", border: "1px solid hsl(var(--border))", padding: 40 }}>
        <p style={{ color: "hsl(var(--muted-foreground))", fontSize: 14, marginBottom: 8 }}>No positions yet.</p>
        <p style={{ color: "hsl(var(--muted-foreground))", fontSize: 12, marginBottom: 16 }}>Go to Research to make your first trade.</p>
        <button
          onClick={() => navigate("/app/research")}
          className="transition-colors"
          style={{
            border: "1px solid rgba(240,165,0,0.4)",
            background: "transparent",
            borderRadius: 16,
            padding: "8px 18px",
            color: "hsl(var(--gold))",
            fontSize: 13,
            cursor: "pointer",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(240,165,0,0.08)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
        >
          Go to Research →
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: "#0F1820", border: "1px solid hsl(var(--border))" }}>
      <div className="flex items-center justify-between px-5 py-3" style={{ borderBottom: "1px solid hsl(var(--border))" }}>
        <h3 className="font-semibold" style={{ color: "hsl(var(--foreground))", fontSize: 14 }}>Active Positions</h3>
        <span className="font-mono" style={{ color: "hsl(var(--muted-foreground))", fontSize: 12 }}>{positions.length} positions</span>
      </div>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ background: "#080C14" }}>
            {columns.map((col) => (
              <th key={col} style={{ padding: "10px 20px", textAlign: "left", color: "hsl(var(--muted-foreground))", fontSize: 11, letterSpacing: "0.1em", fontWeight: 500 }}>
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {positions.map((p) => {
            const q = quotes[p.ticker];
            const currentPrice = q?.price ?? p.avg_cost_basis;
            const unrealPnl = (currentPrice - p.avg_cost_basis) * p.quantity;
            const changePct = ((currentPrice - p.avg_cost_basis) / p.avg_cost_basis) * 100;
            const isUp = unrealPnl >= 0;
            const color = isUp ? "hsl(var(--bull))" : "hsl(var(--bear))";

            return (
              <tr
                key={p.id}
                className="transition-colors"
                style={{ borderBottom: "1px solid hsl(var(--border))" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(240,165,0,0.04)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <td className="font-mono font-bold" style={{ padding: "14px 20px", color: "hsl(var(--gold))", fontSize: 14 }}>{p.ticker}</td>
                <td className="font-mono" style={{ padding: "14px 20px", color: "white", fontSize: 14 }}>{p.quantity}</td>
                <td className="font-mono" style={{ padding: "14px 20px", color: "white", fontSize: 14 }}>{formatCurrency(p.avg_cost_basis)}</td>
                <td className="font-mono" style={{ padding: "14px 20px", color: "white", fontSize: 14 }}>{formatCurrency(currentPrice)}</td>
                <td className="font-mono" style={{ padding: "14px 20px", color, fontSize: 14 }}>{isUp ? "+" : ""}{formatCurrency(unrealPnl)}</td>
                <td style={{ padding: "14px 20px" }}>
                  <span
                    className="font-mono font-semibold rounded-full px-2 py-0.5"
                    style={{
                      background: isUp ? "rgba(0,214,143,0.15)" : "rgba(224,85,85,0.15)",
                      color,
                      fontSize: 12,
                    }}
                  >
                    {isUp ? "▲" : "▼"} {isUp ? "+" : ""}{changePct.toFixed(2)}%
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default ActivePositions;
