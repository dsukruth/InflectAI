import { LineChart, Line, ResponsiveContainer } from "recharts";
import type { StockQuote } from "@/types/api";

interface StockCardProps {
  quote: StockQuote;
  isLoading?: boolean;
}

// Generate mock sparkline data
const generateSparkline = (direction: "up" | "down") => {
  const base = 100;
  return Array.from({ length: 20 }, (_, i) => ({
    v: base + (direction === "up" ? 1 : -1) * Math.sin(i * 0.5) * 3 + (direction === "up" ? i * 0.4 : -i * 0.4) + Math.random() * 2,
  }));
};

const formatVolume = (vol: number) => {
  if (vol >= 1_000_000) return (vol / 1_000_000).toFixed(1) + "M";
  if (vol >= 1_000) return (vol / 1_000).toFixed(1) + "K";
  return vol.toString();
};

const isMarketOpen = () => {
  const now = new Date();
  const day = now.getDay();
  if (day === 0 || day === 6) return false;
  const hours = now.getHours() + now.getMinutes() / 60;
  return hours >= 9.5 && hours < 16;
};

const StockCard = ({ quote, isLoading }: StockCardProps) => {
  if (isLoading) {
    return (
      <div
        style={{
          background: "#0F1820",
          border: "1px solid #1E2D40",
          borderRadius: 12,
          padding: "16px 20px",
          height: 100,
          animation: "shimmer 1.5s infinite",
        }}
      />
    );
  }

  const isUp = quote.direction === "up";
  const color = isUp ? "#00D68F" : "#E05555";
  const sparkData =
    quote.sparkline && quote.sparkline.length > 0 ? quote.sparkline : generateSparkline(quote.direction);
  const open = isMarketOpen();

  return (
    <div
      className="inflect-card"
      style={{
        background: "#0F1820",
        border: "1px solid #1E2D40",
        borderRadius: 12,
        padding: "16px 20px",
        animation: "stockCardIn 250ms ease-out",
      }}
    >
      <div className="flex justify-between items-start">
        {/* Left */}
        <div>
          <p className="font-mono" style={{ color: "#8892A4", fontSize: 12, letterSpacing: "0.1em", marginBottom: 4 }}>
            {quote.ticker}
          </p>
          <p className="font-mono" style={{ color: "white", fontSize: 28, fontWeight: 700, lineHeight: 1 }}>
            ${quote.price.toFixed(2)}
          </p>
          <span
            className="font-mono inline-block"
            style={{
              marginTop: 8,
              borderRadius: 12,
              padding: "4px 10px",
              fontSize: 12,
              fontWeight: 600,
              background: isUp ? "rgba(0,214,143,0.15)" : "rgba(224,85,85,0.15)",
              color,
            }}
          >
            {isUp ? "▲" : "▼"} {isUp ? "+" : ""}
            {quote.change_percent.toFixed(2)}%
          </span>
          <p className="font-mono" style={{ color: "#8892A4", fontSize: 11, marginTop: 6 }}>
            Vol: {formatVolume(quote.volume)}
          </p>
        </div>

        {/* Right */}
        <div className="flex flex-col items-end">
          <div style={{ width: 80, height: 32 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sparkData}>
                <Line type="monotone" dataKey="v" stroke={color} strokeWidth={1.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p className="font-mono" style={{ color: open ? "#8892A4" : "#F0A500", fontSize: 10, marginTop: 4, textAlign: "right" }}>
            {open ? "Live · 15s" : "Closed"}
          </p>
        </div>
      </div>
    </div>
  );
};

export default StockCard;
