"use client";

import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

interface WeightPoint {
  date: string;
  weight: number;
  trend?: number;
}

interface WeightChartProps {
  data: WeightPoint[];
}

/** Simple linear regression — returns slope & intercept */
function linearRegression(points: { x: number; y: number }[]) {
  const n = points.length;
  if (n < 2) return null;
  const sumX = points.reduce((a, p) => a + p.x, 0);
  const sumY = points.reduce((a, p) => a + p.y, 0);
  const sumXY = points.reduce((a, p) => a + p.x * p.y, 0);
  const sumX2 = points.reduce((a, p) => a + p.x * p.x, 0);
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  return { slope, intercept };
}

/** Attach a trend value to each data point via linear regression */
function withTrend(data: WeightPoint[]): WeightPoint[] {
  if (data.length < 2) return data;
  const points = data.map((d, i) => ({ x: i, y: d.weight }));
  const reg = linearRegression(points);
  if (!reg) return data;
  return data.map((d, i) => ({
    ...d,
    trend: parseFloat((reg.intercept + reg.slope * i).toFixed(2)),
  }));
}

export function WeightChart({ data }: WeightChartProps) {
  if (data.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-8 text-center">
        No body logs yet. Start tracking your weight!
      </p>
    );
  }

  const chartData = withTrend(data);

  // Y-axis domain with a bit of padding
  const weights = data.map((d) => d.weight);
  const minW = Math.min(...weights);
  const maxW = Math.max(...weights);
  const padding = Math.max(1, (maxW - minW) * 0.2);
  const yMin = parseFloat((minW - padding).toFixed(1));
  const yMax = parseFloat((maxW + padding).toFixed(1));

  return (
    <ResponsiveContainer width="100%" height={200}>
      <ComposedChart data={chartData} margin={{ top: 6, right: 8, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
          tickLine={false}
          axisLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
          tickLine={false}
          axisLine={false}
          domain={[yMin, yMax]}
          tickFormatter={(v: number) => `${v}`}
        />
        <Tooltip
          contentStyle={{
            background: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "8px",
            fontSize: 12,
          }}
          formatter={(value: number, name: string) => [
            `${value} kg`,
            name === "trend" ? "Trend" : "Weight",
          ]}
        />

        {/* Actual weight — connected line with dots */}
        <Line
          type="monotone"
          dataKey="weight"
          stroke="hsl(var(--primary))"
          strokeWidth={2}
          dot={{ r: 3, fill: "hsl(var(--primary))", strokeWidth: 0 }}
          activeDot={{ r: 5, strokeWidth: 0 }}
          connectNulls
        />

        {/* Trend line — dashed, no dots */}
        <Line
          type="monotone"
          dataKey="trend"
          stroke="hsl(var(--muted-foreground))"
          strokeWidth={1.5}
          strokeDasharray="5 4"
          dot={false}
          activeDot={false}
          legendType="none"
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
