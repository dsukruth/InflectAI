import { useState, useEffect, useCallback } from "react";
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
import { apiCall } from "@/api/client";
import { formatCurrency } from "@/utils/formatters";

type Range = "1D" | "1W" | "1M" | "ALL";

interface Snapshot {
  date: string;
  value: number;
  cash: number;
  positions_value: number;
}

const INITIAL_VALUE = 100_000;

const RANGES: Range[] = ["1D", "1W", "1M", "ALL"];

const filterByRange = (data: Snapshot[], range: Range): Snapshot[] => {
  if (range === "ALL") return data;
  const now = Date.now();
  const days = range === "1D" ? 1 : range === "1W" ? 7 : 30;
  const cutoff = now - days * 86400000;
  return data.filter((d) => new Date(d.date).getTime() >= cutoff);
};

const formatXLabel = (date: string, range: Range): string => {
  const d = new Date(date);
  if (range === "1D") return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (range === "1W") return d.toLocaleDateString([], { weekday: "short" });
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
};

interface TooltipPayload {
  value: number;
  payload: Snapshot;
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
  const snap = payload[0].payload;
  const pnl = snap.value - INITIAL_VALUE;
  const pnlPct = ((snap.value - INITIAL_VALUE) / INITIAL_VALUE) * 100;
  const isUp = pnl >= 0;

  return (
    <div
      className="rounded-xl"
      style={{
        background: "#0A1218",
        border: "1px solid rgba(255,255,255,0.08)",
        padding: "10px 14px",
        fontSize: 11,
        minWidth: 160,
      }}
    >
      <p style={{ color: "hsl(var(--muted-foreground))", marginBottom: 6 }}>{label}</p>
      <p className="font-mono font-bold" style={{ color: "hsl(var(--foreground))", fontSize: 14 }}>
        {formatCurrency(snap.value)}
      </p>
      <p className="font-mono" style={{ color: isUp ? "hsl(var(--bull))" : "hsl(var(--bear))", fontSize: 11, marginTop: 2 }}>
        {isUp ? "▲" : "▼"} {isUp ? "+" : ""}{formatCurrency(pnl)} ({isUp ? "+" : ""}{pnlPct.toFixed(2)}%)
      </p>
      <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", marginTop: 8, paddingTop: 6 }}>
        <div className="flex justify-between gap-4">
          <span style={{ color: "hsl(var(--muted-foreground))" }}>Cash</span>
          <span className="font-mono" style={{ color: "hsl(var(--cyan))" }}>{formatCurrency(snap.cash)}</span>
        </div>
        <div className="flex justify-between gap-4 mt-1">
          <span style={{ color: "hsl(var(--muted-foreground))" }}>Positions</span>
          <span className="font-mono" style={{ color: "hsl(var(--gold))" }}>{formatCurrency(snap.positions_value)}</span>
        </div>
      </div>
    </div>
  );
};

interface EquityCurveProps {
  /** Trigger a data refresh — pass a changing value (e.g. trade count) */
  refreshKey?: number;
}

const EquityCurve = ({ refreshKey }: EquityCurveProps) => {
  const [range, setRange] = useState<Range>("ALL");
  const [allData, setAllData] = useState<Snapshot[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiCall<{ snapshots: Snapshot[] }>("/api/v1/trades/equity-curve");
      setAllData(res.snapshots);
    } catch {
      // silently leave empty — will show placeholder
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load, refreshKey]);

  const filtered = filterByRange(allData, range);

  const startValue = filtered[0]?.value ?? INITIAL_VALUE;
  const endValue = filtered[filtered.length - 1]?.value ?? INITIAL_VALUE;
  const totalPnl = endValue - INITIAL_VALUE;
  const totalPct = ((endValue - INITIAL_VALUE) / INITIAL_VALUE) * 100;
  const periodPnl = endValue - startValue;
  const isUp = totalPnl >= 0;
  const isPeriodUp = periodPnl >= 0;

  const strokeColor = isPeriodUp ? "hsl(var(--bull))" : "hsl(var(--bear))";
  const gradId = isPeriodUp ? "bullGrad" : "bearGrad";
  const gradColor = isPeriodUp ? "hsl(142, 71%, 45%)" : "hsl(0, 70%, 55%)";

  return (
    <div
      className="rounded-2xl relative overflow-hidden"
      style={{ background: "#0F1820", border: "1px solid hsl(var(--border))", padding: 20 }}
    >
      {/* Ambient glow */}
      <div
        className="absolute -top-16 -left-16 w-56 h-56 rounded-full pointer-events-none"
        style={{ background: strokeColor, filter: "blur(90px)", opacity: 0.06 }}
      />

      {/* Header */}
      <div className="flex items-start justify-between mb-4 relative z-10">
        <div>
          <p
            className="uppercase font-mono"
            style={{ color: "hsl(var(--muted-foreground))", fontSize: 10, letterSpacing: "0.15em", marginBottom: 4 }}
          >
            Equity Curve
          </p>
          {!loading && allData.length > 0 && (
            <div className="flex items-baseline gap-3">
              <span className="font-mono font-bold" style={{ color: "hsl(var(--foreground))", fontSize: 22 }}>
                {formatCurrency(endValue)}
              </span>
              <span
                className="font-mono"
                style={{ color: isUp ? "hsl(var(--bull))" : "hsl(var(--bear))", fontSize: 12 }}
              >
                {isUp ? "▲ +" : "▼ "}{formatCurrency(Math.abs(totalPnl))} ({isUp ? "+" : ""}{totalPct.toFixed(2)}%)
              </span>
            </div>
          )}
        </div>

        {/* Range buttons */}
        <div className="flex gap-1">
          {RANGES.map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className="font-mono text-xs px-3 py-1 rounded-lg transition-colors"
              style={{
                background: range === r ? "hsl(var(--cyan))" : "rgba(255,255,255,0.05)",
                color: range === r ? "hsl(var(--background))" : "hsl(var(--muted-foreground))",
                fontWeight: range === r ? 700 : 400,
                border: range === r ? "none" : "1px solid rgba(255,255,255,0.06)",
              }}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div style={{ height: 200 }} className="relative z-10">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div
              className="w-5 h-5 border-2 rounded-full animate-spin"
              style={{ borderColor: "hsl(var(--cyan))", borderTopColor: "transparent" }}
            />
          </div>
        ) : filtered.length < 2 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2">
            <div style={{ opacity: 0.3, fontSize: 28 }}>📈</div>
            <p style={{ color: "hsl(var(--muted-foreground))", fontSize: 12 }}>
              No data yet — your equity curve builds as you trade.
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={filtered} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={gradColor} stopOpacity={0.25} />
                  <stop offset="100%" stopColor={gradColor} stopOpacity={0} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />

              <XAxis
                dataKey="date"
                tick={{ fill: "#8892A4", fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v: string) => formatXLabel(v, range)}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fill: "#8892A4", fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`}
                domain={["dataMin - 500", "dataMax + 500"]}
                width={46}
              />

              <ReferenceLine
                y={INITIAL_VALUE}
                stroke="rgba(255,255,255,0.1)"
                strokeDasharray="4 4"
              />

              <Tooltip
                content={<CustomTooltip />}
                cursor={{ stroke: "rgba(255,255,255,0.12)", strokeWidth: 1 }}
              />

              <Area
                type="monotone"
                dataKey="value"
                stroke={strokeColor}
                strokeWidth={2}
                fill={`url(#${gradId})`}
                dot={false}
                activeDot={{ r: 4, fill: strokeColor, stroke: "#0F1820", strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

export default EquityCurve;
