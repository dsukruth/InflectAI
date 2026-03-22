import { useState, useEffect } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useAuthStore } from "@/store/authStore";
import { formatCurrency } from "@/utils/formatters";

type Range = "1D" | "1W" | "1M" | "ALL";

interface Snapshot {
  snapshot_date: string;
  total_value: number;
}

const EquityCurve = () => {
  const { user } = useAuthStore();
  const [range, setRange] = useState<Range>("ALL");
  const [data, setData] = useState<Snapshot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      const { data: snaps } = await supabase
        .from("portfolio_snapshots")
        .select("snapshot_date, total_value")
        .eq("user_id", user.id)
        .order("snapshot_date", { ascending: true });

      if (snaps) setData(snaps as Snapshot[]);
      setLoading(false);
    })();
  }, [user]);

  const now = new Date();
  const filtered = data.filter((d) => {
    if (range === "ALL") return true;
    const date = new Date(d.snapshot_date);
    const diffDays = (now.getTime() - date.getTime()) / 86400000;
    if (range === "1D") return diffDays <= 1;
    if (range === "1W") return diffDays <= 7;
    if (range === "1M") return diffDays <= 30;
    return true;
  });

  const ranges: Range[] = ["1D", "1W", "1M", "ALL"];

  return (
    <div className="rounded-2xl relative overflow-hidden" style={{ background: "#0F1820", border: "1px solid hsl(var(--border))", padding: 20 }}>
      {/* Cyan glow */}
      <div className="absolute -top-20 -left-20 w-60 h-60 rounded-full pointer-events-none" style={{ background: "hsl(var(--cyan))", filter: "blur(100px)", opacity: 0.08 }} />

      <div className="flex items-center justify-between mb-4 relative z-10">
        <h3 className="font-semibold" style={{ color: "hsl(var(--foreground))", fontSize: 14 }}>Equity Curve</h3>
        <div className="flex gap-1">
          {ranges.map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className="font-mono text-xs px-3 py-1 rounded-lg transition-colors"
              style={{
                background: range === r ? "hsl(var(--cyan))" : "hsl(var(--border))",
                color: range === r ? "hsl(var(--background))" : "hsl(var(--muted-foreground))",
                fontWeight: range === r ? 700 : 400,
              }}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <div style={{ height: 180 }} className="relative z-10">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "hsl(var(--cyan))", borderTopColor: "transparent" }} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p style={{ color: "hsl(var(--muted-foreground))", fontSize: 12 }}>No data yet. Your equity curve will build as you trade.</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={filtered}>
              <defs>
                <linearGradient id="cyanGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(195, 100%, 50%)" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="hsl(195, 100%, 50%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(30,45,64,0.3)" />
              <XAxis dataKey="snapshot_date" tick={{ fill: "#8892A4", fontSize: 10 }} tickLine={false} axisLine={false} />
              <YAxis
                tick={{ fill: "#8892A4", fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`}
                domain={["dataMin - 1000", "dataMax + 1000"]}
              />
              <Tooltip
                contentStyle={{ background: "#0F1820", border: "1px solid hsl(215, 30%, 15%)", borderRadius: 8 }}
                labelStyle={{ color: "#8892A4", fontSize: 11 }}
                formatter={(value: number) => [formatCurrency(value), "Value"]}
              />
              <Area type="monotone" dataKey="total_value" stroke="hsl(195, 100%, 50%)" strokeWidth={2} fill="url(#cyanGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

export default EquityCurve;
