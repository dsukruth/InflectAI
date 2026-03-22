import { useNavigate } from "react-router-dom";
import { useTicker, type MarketStatus } from "@/hooks/useTicker";
import { useSessionStore } from "@/store/sessionStore";
import "./TickerBar.css";

const TickerBar = () => {
  const { quotes, flashedTickers, marketStatus } = useTicker();
  const navigate = useNavigate();
  const setTicker = useSessionStore((s) => s.setTicker);

  const handleClick = (ticker: string) => {
    setTicker(ticker);
    navigate("/app/research");
  };

  const items = quotes.map((q) => (
    <div
      key={q.ticker}
      className="ticker-item"
      onClick={() => handleClick(q.ticker)}
    >
      <span className="ticker-symbol">{q.ticker}</span>
      <span className={`ticker-price ${flashedTickers.has(q.ticker) ? "ticker-flash" : ""}`}>
        ${q.price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </span>
      <span
        className="ticker-pill"
        data-direction={q.direction}
      >
        {q.direction === "up" ? "▲" : "▼"} {q.change >= 0 ? "+" : ""}
        {Math.abs(q.change).toFixed(2)}%
      </span>
      <span className="ticker-sep" />
    </div>
  ));

  return (
    <div className="ticker-wrapper">
      {/* Fade edges */}
      <div className="ticker-fade-left" />
      <div className="ticker-fade-right" />

      {/* Scrolling content – duplicated for seamless loop */}
      <div className="ticker-inner">
        {items}
        {items}
      </div>

      {/* Market status */}
      <MarketStatusBadge status={marketStatus} />

      {/* Gold shimmer line */}
      <div className="ticker-shimmer" />
    </div>
  );
};

const STATUS_CONFIG: Record<MarketStatus, { color: string; label: string; pulse: boolean }> = {
  live: { color: "#00D68F", label: "LIVE", pulse: true },
  premarket: { color: "#F0A500", label: "PRE-MKT", pulse: true },
  afterhours: { color: "#F0A500", label: "AFTER-HRS", pulse: true },
  closed: { color: "#3D4A5C", label: "CLOSED", pulse: false },
};

const MarketStatusBadge = ({ status }: { status: MarketStatus }) => {
  const cfg = STATUS_CONFIG[status];
  return (
    <div className="ticker-status">
      <span
        className={`ticker-dot ${cfg.pulse ? (status === "live" ? "ticker-dot-live" : "ticker-dot-amber") : ""}`}
        style={{ background: cfg.color }}
      />
      <span className="ticker-status-text" style={{ color: cfg.color }}>
        {cfg.label}
      </span>
    </div>
  );
};

export default TickerBar;
