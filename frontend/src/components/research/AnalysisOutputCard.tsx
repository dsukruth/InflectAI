import CitationCard from "./CitationCard";
import StockCard from "@/components/charts/StockCard";
import MetricCard from "@/components/charts/MetricCard";
import ThesisCard from "./ThesisCard";
import RSIGauge from "@/components/charts/RSIGauge";
import { EXAMPLE_QUERIES } from "@/utils/constants";
import type { AnswerResult, StockQuote, ThesisResult } from "@/types/api";

interface MetricData {
  metric: string;
  value: string;
  period: string;
  change?: string;
  changeDirection?: "up" | "down";
}

interface AnalysisOutputCardProps {
  answerData: AnswerResult | null;
  stockQuote: StockQuote | null;
  metricData: MetricData | null;
  thesisData: ThesisResult | null;
  thesisLoading: boolean;
  selectedOutput: string | null;
  onChipClick: (text: string) => void;
  onGenerateThesis: () => void;
  onPlotTrend: () => void;
}

const confStyles: Record<string, { color: string; bg: string }> = {
  HIGH: { color: "hsl(150, 100%, 50%)", bg: "rgba(0,255,136,0.08)" },
  MEDIUM: { color: "hsl(38, 100%, 47%)", bg: "rgba(240,165,0,0.08)" },
  LOW: { color: "hsl(0, 68%, 61%)", bg: "rgba(224,85,85,0.08)" },
};

const AnalysisOutputCard = ({
  answerData, stockQuote, metricData, thesisData, thesisLoading, selectedOutput,
  onChipClick, onGenerateThesis, onPlotTrend,
}: AnalysisOutputCardProps) => {
  const hasData = answerData || stockQuote || selectedOutput;

  if (!hasData) {
    return (
      <div
        className="glass-panel glass-edge-cyan flex flex-col items-center justify-center"
        style={{ minHeight: 400, padding: 40 }}
      >
        <h2 className="font-display" style={{ color: "hsl(var(--foreground))", fontSize: 22, fontWeight: 600, marginBottom: 8 }}>
          Ask anything about the markets
        </h2>
        <p className="font-mono mb-8" style={{ color: "hsl(var(--muted-foreground))", fontSize: 12 }}>
          Query SEC filings, get price data, generate trade theses
        </p>
        <div className="flex flex-col gap-2 w-full" style={{ maxWidth: 400 }}>
          {EXAMPLE_QUERIES.slice(0, 3).map((q) => (
            <button
              key={q}
              onClick={() => onChipClick(q)}
              className="text-left px-4 py-3 rounded-lg transition-all duration-200"
              style={{
                border: "1px solid rgba(255,255,255,0.06)",
                background: "rgba(12, 18, 28, 0.6)",
                color: "hsl(var(--muted-foreground))",
                fontSize: 13,
                cursor: "pointer",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "rgba(0, 212, 255, 0.3)";
                e.currentTarget.style.color = "hsl(var(--accent))";
                e.currentTarget.style.boxShadow = "0 0 12px rgba(0, 212, 255, 0.08)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)";
                e.currentTarget.style.color = "hsl(var(--muted-foreground))";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <span style={{ color: "hsl(var(--accent))", marginRight: 8 }}>›</span>
              {q}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="glass-panel glass-edge-cyan overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <h2 className="font-mono" style={{ color: "hsl(var(--muted-foreground))", fontSize: 10, letterSpacing: "0.15em" }}>
          ANALYSIS OUTPUT
        </h2>
      </div>

      {/* Content */}
      <div className="p-5 overflow-y-auto" style={{ maxHeight: "calc(100vh - 340px)" }}>
        {stockQuote && (
          <div className="mb-4">
            <StockCard quote={stockQuote} />
          </div>
        )}

        {metricData && (
          <div className="mb-4">
            <MetricCard
              metric={metricData.metric}
              value={metricData.value}
              period={metricData.period}
              change={metricData.change}
              changeDirection={metricData.changeDirection}
              source={answerData?.source || "LLM"}
              citation={answerData?.citation || undefined}
            />
          </div>
        )}

        {answerData && (
          <div className="mb-4">
            <h3 className="font-display mb-4" style={{ color: "hsl(var(--foreground))", fontSize: 20, fontWeight: 600, lineHeight: 1.3 }}>
              {answerData.ticker ? `${answerData.ticker} ` : ""}
              {answerData.intent_type === "price_check" ? "Price Check" : "Analysis"}
            </h3>

            <div className="mb-4">
              <h4 className="font-display mb-2" style={{ color: "hsl(var(--foreground))", fontSize: 14, fontWeight: 600 }}>
                Answer
              </h4>
              <p style={{ color: "hsl(var(--foreground) / 0.85)", fontSize: 14, lineHeight: 1.8, whiteSpace: "pre-wrap" }}>
                {answerData.answer}
              </p>
            </div>

            {answerData.citation && (
              <div className="mb-4">
                <CitationCard citation={answerData.citation} source={answerData.source} />
              </div>
            )}

            {/* Confidence badge */}
            <div className="flex items-center gap-3 mb-4">
              <div
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg"
                style={{
                  background: confStyles[answerData.confidence]?.bg || "hsl(var(--muted))",
                  border: `1px solid ${confStyles[answerData.confidence]?.color || "hsl(var(--border))"}40`,
                  boxShadow: `0 0 12px ${confStyles[answerData.confidence]?.color || "transparent"}15`,
                }}
              >
                <span className="font-mono" style={{ color: "hsl(var(--muted-foreground))", fontSize: 10 }}>
                  Confidence Level:
                </span>
                <span className="font-mono" style={{ color: confStyles[answerData.confidence]?.color, fontSize: 16, fontWeight: 700 }}>
                  {answerData.confidence}
                </span>
              </div>
            </div>

            {/* Action buttons */}
            {answerData.ticker && (
              <div className="flex gap-2">
                <button
                  onClick={onGenerateThesis}
                  className="px-4 py-2 rounded-lg font-mono transition-all duration-200"
                  style={{
                    border: "1px solid rgba(0, 212, 255, 0.3)",
                    background: "rgba(0, 212, 255, 0.06)",
                    color: "hsl(var(--accent))",
                    fontSize: 12,
                    cursor: "pointer",
                  }}
                >
                  Generate Thesis →
                </button>
                <button
                  onClick={onPlotTrend}
                  className="px-4 py-2 rounded-lg font-mono transition-all duration-200"
                  style={{
                    border: "1px solid rgba(255,255,255,0.08)",
                    background: "transparent",
                    color: "hsl(var(--muted-foreground))",
                    fontSize: 12,
                    cursor: "pointer",
                  }}
                >
                  Plot Trend →
                </button>
              </div>
            )}
          </div>
        )}

        {selectedOutput && !answerData && (
          <p style={{ color: "hsl(var(--foreground))", fontSize: 14, lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
            {selectedOutput}
          </p>
        )}

        {(thesisLoading || thesisData) && (
          <div className="mt-4">
            <ThesisCard thesis={thesisData!} isLoading={thesisLoading} />
          </div>
        )}

        {thesisData?.technical?.rsi != null && (
          <div className="mt-4">
            <RSIGauge value={thesisData.technical.rsi} ticker={thesisData.ticker} />
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalysisOutputCard;
