import { useEffect, useRef } from "react";
import { EXAMPLE_QUERIES } from "@/utils/constants";
import AnswerCard from "@/components/research/AnswerCard";
import StockCard from "@/components/charts/StockCard";
import MetricCard from "@/components/charts/MetricCard";
import ThesisCard from "@/components/research/ThesisCard";
import LineChart from "@/components/charts/LineChart";
import RSIGauge from "@/components/charts/RSIGauge";
import type { AnswerResult, StockQuote, ThesisResult } from "@/types/api";
import type { ChartData } from "@/api/chart";

interface MetricData {
  metric: string;
  value: string;
  period: string;
  change?: string;
  changeDirection?: "up" | "down";
}

interface JarvisOutputPanelProps {
  content: string | null;
  answerData?: AnswerResult | null;
  stockQuote?: StockQuote | null;
  metricData?: MetricData | null;
  thesisData?: ThesisResult | null;
  thesisLoading?: boolean;
  chartData?: ChartData | null;
  chartTitle?: string;
  chartTicker?: string;
  onChipClick: (text: string) => void;
  onGenerateThesis?: () => void;
  onPlotTrend?: () => void;
}

const HudCorner = ({ position }: { position: "tl" | "tr" | "bl" | "br" }) => {
  const style: React.CSSProperties = {
    position: "absolute",
    width: 20,
    height: 20,
    borderColor: "rgba(240,165,0,0.4)",
    borderWidth: 0,
    ...(position === "tl" && { top: 12, left: 12, borderTopWidth: 1.5, borderLeftWidth: 1.5, borderTopStyle: "solid", borderLeftStyle: "solid" }),
    ...(position === "tr" && { top: 12, right: 12, borderTopWidth: 1.5, borderRightWidth: 1.5, borderTopStyle: "solid", borderRightStyle: "solid" }),
    ...(position === "bl" && { bottom: 12, left: 12, borderBottomWidth: 1.5, borderLeftWidth: 1.5, borderBottomStyle: "solid", borderLeftStyle: "solid" }),
    ...(position === "br" && { bottom: 12, right: 12, borderBottomWidth: 1.5, borderRightWidth: 1.5, borderBottomStyle: "solid", borderRightStyle: "solid" }),
  };
  return <div style={style} />;
};

const ScanLine = () => {
  return (
    <div
      className="absolute left-0 right-0 pointer-events-none"
      style={{
        height: 1,
        background: "rgba(240,165,0,0.06)",
        animation: "scanLine 3s linear infinite",
      }}
    />
  );
};

const JarvisOutputPanel = ({
  content, answerData, stockQuote, metricData, thesisData, thesisLoading, chartData, chartTitle, chartTicker,
  onChipClick, onGenerateThesis, onPlotTrend,
}: JarvisOutputPanelProps) => {
  const hasData = answerData || stockQuote || metricData || thesisData || thesisLoading || chartData;

  return (
    <div className="h-full flex flex-col" style={{ background: "rgba(8,12,20,0.95)" }}>
      {/* Header */}
      <div
        className="flex items-center shrink-0"
        style={{
          height: 40,
          padding: "0 16px",
          borderBottom: "1px solid rgba(240,165,0,0.1)",
          background: "rgba(240,165,0,0.03)",
        }}
      >
        <span style={{ color: "#F0A500", fontFamily: "'JetBrains Mono', monospace", fontSize: 9, letterSpacing: "0.25em" }}>
          [ ANALYSIS OUTPUT ]
        </span>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto relative" style={{ padding: 16 }}>
        {hasData ? (
          <div className="flex flex-col gap-4">
            {stockQuote && <StockCard quote={stockQuote} />}
            {metricData && (
              <MetricCard
                metric={metricData.metric} value={metricData.value} period={metricData.period}
                change={metricData.change} changeDirection={metricData.changeDirection}
                source={answerData?.source || "LLM"} citation={answerData?.citation || undefined}
              />
            )}
            {chartData && chartTicker && (
              <LineChart data={chartData} title={chartTitle || "Trend"} yAxisLabel={chartTitle || "Value"} ticker={chartTicker} filingDates={chartData.filingDates} />
            )}
            {answerData && !chartData && (
              <AnswerCard
                key={answerData.answer}
                answer={answerData.answer} source={answerData.source} citation={answerData.citation}
                confidence={answerData.confidence} ticker={answerData.ticker}
                onGenerateThesis={onGenerateThesis || (() => {})} onPlotTrend={onPlotTrend || (() => {})}
              />
            )}
            {(thesisLoading || thesisData) && <ThesisCard thesis={thesisData!} isLoading={thesisLoading} />}
            {thesisData?.technical?.rsi != null && <RSIGauge value={thesisData.technical.rsi} ticker={thesisData.ticker} />}
          </div>
        ) : content ? (
          <p style={{ color: "#FFFFFF", fontSize: 14, lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{content}</p>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center relative" style={{ minHeight: 300 }}>
            <HudCorner position="tl" />
            <HudCorner position="tr" />
            <HudCorner position="bl" />
            <HudCorner position="br" />
            <ScanLine />

            <p style={{
              color: "#1E2D40",
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 11,
              letterSpacing: "0.15em",
              marginBottom: 32,
            }}>
              AWAITING QUERY...
            </p>

            <div className="flex flex-col gap-2 w-full" style={{ maxWidth: 360 }}>
              {EXAMPLE_QUERIES.slice(0, 3).map((q) => (
                <button
                  key={q}
                  onClick={() => onChipClick(q)}
                  className="flex items-center gap-2 text-left transition-all duration-150 w-full"
                  style={{
                    border: "1px solid rgba(240,165,0,0.15)",
                    background: "rgba(240,165,0,0.03)",
                    borderRadius: 4,
                    padding: "8px 12px",
                    color: "#5A6478",
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 12,
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "rgba(240,165,0,0.4)";
                    e.currentTarget.style.background = "rgba(240,165,0,0.06)";
                    e.currentTarget.style.color = "#F0A500";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "rgba(240,165,0,0.15)";
                    e.currentTarget.style.background = "rgba(240,165,0,0.03)";
                    e.currentTarget.style.color = "#5A6478";
                  }}
                >
                  <span style={{ color: "#F0A500", fontSize: 14 }}>›</span>
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default JarvisOutputPanel;
