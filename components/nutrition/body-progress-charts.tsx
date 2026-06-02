"use client";

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

type BodyLog = {
  log_date: string;
  weight_kg: number | null;
  body_fat_percent: number | null;
};

type MealDay = {
  log_date: string;
  calories: number;
};

interface Props {
  bodyLogs: BodyLog[];
  mealDays: MealDay[];
  targetWeightKg?: number | null;
}

function StatCard({
  label,
  value,
  sub,
  trend,
}: {
  label: string;
  value: string;
  sub?: string;
  trend?: "up" | "down" | "neutral";
}) {
  const trendColor =
    trend === "down"
      ? "text-green-500"
      : trend === "up"
      ? "text-red-400"
      : "text-muted-foreground";
  return (
    <div className="rounded-2xl border border-border bg-card p-4 space-y-1">
      <p className="text-xs uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="text-2xl font-bold tabular-nums">{value}</p>
      {sub && <p className={`text-sm font-medium ${trendColor}`}>{sub}</p>}
    </div>
  );
}

export function BodyProgressCharts({ bodyLogs, mealDays, targetWeightKg }: Props) {
  if (!bodyLogs || bodyLogs.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
        Log your first body measurement to see progress charts.
      </div>
    );
  }

  // Sort ascending for charts
  const sorted = [...bodyLogs]
    .filter((l) => l.weight_kg !== null)
    .sort((a, b) => a.log_date.localeCompare(b.log_date));

  const chartData = sorted.map((l) => ({
    date: l.log_date.slice(5), // MM-DD
    weight: l.weight_kg,
    bodyFat: l.body_fat_percent ?? undefined,
    target: targetWeightKg ?? undefined,
  }));

  const latest = sorted[sorted.length - 1];
  const first = sorted[0];
  const delta =
    latest && first && latest.weight_kg !== null && first.weight_kg !== null
      ? +(latest.weight_kg - first.weight_kg).toFixed(1)
      : null;

  const latestBf =
    bodyLogs
      .filter((l) => l.body_fat_percent !== null)
      .sort((a, b) => b.log_date.localeCompare(a.log_date))[0]?.body_fat_percent ?? null;

  const avgCalories =
    mealDays.length > 0
      ? Math.round(mealDays.reduce((sum, d) => sum + d.calories, 0) / mealDays.length)
      : null;

  return (
    <div className="space-y-8">
      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          label="Current weight"
          value={latest?.weight_kg ? `${latest.weight_kg} kg` : "—"}
          sub={
            delta !== null
              ? `${delta > 0 ? "+" : ""}${delta} kg since start`
              : undefined
          }
          trend={
            delta === null ? "neutral" : delta < 0 ? "down" : delta > 0 ? "up" : "neutral"
          }
        />
        <StatCard
          label="Target weight"
          value={targetWeightKg ? `${targetWeightKg} kg` : "—"}
          sub={
            targetWeightKg && latest?.weight_kg
              ? `${+(latest.weight_kg - targetWeightKg).toFixed(1)} kg to go`
              : undefined
          }
          trend="neutral"
        />
        <StatCard
          label="Body fat"
          value={latestBf !== null ? `${latestBf}%` : "—"}
        />
        <StatCard
          label="Avg calories"
          value={avgCalories !== null ? `${avgCalories} kcal` : "—"}
          sub={mealDays.length > 0 ? `last ${mealDays.length} days` : undefined}
          trend="neutral"
        />
      </div>

      {/* Weight chart */}
      <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
        <h3 className="text-sm font-semibold">Weight over time</h3>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={chartData} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              domain={["auto", "auto"]}
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              tickLine={false}
              axisLine={false}
              width={40}
              tickFormatter={(v) => `${v}`}
            />
            <Tooltip
              contentStyle={{
                background: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "0.75rem",
                fontSize: 12,
              }}
              formatter={(v: number) => [`${v} kg`, "Weight"]}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            {targetWeightKg && (
              <Line
                type="monotone"
                dataKey="target"
                stroke="hsl(var(--muted-foreground))"
                strokeDasharray="4 4"
                dot={false}
                name="Target"
              />
            )}
            <Line
              type="monotone"
              dataKey="weight"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              dot={{ r: 3, fill: "hsl(var(--primary))" }}
              activeDot={{ r: 5 }}
              name="Weight (kg)"
            />
            {chartData.some((d) => d.bodyFat !== undefined) && (
              <Line
                type="monotone"
                dataKey="bodyFat"
                stroke="hsl(var(--color-orange, 220 60% 60%))"
                strokeWidth={1.5}
                dot={{ r: 2 }}
                name="Body fat (%)"
                yAxisId={0}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Calories bar chart */}
      {mealDays.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
          <h3 className="text-sm font-semibold">Daily calories (last 30 days)</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart
              data={mealDays.map((d) => ({ date: d.log_date.slice(5), calories: d.calories }))}
              margin={{ top: 4, right: 16, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                tickLine={false}
                axisLine={false}
                width={45}
              />
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "0.75rem",
                  fontSize: 12,
                }}
                formatter={(v: number) => [`${v} kcal`, "Calories"]}
              />
              <Bar
                dataKey="calories"
                fill="hsl(var(--primary))"
                radius={[4, 4, 0, 0]}
                name="Calories"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
