import LineChart from "@/components/charts/LineChart";
import type { ChartData } from "@/api/chart";

interface VisualizationCardProps {
  chartData: ChartData | null;
  chartTitle: string;
  chartTicker: string;
  onPlotTrend?: () => void;
}

const VisualizationCard = ({ chartData, chartTitle, chartTicker, onPlotTrend }: VisualizationCardProps) => {
  return (
    <div className="glass-panel glass-edge-gold overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <h3 className="font-mono" style={{ color: "hsl(var(--muted-foreground))", fontSize: 10, letterSpacing: "0.15em" }}>
          RELATED DATA VISUALIZATIONS
        </h3>
        {onPlotTrend && !chartData && (
          <button
            onClick={onPlotTrend}
            className="font-mono transition-colors"
            style={{ color: "hsl(var(--accent))", fontSize: 10, background: "none", border: "none", cursor: "pointer" }}
          >
            History ▾
          </button>
        )}
      </div>
      <div className="p-3" style={{ minHeight: 180 }}>
        {chartData ? (
          <LineChart
            data={chartData}
            title={chartTitle}
            yAxisLabel={chartTitle}
            ticker={chartTicker}
            filingDates={chartData.filingDates}
          />
        ) : (
          <div className="flex items-center justify-center h-full" style={{ minHeight: 160 }}>
            <p className="font-mono" style={{ color: "hsl(var(--muted-foreground) / 0.4)", fontSize: 11 }}>
              Submit a query to see visualizations
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default VisualizationCard;
