import { usePortfolioStore } from "@/store/portfolioStore";
import { useTicker } from "@/hooks/useTicker";
import { LineChart, Line, ResponsiveContainer } from "recharts";

const LOGO_TOKEN = "pk_AH1Nlal1QY6dlBilaz85Bg";

const TICKER_TO_DOMAIN: Record<string, string> = {
  AAPL: "apple.com", MSFT: "microsoft.com", NVDA: "nvidia.com", AMZN: "amazon.com",
  GOOGL: "google.com", META: "meta.com", TSLA: "tesla.com", JPM: "jpmorgan.com",
  V: "visa.com", UNH: "unitedhealthgroup.com",
};

const generateSparkline = (dir: "up" | "down") =>
  Array.from({ length: 12 }, (_, i) => ({
    v: 100 + (dir === "up" ? 1 : -1) * Math.sin(i * 0.6) * 2 + (dir === "up" ? i * 0.3 : -i * 0.3) + Math.random(),
  }));

const PortfolioWidget = () => {
  const { totalValue, buyingPower } = usePortfolioStore();
  const { quotes } = useTicker();
  const topStocks = quotes.slice(0, 3);

  return (
    <div className="glass-panel glass-edge-gold overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <h3 className="font-mono" style={{ color: "hsl(var(--muted-foreground))", fontSize: 10, letterSpacing: "0.15em" }}>
          PORTFOLIO PERFORMANCE
        </h3>
        <button className="font-mono" style={{ color: "hsl(var(--muted-foreground))", fontSize: 10, background: "none", border: "none", cursor: "pointer" }}>
          •••
        </button>
      </div>

      {/* Table header */}
      <div className="grid grid-cols-4 px-4 py-2" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
        {["Name", "Portfolio", "Price", "Chg %"].map((h) => (
          <span key={h} className="font-mono" style={{ color: "hsl(var(--muted-foreground))", fontSize: 9, letterSpacing: "0.1em" }}>
            {h}
          </span>
        ))}
      </div>

      {/* Rows */}
      <div className="px-2">
        {topStocks.map((q) => {
          const isUp = q.direction === "up";
          const color = isUp ? "hsl(var(--bull))" : "hsl(var(--bear))";
          const domain = TICKER_TO_DOMAIN[q.ticker];
          return (
            <div key={q.ticker} className="grid grid-cols-4 items-center px-2 py-2.5" style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
              <div className="flex items-center gap-2">
                {domain ? (
                  <img
                    src={`https://img.logo.dev/${domain}?token=${LOGO_TOKEN}&size=24`}
                    alt={q.ticker}
                    loading="lazy"
                    className="w-6 h-6 rounded-full"
                  />
                ) : (
                  <div
                    className="shrink-0 flex items-center justify-center"
                    style={{ width: 24, height: 24, borderRadius: "50%", background: "hsl(var(--muted))", fontSize: 8, color: "hsl(var(--foreground))", fontWeight: 700 }}
                  >
                    {q.ticker[0]}
                  </div>
                )}
                <div>
                  <p style={{ color: "hsl(var(--foreground))", fontSize: 11, fontWeight: 600 }}>{q.ticker}</p>
                </div>
              </div>
              <div style={{ width: 48, height: 20 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={generateSparkline(q.direction)}>
                    <Line type="monotone" dataKey="v" stroke={isUp ? "#00FF88" : "#E05555"} strokeWidth={1} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <span className="font-mono" style={{ color: "hsl(var(--foreground))", fontSize: 11 }}>
                ${q.price.toFixed(2)}
              </span>
              <span className="font-mono" style={{ color: isUp ? "#00FF88" : "#E05555", fontSize: 11 }}>
                {isUp ? "+" : ""}{q.change.toFixed(2)}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PortfolioWidget;
