import { apiCall } from "./client";

export interface ChartData {
  x: string[];
  y: number[];
  filingDates?: string[];
  approxFilingMarkers?: string[];
  isPlaceholder?: boolean;
  error?: string;
}

const USE_BACKEND = true;

export async function getChartData(
  ticker: string,
  metric: string | null,
  timeframe: string | null
): Promise<ChartData> {
  if (USE_BACKEND) {
    const params = new URLSearchParams({ ticker });
    if (metric) params.set("metric", metric);
    if (timeframe) params.set("timeframe", timeframe);
    return apiCall<ChartData>(`/api/v1/chart/data?${params}`);
  }

  // Mock fallback
  const now = Date.now();
  const x: string[] = [];
  const y: string[] = [];
  let base = metric?.includes("Margin") ? 44 : 180;
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now - i * 30 * 86400000);
    x.push(d.toISOString().slice(0, 10));
    base += (Math.random() - 0.45) * 5;
    (y as any).push(parseFloat(base.toFixed(2)));
  }
  return {
    x,
    y: y as unknown as number[],
    filingDates: [x[3], x[8]],
  };
}
