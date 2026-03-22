import { useStockQuotes } from "@/hooks/useStockQuotes";

const WATCHLIST_TICKERS = ["GOOGL", "AMZN", "AMD", "PLTR", "COIN"];
const COMPANY_NAMES: Record<string, string> = {
  GOOGL: "Alphabet Inc.",
  AMZN: "Amazon.com",
  AMD: "Advanced Micro Devices",
  PLTR: "Palantir Technologies",
  COIN: "Coinbase Global",
};

interface Props {
  onTickerClick: (ticker: string) => void;
}

const Watchlist = ({ onTickerClick }: Props) => {
  const { quotes, loading } = useStockQuotes(WATCHLIST_TICKERS, 30_000);

  return (
    <div
      className="rounded-2xl relative overflow-hidden"
      style={{
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.10)",
        backdropFilter: "blur(24px)",
        padding: 20,
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08)",
      }}
    >
      {/* Purple glow */}
      <div className="absolute -bottom-12 -left-12 w-40 h-40 rounded-full pointer-events-none" style={{ background: "#7C3AED", filter: "blur(100px)", opacity: 0.08 }} />

      <div className="flex items-center justify-between mb-4 relative z-10">
        <h3 className="font-semibold" style={{ color: "hsl(var(--foreground))", fontSize: 14 }}>Watchlist</h3>
        <span className="cursor-pointer" style={{ color: "hsl(var(--cyan))", fontSize: 13 }}>+ Add</span>
      </div>

      <div className="space-y-0 relative z-10">
        {WATCHLIST_TICKERS.map((t, i) => {
          const q = quotes[t];
          const isUp = q ? q.change_percent >= 0 : true;
          return (
            <div
              key={t}
              className="flex items-center justify-between py-3 cursor-pointer transition-colors"
              style={{ borderBottom: i < WATCHLIST_TICKERS.length - 1 ? "1px solid hsl(var(--border))" : "none" }}
              onClick={() => onTickerClick(t)}
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(0,200,255,0.04)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <div>
                <span className="font-mono font-bold" style={{ color: "hsl(var(--cyan))", fontSize: 13 }}>{t}</span>
                <span className="ml-2" style={{ color: "hsl(var(--muted-foreground))", fontSize: 11 }}>{COMPANY_NAMES[t]}</span>
              </div>
              <div className="text-right">
                {loading || !q ? (
                  <span className="font-mono" style={{ color: "hsl(var(--muted-foreground))", fontSize: 13 }}>...</span>
                ) : (
                  <>
                    <span className="font-mono block" style={{ color: "white", fontSize: 13 }}>${q.price.toFixed(2)}</span>
                    <span className="font-mono font-medium" style={{ color: isUp ? "hsl(var(--bull))" : "hsl(var(--bear))", fontSize: 11 }}>
                      {isUp ? "+" : ""}{q.change_percent.toFixed(2)}%
                    </span>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Watchlist;
