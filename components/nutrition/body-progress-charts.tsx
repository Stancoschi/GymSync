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

// Hex colors — SVG stroke/fill does NOT support CSS variables like hsl(var(--x))
const COLOR_PRIMARY = "#4f98a3";   // matches --color-primary dark mode teal
const COLOR_ORANGE  = "#f97316";
const COLOR_MUTED   = "#797876";

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

  const sorted = [...bodyLogs]
    .filter((l) => l.weight_kg !== null && l.weight_kg !== undefined)
    .sort((a, b) => a.log_date.localeCompare(b.log_date));

  const hasBf = sorted.some(
    (l) => l.body_fat_percent !== null && l.body_fat_percent !== undefined
  );

  const chartData = sorted.map((l) => ({
    date: l.log_date.slice(5),
    weight: Number(l.weight_kg),
    bodyFat:
      l.body_fat_percent !== null && l.body_fat_percent !== undefined
        ? Number(l.body_fat_percent)
        : null,
    target: targetWeightKg != null ? Number(targetWeightKg) : null,
  }));

  const latest = sorted[sorted.length - 1];
  const first = sorted[0];
  const delta =
    latest && first
      ? +(Number(latest.weight_kg) - Number(first.weight_kg)).toFixed(1)
      : null;

  const latestBf =
    [...bodyLogs]
      .filter((l) => l.body_fat_percent !== null && l.body_fat_percent !== undefined)
      .sort((a, b) => b.log_date.localeCompare(a.log_date))[0]?.body_fat_percent ?? null;

  const avgCalories =
    mealDays.length > 0
      ? Math.round(mealDays.reduce((sum, d) => sum + Number(d.calories), 0) / mealDays.length)
      : null;

  const tooltipStyle = {
    background: "#1c1b19",
    border: "1px solid #393836",
    borderRadius: "0.75rem",
    fontSize: 12,
    color: "#cdccca",
  };

  return (
    <div className="space-y-8">
      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          label="Current weight"
          value={latest?.weight_kg ? `${Number(latest.weight_kg)} kg` : "—"}
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
          value={targetWeightKg ? `${Number(targetWeightKg)} kg` : "—"}
          sub={
            targetWeightKg && latest?.weight_kg
              ? `${+(Number(latest.weight_kg) - Number(targetWeightKg)).toFixed(1)} kg to go`
              : undefined
          }
          trend="neutral"
        />
        <StatCard
          label="Body fat"
          value={latestBf !== null ? `${Number(latestBf)}%` : "—"}
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
            <CartesianGrid strokeDasharray="3 3" stroke="#393836" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: COLOR_MUTED }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              domain={["auto", "auto"]}
              tick={{ fontSize: 11, fill: COLOR_MUTED }}
              tickLine={false}
              axisLine={false}
              width={40}
            />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(v: number, name: string) => [
                name === "Body fat (%)" ? `${v}%` : `${v} kg`,
                name,
              ]}
            />
            <Legend wrapperStyle={{ fontSize: 12, color: COLOR_MUTED }} />

            {targetWeightKg != null && (
              <Line
                type="monotone"
                dataKey="target"
                stroke={COLOR_MUTED}
                strokeDasharray="4 4"
                strokeWidth={1.5}
                dot={false}
                connectNulls
                name="Target"
              />
            )}

            <Line
              type="monotone"
              dataKey="weight"
              stroke={COLOR_PRIMARY}
              strokeWidth={2}
              dot={{ r: 3, fill: COLOR_PRIMARY }}
              activeDot={{ r: 5 }}
              connectNulls
              name="Weight (kg)"
            />

            {hasBf && (
              <Line
                type="monotone"
                dataKey="bodyFat"
                stroke={COLOR_ORANGE}
                strokeWidth={1.5}
                dot={{ r: 2, fill: COLOR_ORANGE }}
                connectNulls
                name="Body fat (%)"
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
              data={mealDays.map((d) => ({
                date: d.log_date.slice(5),
                calories: Number(d.calories),
              }))}
              margin={{ top: 4, right: 16, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#393836" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: COLOR_MUTED }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: COLOR_MUTED }}
                tickLine={false}
                axisLine={false}
                width={45}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(v: number) => [`${v} kcal`, "Calories"]}
              />
              <Bar
                dataKey="calories"
                fill={COLOR_PRIMARY}
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
