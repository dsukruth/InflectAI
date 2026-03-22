import type { Query } from "@/types/api";

interface JarvisQueryLogProps {
  queries: Query[];
  activeQueryId: string | null;
  onSelect: (query: Query) => void;
  onClear?: () => void;
}

const intentBadge: Record<string, { label: string; color: string; bg: string; border: string }> = {
  research: { label: "RESEARCH", color: "#F0A500", bg: "rgba(240,165,0,0.12)", border: "rgba(240,165,0,0.3)" },
  price_check: { label: "PRICE", color: "#00C8FF", bg: "rgba(0,200,255,0.12)", border: "rgba(0,200,255,0.3)" },
  thesis: { label: "THESIS", color: "#00D68F", bg: "rgba(0,214,143,0.12)", border: "rgba(0,214,143,0.3)" },
  trade: { label: "TRADE", color: "#E05555", bg: "rgba(224,85,85,0.12)", border: "rgba(224,85,85,0.3)" },
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const JarvisQueryLog = ({ queries, activeQueryId, onSelect, onClear }: JarvisQueryLogProps) => {
  return (
    <div className="h-full flex flex-col" style={{ background: "rgba(8,12,20,0.95)" }}>
      {/* Header */}
      <div
        className="flex items-center justify-between shrink-0"
        style={{
          height: 40,
          padding: "0 16px",
          borderBottom: "1px solid rgba(240,165,0,0.1)",
          background: "rgba(240,165,0,0.03)",
        }}
      >
        <span style={{ color: "#F0A500", fontFamily: "'JetBrains Mono', monospace", fontSize: 9, letterSpacing: "0.25em" }}>
          [ QUERY LOG ]
        </span>
        <div className="flex items-center gap-3">
          {queries.length > 0 && onClear && (
            <button
              onClick={onClear}
              className="transition-colors"
              style={{ background: "none", border: "none", color: "#3D4A5C", fontFamily: "'JetBrains Mono', monospace", fontSize: 8, cursor: "pointer", letterSpacing: "0.1em" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#E05555")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#3D4A5C")}
            >
              CLEAR
            </button>
          )}
          <div
            style={{
              width: 6,
              height: 12,
              background: "#F0A500",
              animation: "blink 1s infinite",
            }}
          />
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto">
        {queries.length === 0 ? (
          <div style={{ padding: "40px 16px", textAlign: "center" }}>
            <p style={{ color: "#1E2D40", fontFamily: "'JetBrains Mono', monospace", fontSize: 11, letterSpacing: "0.2em" }}>
              AWAITING INPUT
            </p>
            <p className="jarvis-ellipsis" style={{ color: "#F0A500", fontFamily: "'JetBrains Mono', monospace", fontSize: 14, marginTop: 8 }}>
              ...
            </p>
          </div>
        ) : (
          queries.map((q, i) => {
            const isActive = q.id === activeQueryId;
            const badge = intentBadge[q.intent_type] || intentBadge.research;
            return (
              <button
                key={q.id}
                onClick={() => onSelect(q)}
                className="w-full text-left transition-all duration-150"
                style={{
                  padding: "10px 16px",
                  borderBottom: "1px solid rgba(30,45,64,0.4)",
                  cursor: "pointer",
                  display: "block",
                  background: isActive ? "rgba(240,165,0,0.08)" : "transparent",
                  borderLeft: isActive ? "2px solid #F0A500" : "2px solid transparent",
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = "rgba(240,165,0,0.04)";
                    e.currentTarget.style.borderLeft = "2px solid #F0A500";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.borderLeft = "2px solid transparent";
                  }
                }}
              >
                {/* Top row */}
                <div className="flex justify-between items-center">
                  <span style={{ color: "#F0A500", fontFamily: "'JetBrains Mono', monospace", fontSize: 9 }}>
                    Q.{String(queries.length - i).padStart(3, "0")}
                  </span>
                  <span style={{ color: "#3D4A5C", fontFamily: "'JetBrains Mono', monospace", fontSize: 9 }}>
                    {timeAgo(q.created_at)}
                  </span>
                </div>

                {/* Query text */}
                <p style={{
                  color: "white",
                  fontSize: 14,
                  margin: "4px 0",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}>
                  {q.transcript?.slice(0, 50) || "..."}
                </p>

                {/* Badge */}
                <span
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 8,
                    padding: "2px 6px",
                    borderRadius: 4,
                    background: badge.bg,
                    border: `1px solid ${badge.border}`,
                    color: badge.color,
                    letterSpacing: "0.1em",
                  }}
                >
                  {badge.label}
                </span>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};

export default JarvisQueryLog;
