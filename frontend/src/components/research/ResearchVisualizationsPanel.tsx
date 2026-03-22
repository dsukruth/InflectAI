import LineChart from "@/components/charts/LineChart";
import StockCard from "@/components/charts/StockCard";
import CitationCard from "./CitationCard";
import ThesisCard from "./ThesisCard";
import RSIGauge from "@/components/charts/RSIGauge";
import PortfolioWidget from "./PortfolioWidget";
import type { AnswerResult, StockQuote, ThesisResult, ResearchMetricData } from "@/types/api";
import type { ChartData } from "@/api/chart";

interface Props {
  answerData: AnswerResult | null;
  stockQuote: StockQuote | null;
  metricData: ResearchMetricData | null;
  thesisData: ThesisResult | null;
  thesisLoading: boolean;
  chartData: ChartData | null;
  chartTitle: string;
  chartTicker: string;
  onGenerateThesis: () => void;
  onPlotTrend: () => void;
}

const SectionLabel = ({ children }: { children: string }) => (
  <p className="font-mono" style={{ color: "hsl(var(--muted-foreground))", fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 8 }}>
    {children}
  </p>
);

const ResearchVisualizationsPanel = ({
  answerData, stockQuote, metricData, thesisData, thesisLoading,
  chartData, chartTitle, chartTicker, onGenerateThesis, onPlotTrend,
}: Props) => {
  const tickerBadge = answerData?.ticker || chartTicker;

  return (
    <div className="h-full flex flex-col" style={{ background: "rgba(6,10,18,0.6)", borderLeft: "1px solid hsl(var(--border))" }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 shrink-0" style={{ height: 48, borderBottom: "1px solid hsl(var(--border))" }}>
        <span style={{ color: "hsl(var(--foreground))", fontSize: 13, fontWeight: 600 }}>Visualizations</span>
        {tickerBadge && (
          <span
            className="font-mono"
            style={{
              fontSize: 11,
              padding: "3px 10px",
              borderRadius: 10,
              background: "rgba(240,100,80,0.15)",
              color: "#F06450",
              fontWeight: 600,
            }}
          >
            {tickerBadge}
          </span>
        )}
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-5">
        {/* Answer section — always show when we have a reply (chart view hides answer if gated on !chartData) */}
        {answerData && (
          <div>
            <SectionLabel>Answer</SectionLabel>
            <div
              style={{
                background: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: 12,
                padding: 16,
              }}
            >
              <p style={{ color: "hsl(var(--muted-foreground))", fontSize: 10, letterSpacing: "0.1em", marginBottom: 6 }}>ANSWER</p>
              <p style={{ color: "hsl(var(--foreground))", fontSize: 13, lineHeight: 1.7 }}>{answerData.answer.slice(0, 300)}</p>

              {metricData && (
                <div style={{ marginTop: 12 }}>
                  <p className="font-mono" style={{ color: "hsl(var(--muted-foreground))", fontSize: 10 }}>{metricData.metric}</p>
                  <p className="font-mono" style={{ color: "hsl(var(--gold))", fontSize: 24, fontWeight: 700 }}>{metricData.value}</p>
                  {metricData.change && (
                    <span className="font-mono" style={{
                      fontSize: 11,
                      color: metricData.changeDirection === "up" ? "hsl(var(--bull))" : "hsl(var(--bear))",
                    }}>
                      {metricData.changeDirection === "up" ? "▲" : "▼"} {metricData.change}
                    </span>
                  )}
                </div>
              )}

              {/* Action chips */}
              {answerData.ticker && (
                <div className="flex gap-2 mt-3">
                  <button onClick={onGenerateThesis} className="font-mono" style={{ fontSize: 11, padding: "4px 12px", borderRadius: 12, border: "1px solid rgba(0,212,255,0.3)", background: "rgba(0,212,255,0.06)", color: "hsl(var(--cyan))", cursor: "pointer" }}>
                    Generate thesis ↗
                  </button>
                  <button onClick={onPlotTrend} className="font-mono" style={{ fontSize: 11, padding: "4px 12px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.08)", background: "transparent", color: "hsl(var(--muted-foreground))", cursor: "pointer" }}>
                    Plot trend ↗
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Trend section */}
        {chartData && chartTicker && (
          <div>
            <SectionLabel>Trend</SectionLabel>
            <LineChart data={chartData} title={chartTitle} yAxisLabel={chartTitle} ticker={chartTicker} filingDates={chartData.filingDates} />
          </div>
        )}

        {/* Market section */}
        {stockQuote && (
          <div>
            <SectionLabel>Market</SectionLabel>
            <StockCard quote={stockQuote} />
          </div>
        )}

        {/* Source section */}
        {answerData?.citation && (
          <div>
            <SectionLabel>Source</SectionLabel>
            <CitationCard citation={answerData.citation} source={answerData.source} />
          </div>
        )}

        {/* Thesis section */}
        {(thesisLoading || thesisData) && (
          <div>
            <SectionLabel>Thesis</SectionLabel>
            <ThesisCard thesis={thesisData!} isLoading={thesisLoading} />
            {thesisData?.technical?.rsi != null && (
              <div style={{ marginTop: 10 }}>
                <RSIGauge value={thesisData.technical.rsi} ticker={thesisData.ticker} />
              </div>
            )}
          </div>
        )}

        {/* Portfolio section */}
        <div>
          <SectionLabel>Portfolio</SectionLabel>
          <PortfolioWidget />
        </div>

        {/* Empty state */}
        {!answerData && !stockQuote && !chartData && !thesisData && !thesisLoading && (
          <div className="flex-1 flex items-center justify-center">
            <p className="font-mono" style={{ color: "hsl(var(--muted-foreground) / 0.4)", fontSize: 11 }}>
              Submit a query to see visualizations
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResearchVisualizationsPanel;
