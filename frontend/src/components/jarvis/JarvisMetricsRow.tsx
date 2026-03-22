interface JarvisMetricsRowProps {
  queryCount: number;
  activeTicker: string | null;
  confidence: "HIGH" | "MEDIUM" | "LOW" | null;
  latencyMs: number | null;
}

const confColor = (c: string | null) => {
  if (c === "HIGH") return "#00D68F";
  if (c === "MEDIUM") return "#F0A500";
  if (c === "LOW") return "#E05555";
  return "#3D4A5C";
};

const JarvisMetricsRow = ({ queryCount, activeTicker, confidence, latencyMs }: JarvisMetricsRowProps) => {
  const metrics = [
    { label: "QUERIES", value: String(queryCount), color: "#F0A500" },
    { label: "TRACKING", value: activeTicker || "—", color: activeTicker ? "#FFFFFF" : "#3D4A5C" },
    { label: "CONFIDENCE", value: confidence || "—", color: confColor(confidence) },
    { label: "LATENCY", value: latencyMs != null ? `${latencyMs}ms` : "—ms", color: "#8892A4" },
  ];

  return (
    <div className="flex items-center" style={{ height: 48, background: "rgba(8,12,20,0.9)" }}>
      {metrics.map((m, i) => (
        <div
          key={m.label}
          className="flex-1 flex flex-col justify-center"
          style={{
            padding: "0 16px",
            borderRight: i < metrics.length - 1 ? "1px solid rgba(240,165,0,0.06)" : "none",
          }}
        >
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 8, color: "#3D4A5C", letterSpacing: "0.15em" }}>
            {m.label}
          </span>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 700, color: m.color }}>
            {m.value}
          </span>
        </div>
      ))}
    </div>
  );
};

export default JarvisMetricsRow;
