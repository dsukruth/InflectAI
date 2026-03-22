import CitationCard from "@/components/research/CitationCard";

interface MetricCardProps {
  metric: string;
  value: string;
  period: string;
  change?: string;
  changeDirection?: "up" | "down";
  source: string;
  citation?: string;
}

const sourceBadges: Record<string, { emoji: string; label: string; color: string; bg: string; border: string }> = {
  SEC_FILING: { emoji: "📎", label: "SEC Filing", color: "#00D68F", bg: "rgba(0,214,143,0.08)", border: "rgba(0,214,143,0.3)" },
  WOLFRAM: { emoji: "⚡", label: "Wolfram|Alpha", color: "#F0A500", bg: "rgba(240,165,0,0.08)", border: "rgba(240,165,0,0.3)" },
  MARKET_DATA: { emoji: "📊", label: "Market Data", color: "#00C8FF", bg: "rgba(0,200,255,0.08)", border: "rgba(0,200,255,0.3)" },
  LLM: { emoji: "🤖", label: "AI Generated", color: "#8892A4", bg: "rgba(136,146,164,0.08)", border: "rgba(136,146,164,0.3)" },
  SNOWFLAKE: { emoji: "❄️", label: "Snowflake", color: "#29B5E8", bg: "rgba(41,181,232,0.08)", border: "rgba(41,181,232,0.3)" },
  YFINANCE: { emoji: "📈", label: "Yahoo Finance", color: "#7B61FF", bg: "rgba(123,97,255,0.08)", border: "rgba(123,97,255,0.3)" },
  UNAVAILABLE: { emoji: "—", label: "No data", color: "#8892A4", bg: "rgba(136,146,164,0.06)", border: "rgba(136,146,164,0.2)" },
};

const MetricCard = ({ metric, value, period, change, changeDirection, source, citation }: MetricCardProps) => {
  const badge = sourceBadges[source] ?? sourceBadges.LLM;
  const isUp = changeDirection === "up";

  return (
    <div
      style={{
        background: "#0F1820",
        border: "1px solid #1E2D40",
        borderTop: "2px solid #F0A500",
        borderRadius: 12,
        padding: 20,
        animation: "metricCardIn 300ms ease-out",
      }}
    >
      {/* Metric label */}
      <p style={{ color: "#8892A4", fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 8 }}>
        {metric}
      </p>

      {/* Large value */}
      <p className="font-mono" style={{ color: "#F0A500", fontSize: 36, fontWeight: 700, lineHeight: 1 }}>
        {value}
      </p>

      {/* Period */}
      <p style={{ color: "#8892A4", fontSize: 12, marginTop: 4 }}>{period}</p>

      {/* YoY change */}
      {change && (
        <span
          className="font-mono inline-block"
          style={{
            marginTop: 12,
            borderRadius: 12,
            padding: "4px 10px",
            fontSize: 12,
            fontWeight: 600,
            background: isUp ? "rgba(0,214,143,0.15)" : "rgba(224,85,85,0.15)",
            color: isUp ? "#00D68F" : "#E05555",
          }}
        >
          {isUp ? "▲" : "▼"} {change}
        </span>
      )}

      {/* Source badge */}
      {badge && (
        <div style={{ marginTop: 12 }}>
          <span
            className="font-mono"
            style={{
              background: badge.bg,
              border: `1px solid ${badge.border}`,
              color: badge.color,
              borderRadius: 12,
              padding: "4px 10px",
              fontSize: 11,
              display: "inline-block",
            }}
          >
            {badge.emoji} {badge.label}
          </span>
        </div>
      )}

      {/* Citation */}
      {citation && (
        <div style={{ marginTop: 10 }}>
          <CitationCard citation={citation} source={source} />
        </div>
      )}
    </div>
  );
};

export default MetricCard;
