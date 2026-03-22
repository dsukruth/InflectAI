import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import type { ChartData } from "@/api/chart";
import { formatCurrency } from "@/utils/formatters";

interface InlineTrendChartProps {
  data: ChartData;
  ticker: string;
  title?: string;
}

const shortDate = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
};

const formatY = (v: number) => {
  if (v >= 1_000_000_000) return `$${(v / 1_000_000_000).toFixed(1)}B`;
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(1)}k`;
  return `$${v.toFixed(2)}`;
};

interface TooltipPayload {
  value: number;
}

const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string;
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="rounded-lg"
      style={{
        background: "#0A1218",
        border: "1px solid rgba(255,255,255,0.08)",
        padding: "7px 12px",
        fontSize: 11,
      }}
    >
      <p style={{ color: "hsl(var(--muted-foreground))", marginBottom: 2 }}>{label}</p>
      <p className="font-mono font-bold" style={{ color: "hsl(var(--cyan))" }}>
        {formatCurrency(payload[0].value)}
      </p>
    </div>
  );
};

const InlineTrendChart = ({ data, ticker, title }: InlineTrendChartProps) => {
  const points = data.x.map((date, i) => ({ date: shortDate(date), value: data.y[i], rawDate: date }));

  if (points.length === 0) {
    return (
      <div style={{ padding: "12px 0", color: "hsl(var(--muted-foreground))", fontSize: 12 }}>
        No chart data available.
      </div>
    );
  }

  const first = points[0].value;
  const last = points[points.length - 1].value;
  const pnl = last - first;
  const pct = ((pnl / first) * 100).toFixed(2);
  const isUp = pnl >= 0;
  const lineColor = isUp ? "hsl(var(--bull))" : "hsl(var(--bear))";
  const gradColor = isUp ? "hsl(142,71%,45%)" : "hsl(0,70%,55%)";
  const gradId = `inline-grad-${ticker}`;

  // Mark filing dates
  const filingSet = new Set(
    (data.filingDates ?? []).map((d) => shortDate(d))
  );

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        background: "rgba(0,0,0,0.25)",
        border: "1px solid rgba(255,255,255,0.07)",
        padding: "12px 14px 8px",
        marginTop: 10,
      }}
    >
      {/* Header row */}
      <div className="flex items-baseline justify-between mb-2">
        <span className="font-mono" style={{ color: "hsl(var(--gold))", fontSize: 12, fontWeight: 700 }}>
          {ticker} {title ? `· ${title}` : "· Price"}
        </span>
        <div className="flex items-baseline gap-2">
          <span className="font-mono font-bold" style={{ color: "hsl(var(--foreground))", fontSize: 14 }}>
            {formatCurrency(last)}
          </span>
          <span className="font-mono" style={{ color: lineColor, fontSize: 11 }}>
            {isUp ? "▲ +" : "▼ "}{formatCurrency(Math.abs(pnl))} ({isUp ? "+" : ""}{pct}%)
          </span>
        </div>
      </div>

      {/* Chart */}
      <div style={{ height: 140 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={points} margin={{ top: 4, right: 2, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={gradColor} stopOpacity={0.3} />
                <stop offset="100%" stopColor={gradColor} stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />

            <XAxis
              dataKey="date"
              tick={{ fill: "#8892A4", fontSize: 9 }}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fill: "#8892A4", fontSize: 9 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={formatY}
              domain={["dataMin * 0.99", "dataMax * 1.01"]}
              width={44}
            />

            {/* Filing date markers */}
            {Array.from(filingSet).map((d) => (
              <ReferenceLine
                key={d}
                x={d}
                stroke="rgba(240,165,0,0.5)"
                strokeDasharray="3 3"
                label={{ value: "📋", position: "top", fontSize: 9 }}
              />
            ))}

            <Tooltip
              content={<CustomTooltip />}
              cursor={{ stroke: "rgba(255,255,255,0.1)", strokeWidth: 1 }}
            />

            <Area
              type="monotone"
              dataKey="value"
              stroke={lineColor}
              strokeWidth={1.5}
              fill={`url(#${gradId})`}
              dot={false}
              activeDot={{ r: 3, fill: lineColor, stroke: "#0A1218", strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Footer */}
      <p className="font-mono" style={{ color: "hsl(var(--muted-foreground))", fontSize: 9, marginTop: 4, textAlign: "right" }}>
        {points.length} data points · {points[0].date} → {points[points.length - 1].date}
      </p>
    </div>
  );
};

export default InlineTrendChart;
