import { useTicker } from "@/hooks/useTicker";
import { LineChart, Line, ResponsiveContainer } from "recharts";

const LOGO_TOKEN = "pk_AH1Nlal1QY6dlBilaz85Bg";

const TICKER_TO_DOMAIN: Record<string, string> = {
  AAPL: "apple.com", MSFT: "microsoft.com", NVDA: "nvidia.com", AMZN: "amazon.com",
  GOOGL: "google.com", META: "meta.com", TSLA: "tesla.com", JPM: "jpmorgan.com",
  V: "visa.com", UNH: "unitedhealthgroup.com", XOM: "exxonmobil.com", JNJ: "jnj.com",
  WMT: "walmart.com", AMD: "amd.com", NFLX: "netflix.com", INTC: "intel.com",
  AVGO: "broadcom.com", CRM: "salesforce.com", QCOM: "qualcomm.com", GS: "goldmansachs.com",
  DIS: "disney.com", ADBE: "adobe.com", PYPL: "paypal.com", ABNB: "airbnb.com",
  UBER: "uber.com", COIN: "coinbase.com", ORCL: "oracle.com", SPOT: "spotify.com",
  BA: "boeing.com", CAT: "caterpillar.com", KO: "coca-cola.com", PEP: "pepsico.com",
};

const generateSparkline = (dir: "up" | "down") =>
  Array.from({ length: 12 }, (_, i) => ({
    v: 100 + (dir === "up" ? 1 : -1) * Math.sin(i * 0.6) * 2 + (dir === "up" ? i * 0.3 : -i * 0.3) + Math.random(),
  }));

const MarketDataWidget = () => {
  const { quotes } = useTicker();
  const display = quotes.slice(0, 4);

  return (
    <div className="glass-panel glass-edge-purple p-4">
      <h3 className="font-mono mb-3" style={{ color: "hsl(var(--muted-foreground))", fontSize: 10, letterSpacing: "0.15em" }}>
        MARKET DATA
      </h3>
      <div className="flex flex-col gap-2.5">
        {display.map((q) => {
          const isUp = q.direction === "up";
          const color = isUp ? "#00FF88" : "#E05555";
          const domain = TICKER_TO_DOMAIN[q.ticker];

          return (
            <div key={q.ticker} className="flex items-center gap-3">
              <div className="shrink-0">
                {domain ? (
                  <img
                    src={`https://img.logo.dev/${domain}?token=${LOGO_TOKEN}&size=28`}
                    alt={q.ticker}
                    loading="lazy"
                    className="w-7 h-7 rounded-full ring-1 ring-white/10"
                  />
                ) : (
                  <div
                    className="flex items-center justify-center w-7 h-7 rounded-full"
                    style={{ background: "hsl(var(--muted))", color: "hsl(var(--accent))", fontSize: 9, fontWeight: 700 }}
                  >
                    {q.ticker.slice(0, 2)}
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline">
                  <span className="font-mono truncate" style={{ color: "hsl(var(--foreground))", fontSize: 12, fontWeight: 600 }}>
                    {q.ticker}
                  </span>
                  <span className="font-mono" style={{ color: "hsl(var(--foreground))", fontSize: 12, fontWeight: 600 }}>
                    ${q.price.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <div style={{ width: 40, height: 16 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={generateSparkline(q.direction)}>
                        <Line type="monotone" dataKey="v" stroke={color} strokeWidth={1} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <span className="font-mono" style={{ color, fontSize: 10 }}>
                    {isUp ? "+" : ""}{q.change.toFixed(2)}%
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MarketDataWidget;
