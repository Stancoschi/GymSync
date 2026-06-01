"use client";

import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface WeightPoint {
  date: string;
  weight: number;
  trend?: number;
}

interface WeightChartProps {
  data: WeightPoint[];
}

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

// Recharts renders SVG — CSS variables resolve only if the SVG inherits them
// from the DOM. Using `var(--primary)` directly (no `hsl()` wrapper) works
// because Tailwind / shadcn expose these as raw color values, not hsl channels.
const COLOR_LINE = "var(--color-primary)";
const COLOR_TREND = "var(--color-muted-foreground)";
const COLOR_GRID = "var(--color-border)";
const COLOR_TICK = "var(--color-muted-foreground)";
const COLOR_CARD = "var(--color-card)";

export function WeightChart({ data }: WeightChartProps) {
  if (data.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-8 text-center">
        No body logs yet. Start tracking your weight!
      </p>
    );
  }

  const chartData = withTrend(data);

  const weights = data.map((d) => d.weight);
  const minW = Math.min(...weights);
  const maxW = Math.max(...weights);
  const padding = Math.max(1, (maxW - minW) * 0.25);
  const yMin = parseFloat((minW - padding).toFixed(1));
  const yMax = parseFloat((maxW + padding).toFixed(1));

  return (
    <ResponsiveContainer width="100%" height={200}>
      <ComposedChart data={chartData} margin={{ top: 6, right: 8, left: -20, bottom: 0 }}>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke={COLOR_GRID}
          vertical={false}
          opacity={0.5}
        />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11, fill: COLOR_TICK }}
          tickLine={false}
          axisLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fontSize: 11, fill: COLOR_TICK }}
          tickLine={false}
          axisLine={false}
          domain={[yMin, yMax]}
          tickFormatter={(v: number) => `${v}`}
        />
        <Tooltip
          contentStyle={{
            background: COLOR_CARD,
            border: `1px solid ${COLOR_GRID}`,
            borderRadius: "8px",
            fontSize: 12,
          }}
          formatter={(value: number, name: string) => [
            `${value} kg`,
            name === "trend" ? "Trend" : "Weight",
          ]}
        />

        {/* Actual weight — solid line, visible dots */}
        <Line
          type="monotone"
          dataKey="weight"
          stroke={COLOR_LINE}
          strokeWidth={2.5}
          dot={{ r: 4, fill: COLOR_LINE, stroke: "none" }}
          activeDot={{ r: 6, stroke: "none" }}
          connectNulls
          isAnimationActive={false}
        />

        {/* Trend line — dashed, no dots */}
        <Line
          type="monotone"
          dataKey="trend"
          stroke={COLOR_TREND}
          strokeWidth={1.5}
          strokeDasharray="6 4"
          dot={false}
          activeDot={false}
          connectNulls
          isAnimationActive={false}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
