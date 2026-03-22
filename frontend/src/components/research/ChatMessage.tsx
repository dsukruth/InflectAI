import type { AnswerResult, StockQuote, ThesisResult, ResearchMetricData } from "@/types/api";
import StockCard from "@/components/charts/StockCard";
import MetricCard from "@/components/charts/MetricCard";
import CitationCard from "./CitationCard";
import ThesisCard from "./ThesisCard";
import RSIGauge from "@/components/charts/RSIGauge";

export interface ChatMsg {
  id: string;
  role: "user" | "bot";
  text: string;
  answerData?: AnswerResult | null;
  stockQuote?: StockQuote | null;
  metricData?: ResearchMetricData | null;
  thesisData?: ThesisResult | null;
  thesisLoading?: boolean;
  onGenerateThesis?: () => void;
  onPlotTrend?: () => void;
}

const confBadge: Record<string, { color: string; bg: string }> = {
  HIGH: { color: "#00D68F", bg: "rgba(0,214,143,0.12)" },
  MEDIUM: { color: "#F0A500", bg: "rgba(240,165,0,0.12)" },
  LOW: { color: "#E05555", bg: "rgba(224,85,85,0.12)" },
};

const ChatMessage = ({ msg }: { msg: ChatMsg }) => {
  const isUser = msg.role === "user";

  return (
    <div
      className="flex w-full"
      style={{
        justifyContent: isUser ? "flex-end" : "flex-start",
        animation: "bubbleIn 250ms ease-out",
      }}
    >
      <div
        style={{
          maxWidth: "75%",
          padding: "12px 16px",
          borderRadius: isUser ? "12px 12px 3px 12px" : "12px 12px 12px 3px",
          background: isUser ? "#378ADD" : "hsl(var(--muted))",
          color: isUser ? "white" : "hsl(var(--foreground))",
          fontSize: 14,
          lineHeight: 1.6,
        }}
      >
        <p style={{ whiteSpace: "pre-wrap" }}>{msg.text}</p>

        {/* Inline cards for bot messages */}
        {!isUser && msg.stockQuote && (
          <div style={{ marginTop: 12 }}>
            <StockCard quote={msg.stockQuote} />
          </div>
        )}

        {!isUser && msg.metricData && (
          <div style={{ marginTop: 12 }}>
            <MetricCard
              metric={msg.metricData.metric}
              value={msg.metricData.value}
              period={msg.metricData.period}
              change={msg.metricData.change}
              changeDirection={msg.metricData.changeDirection}
              source={msg.metricData.source ?? msg.answerData?.source ?? "LLM"}
              citation={msg.metricData.citation ?? msg.answerData?.citation ?? undefined}
            />
          </div>
        )}

        {!isUser && msg.answerData?.citation && !msg.metricData && (
          <div style={{ marginTop: 10 }}>
            <CitationCard citation={msg.answerData.citation} source={msg.answerData.source} />
          </div>
        )}

        {!isUser && msg.answerData && (
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            {/* Confidence badge */}
            {msg.answerData.confidence && (
              <span
                className="font-mono"
                style={{
                  fontSize: 10,
                  padding: "3px 8px",
                  borderRadius: 10,
                  background: confBadge[msg.answerData.confidence]?.bg,
                  color: confBadge[msg.answerData.confidence]?.color,
                }}
              >
                {msg.answerData.confidence}
              </span>
            )}

            {/* Action chips */}
            {msg.answerData.ticker && msg.onGenerateThesis && (
              <button
                onClick={msg.onGenerateThesis}
                className="font-mono transition-colors"
                style={{
                  fontSize: 11,
                  padding: "3px 10px",
                  borderRadius: 10,
                  border: "1px solid rgba(0,212,255,0.3)",
                  background: "rgba(0,212,255,0.06)",
                  color: "hsl(var(--cyan))",
                  cursor: "pointer",
                }}
              >
                Generate thesis ↗
              </button>
            )}
            {msg.answerData.ticker && msg.onPlotTrend && (
              <button
                onClick={msg.onPlotTrend}
                className="font-mono transition-colors"
                style={{
                  fontSize: 11,
                  padding: "3px 10px",
                  borderRadius: 10,
                  border: "1px solid rgba(255,255,255,0.1)",
                  background: "transparent",
                  color: "hsl(var(--muted-foreground))",
                  cursor: "pointer",
                }}
              >
                Plot trend ↗
              </button>
            )}
          </div>
        )}

        {!isUser && (msg.thesisLoading || msg.thesisData) && (
          <div style={{ marginTop: 12 }}>
            <ThesisCard thesis={msg.thesisData!} isLoading={msg.thesisLoading} />
          </div>
        )}

        {!isUser && msg.thesisData?.technical?.rsi != null && (
          <div style={{ marginTop: 10 }}>
            <RSIGauge value={msg.thesisData.technical.rsi} ticker={msg.thesisData.ticker} />
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatMessage;
