import type { ThesisResult } from "@/types/api";

interface ThesisCardProps {
  thesis: ThesisResult;
  isLoading?: boolean;
}

const signalStyle = (signal: string) => {
  if (signal === "BULLISH" || signal === "POSITIVE")
    return { bg: "rgba(0,214,143,0.15)", border: "rgba(0,214,143,0.3)", color: "#00D68F" };
  if (signal === "BEARISH" || signal === "NEGATIVE")
    return { bg: "rgba(224,85,85,0.15)", border: "rgba(224,85,85,0.3)", color: "#E05555" };
  return { bg: "rgba(136,146,164,0.15)", border: "rgba(136,146,164,0.3)", color: "#8892A4" };
};

const confStyle = (c: string) => {
  if (c === "HIGH") return { color: "#00D68F" };
  if (c === "MEDIUM") return { color: "#F0A500" };
  return { color: "#E05555" };
};

const verdictConfig: Record<string, { icon: string; color: string; bg: string; border: string }> = {
  HOLD:  { icon: "✓",  color: "#00D68F", bg: "rgba(0,214,143,0.08)",  border: "rgba(0,214,143,0.3)" },
  WATCH: { icon: "👁", color: "#F0A500", bg: "rgba(240,165,0,0.08)",  border: "rgba(240,165,0,0.3)" },
  AVOID: { icon: "⚠",  color: "#E05555", bg: "rgba(224,85,85,0.08)", border: "rgba(224,85,85,0.3)" },
};

const pos52wLabel: Record<string, { label: string; color: string }> = {
  NEAR_HIGH: { label: "Near 52W High", color: "#E05555" },
  MID_RANGE: { label: "Mid Range",     color: "#F0A500" },
  NEAR_LOW:  { label: "Near 52W Low",  color: "#00D68F" },
};

const consensusColor = (c: string) =>
  c === "BUY" ? "#00D68F" : c === "SELL" ? "#E05555" : "#F0A500";

const ThesisCard = ({ thesis, isLoading }: ThesisCardProps) => {
  if (isLoading) {
    return (
      <div style={{ background: "#0F1820", border: "1px solid #1E2D40", borderRadius: 12, overflow: "hidden" }}>
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            style={{
              height: 60,
              background: "linear-gradient(90deg, #1E2D40 25%, #253548 50%, #1E2D40 75%)",
              backgroundSize: "200% 100%",
              animation: "shimmer 1.5s infinite",
              margin: i < 3 ? "0 0 8px" : 0,
            }}
          />
        ))}
      </div>
    );
  }

  const conf = confStyle(thesis.confidence);
  const verdict = verdictConfig[thesis.verdict] || verdictConfig.WATCH;
  const analyst = thesis.analyst;
  const analTotal = analyst?.total || 0;

  const signals = [
    {
      icon: "📊",
      label: "Fundamental",
      signal: thesis.fundamental?.signal,
      reason: thesis.fundamental?.reason,
      citation: thesis.fundamental?.citation,
    },
    {
      icon: "📈",
      label: "Technical",
      signal: thesis.technical?.signal,
      reason: thesis.technical?.reason,
      citation: thesis.technical?.rsi != null
        ? `RSI: ${thesis.technical.rsi}${thesis.technical.week_52_position ? ` · ${pos52wLabel[thesis.technical.week_52_position]?.label || thesis.technical.week_52_position}` : ""}`
        : undefined,
    },
    {
      icon: "📰",
      label: "News Sentiment",
      signal: thesis.sentiment?.signal,
      reason: thesis.sentiment?.reason,
      citation: thesis.sentiment?.score != null
        ? `Sentiment score: ${thesis.sentiment.score.toFixed(2)}`
        : undefined,
      extra: thesis.sentiment?.headlines?.length
        ? thesis.sentiment.headlines.slice(0, 2)
        : undefined,
    },
    ...(analyst ? [{
      icon: "🏦",
      label: "Analyst Consensus",
      signal: analyst.signal,
      reason: analyst.reason,
      citation: analyst.consensus
        ? `Consensus: ${analyst.consensus}${analTotal ? ` (${analTotal} analysts)` : ""}`
        : undefined,
    }] : []),
  ];

  return (
    <div
      className="inflect-card"
      style={{
        background: "#0F1820",
        border: "1px solid #1E2D40",
        borderRadius: 12,
        overflow: "hidden",
        animation: "bubbleIn 300ms ease-out",
      }}
    >
      {/* Header */}
      <div
        className="flex justify-between items-center"
        style={{ padding: "16px 20px", borderBottom: "1px solid #1E2D40" }}
      >
        <div>
          <p className="font-mono" style={{ color: "#F0A500", fontSize: 16, fontWeight: 700 }}>
            {thesis.ticker}
          </p>
          <p style={{ color: "white", fontSize: 12, marginTop: 2 }}>4-Signal Trade Thesis</p>
        </div>
        <span
          className="font-mono"
          style={{
            fontSize: 11,
            color: conf.color,
            background: `${conf.color}22`,
            border: `1px solid ${conf.color}44`,
            borderRadius: 12,
            padding: "4px 10px",
          }}
        >
          ● {thesis.confidence} CONFIDENCE
        </span>
      </div>

      {/* Signal rows */}
      {signals.map((row, i) => {
        const sig = row.signal || "NEUTRAL";
        const s = signalStyle(sig);
        const isEmpty = !row.reason;
        return (
          <div
            key={row.label}
            style={{
              padding: "14px 20px",
              gap: 16,
              borderBottom: "1px solid rgba(30,45,64,0.6)",
              animation: `thesisRowIn 300ms ease-out ${i * 50}ms both`,
            }}
          >
            <div className="flex justify-between items-start gap-4">
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ color: "#8892A4", fontSize: 12 }}>{row.icon} {row.label}</p>
                <p style={{ color: "white", fontSize: 13, lineHeight: 1.5, marginTop: 4 }}>
                  {isEmpty ? "Not enough data available" : row.reason}
                </p>
                {row.citation && !isEmpty && (
                  <span
                    className="font-mono inline-block"
                    style={{
                      marginTop: 6,
                      background: "rgba(0,214,143,0.08)",
                      border: "1px solid rgba(0,214,143,0.3)",
                      color: "#00D68F",
                      borderRadius: 8,
                      padding: "2px 8px",
                      fontSize: 10,
                    }}
                  >
                    📎 {row.citation}
                  </span>
                )}
                {row.extra?.map((h, hi) => (
                  <p key={hi} style={{ color: "#6B7A8D", fontSize: 11, marginTop: 4, lineHeight: 1.4 }}>
                    → {h}
                  </p>
                ))}
              </div>
              <span
                className="font-mono shrink-0"
                style={{
                  fontSize: 11,
                  background: isEmpty ? "rgba(136,146,164,0.15)" : s.bg,
                  border: `1px solid ${isEmpty ? "rgba(136,146,164,0.3)" : s.border}`,
                  color: isEmpty ? "#8892A4" : s.color,
                  borderRadius: 8,
                  padding: "4px 10px",
                }}
              >
                {isEmpty ? "NO DATA" : sig}
              </span>
            </div>
          </div>
        );
      })}

      {/* Analyst Recommendation Bar */}
      {analyst && analTotal > 0 && (
        <div style={{ padding: "12px 20px", borderBottom: "1px solid rgba(30,45,64,0.6)" }}>
          <p style={{ color: "#8892A4", fontSize: 11, marginBottom: 8 }}>🏦 Analyst Breakdown</p>
          <div className="flex gap-1" style={{ height: 8, borderRadius: 4, overflow: "hidden" }}>
            {[
              { count: analyst.strong_buy || 0, color: "#00D68F" },
              { count: analyst.buy || 0,        color: "#4CAF50" },
              { count: analyst.hold || 0,       color: "#F0A500" },
              { count: analyst.sell || 0,       color: "#FF7043" },
              { count: analyst.strong_sell || 0,color: "#E05555" },
            ].map((seg, i) => {
              const pct = (seg.count / analTotal) * 100;
              if (pct === 0) return null;
              return (
                <div
                  key={i}
                  style={{ width: `${pct}%`, background: seg.color, borderRadius: 2 }}
                  title={`${seg.count}`}
                />
              );
            })}
          </div>
          <div className="flex justify-between" style={{ marginTop: 6 }}>
            <div className="flex gap-3">
              {[
                { label: "Strong Buy", count: analyst.strong_buy || 0, color: "#00D68F" },
                { label: "Buy",        count: analyst.buy || 0,        color: "#4CAF50" },
                { label: "Hold",       count: analyst.hold || 0,       color: "#F0A500" },
                { label: "Sell",       count: analyst.sell || 0,       color: "#FF7043" },
                { label: "Str. Sell",  count: analyst.strong_sell || 0,color: "#E05555" },
              ].filter(s => s.count > 0).map((seg, i) => (
                <span key={i} className="font-mono" style={{ fontSize: 10, color: seg.color }}>
                  {seg.label}: {seg.count}
                </span>
              ))}
            </div>
            <span
              className="font-mono"
              style={{ fontSize: 11, fontWeight: 700, color: consensusColor(analyst.consensus) }}
            >
              {analyst.consensus}
            </span>
          </div>
        </div>
      )}

      {/* Key Risks & Catalysts */}
      {(thesis.key_risks?.length || thesis.key_catalysts?.length) && (
        <div
          className="flex gap-0"
          style={{ borderBottom: "1px solid rgba(30,45,64,0.6)" }}
        >
          {thesis.key_risks?.length ? (
            <div style={{ flex: 1, padding: "12px 20px", borderRight: "1px solid rgba(30,45,64,0.6)" }}>
              <p style={{ color: "#E05555", fontSize: 11, marginBottom: 6 }}>⚠ Key Risks</p>
              {thesis.key_risks.slice(0, 3).map((r, i) => (
                <p key={i} style={{ color: "#8892A4", fontSize: 11, lineHeight: 1.5, marginBottom: 2 }}>
                  • {r}
                </p>
              ))}
            </div>
          ) : null}
          {thesis.key_catalysts?.length ? (
            <div style={{ flex: 1, padding: "12px 20px" }}>
              <p style={{ color: "#00D68F", fontSize: 11, marginBottom: 6 }}>⚡ Key Catalysts</p>
              {thesis.key_catalysts.slice(0, 3).map((c, i) => (
                <p key={i} style={{ color: "#8892A4", fontSize: 11, lineHeight: 1.5, marginBottom: 2 }}>
                  • {c}
                </p>
              ))}
            </div>
          ) : null}
        </div>
      )}

      {/* Verdict */}
      <div
        className="flex items-center gap-3"
        style={{
          padding: "16px 20px",
          background: verdict.bg,
          borderTop: `1px solid ${verdict.border}`,
          animation: "thesisRowIn 300ms ease-out 200ms both",
        }}
      >
        <span style={{ fontSize: 18 }}>{verdict.icon}</span>
        <div>
          <span style={{ color: verdict.color, fontSize: 18, fontWeight: 700 }}>{thesis.verdict}</span>
          <span style={{ color: "#8892A4", fontSize: 12, marginLeft: 10 }}>
            {thesis.verdict === "HOLD" ? "Favorable risk/reward" :
             thesis.verdict === "WATCH" ? "Monitor for entry points" :
             "Unfavorable conditions"}
          </span>
        </div>
      </div>

      {/* Disclaimer */}
      <div
        style={{
          padding: "10px 20px",
          background: "rgba(8,12,20,0.5)",
          textAlign: "center",
          color: "#8892A4",
          fontSize: 10,
        }}
      >
        ⚠️ Educational only. Not investment advice.
      </div>
    </div>
  );
};

export default ThesisCard;
