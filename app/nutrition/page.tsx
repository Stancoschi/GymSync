import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BodyLogForm } from "@/components/nutrition/body-log-form";
import { MealForm } from "@/components/nutrition/meal-form";
import { BodyProgressCharts } from "@/components/nutrition/body-progress-charts";
import { Scale, Utensils, TrendingUp, Flame, Beef, Wheat, Droplets } from "lucide-react";

export default async function NutritionPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: bodyLogs, error: bodyLogsError } = await supabase
    .from("body_logs")
    .select("log_date, weight_kg, body_fat_percent")
    .eq("user_id", user.id)
    .order("log_date", { ascending: false })
    .limit(90);

  const { data: meals, error: mealsError } = await supabase
    .from("meals")
    .select("*")
    .eq("user_id", user.id)
    .order("log_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(30);

  const { data: profile } = await supabase
    .from("profiles")
    .select("target_weight_kg")
    .eq("id", user.id)
    .single();

  if (bodyLogsError || mealsError) {
    return (
      <main className="p-6 space-y-2">
        <p className="text-sm text-destructive">Failed to load nutrition data.</p>
        {bodyLogsError && <pre className="text-xs text-destructive/70 whitespace-pre-wrap">bodyLogsError: {bodyLogsError.message}</pre>}
        {mealsError && <pre className="text-xs text-destructive/70 whitespace-pre-wrap">mealsError: {mealsError.message}</pre>}
      </main>
    );
  }

  // Aggregate calories per day for chart
  const calsByDay = (meals ?? []).reduce<Record<string, number>>((acc, m) => {
    if (m.calories && m.log_date) acc[m.log_date] = (acc[m.log_date] ?? 0) + m.calories;
    return acc;
  }, {});
  const mealDays = Object.entries(calsByDay)
    .map(([log_date, calories]) => ({ log_date, calories }))
    .sort((a, b) => a.log_date.localeCompare(b.log_date));

  // Today's stats
  const today = new Date().toISOString().slice(0, 10);
  const todayMeals = (meals ?? []).filter((m) => m.log_date === today);
  const todayKcal = todayMeals.reduce((s, m) => s + (m.calories ?? 0), 0);
  const todayProtein = todayMeals.reduce((s, m) => s + (m.protein_g ?? 0), 0);
  const todayCarbs = todayMeals.reduce((s, m) => s + (m.carbs_g ?? 0), 0);
  const todayFat = todayMeals.reduce((s, m) => s + (m.fat_g ?? 0), 0);
  const latestWeight = bodyLogs && bodyLogs.length > 0 ? bodyLogs[0] : null;

  return (
    <main className="p-4 md:p-6 space-y-8 page-enter pb-24 md:pb-6">
      {params?.message && (
        <div className="rounded-xl border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
          {params.message}
        </div>
      )}

      {/* Header */}
      <div className="space-y-0.5">
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">Health</p>
        <h1 className="text-2xl font-extrabold tracking-tight">Nutrition & Body</h1>
      </div>

      {/* Today's summary tiles */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { icon: Flame, label: "Calories today", value: todayKcal > 0 ? `${todayKcal} kcal` : "—", color: "text-orange-400" },
          { icon: Beef, label: "Protein", value: todayProtein > 0 ? `${Math.round(todayProtein)}g` : "—", color: "text-blue-400" },
          { icon: Wheat, label: "Carbs", value: todayCarbs > 0 ? `${Math.round(todayCarbs)}g` : "—", color: "text-yellow-400" },
          { icon: Droplets, label: "Fat", value: todayFat > 0 ? `${Math.round(todayFat)}g` : "—", color: "text-emerald-400" },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="rounded-2xl border border-border bg-card p-4 space-y-2">
            <div className="flex items-center gap-2">
              <Icon className={`w-4 h-4 ${color}`} />
              <span className="text-xs font-medium text-muted-foreground">{label}</span>
            </div>
            <p className="text-xl font-bold tabular-nums">{value}</p>
          </div>
        ))}
      </section>

      {/* Latest body stats */}
      {latestWeight && (
        <section className="rounded-2xl border border-border bg-card p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Scale className="w-5 h-5 text-primary shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Latest weight</p>
              <p className="text-lg font-bold tabular-nums">{latestWeight.weight_kg} kg</p>
            </div>
          </div>
          {latestWeight.body_fat_percent && (
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Body fat</p>
              <p className="text-lg font-bold tabular-nums">{latestWeight.body_fat_percent}%</p>
            </div>
          )}
          {profile?.target_weight_kg && (
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Target</p>
              <p className="text-lg font-bold tabular-nums">{profile.target_weight_kg} kg</p>
            </div>
          )}
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Logged</p>
            <p className="text-sm text-muted-foreground">{new Date(latestWeight.log_date).toLocaleDateString("ro-RO", { day: "numeric", month: "short" })}</p>
          </div>
        </section>
      )}

      {/* Progress charts */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground">Progress</h2>
        </div>
        <BodyProgressCharts
          bodyLogs={bodyLogs ?? []}
          mealDays={mealDays}
          targetWeightKg={profile?.target_weight_kg ?? null}
        />
      </section>

      {/* Forms */}
      <div className="grid gap-6 lg:grid-cols-2">
        <BodyLogForm />
        <MealForm />
      </div>

      {/* Recent body logs */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Scale className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground">Recent body logs</h2>
        </div>
        {bodyLogs && bodyLogs.length > 0 ? (
          <div className="space-y-2">
            {bodyLogs.slice(0, 10).map((log: any) => (
              <div key={log.log_date} className="flex items-center justify-between rounded-2xl border border-border bg-card px-4 py-3">
                <p className="text-sm text-muted-foreground">
                  {new Date(log.log_date).toLocaleDateString("ro-RO", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
                </p>
                <div className="flex items-center gap-4">
                  <span className="text-sm font-semibold tabular-nums">{log.weight_kg} kg</span>
                  {log.body_fat_percent && (
                    <span className="text-xs text-muted-foreground tabular-nums">{log.body_fat_percent}% BF</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed p-10 flex flex-col items-center gap-3 text-center">
            <Scale className="w-8 h-8 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">No body logs yet. Start tracking your weight above.</p>
          </div>
        )}
      </section>

      {/* Recent meals */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Utensils className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground">Recent meals</h2>
        </div>
        {meals && meals.length > 0 ? (
          <div className="space-y-2">
            {meals.map((meal: any) => (
              <div key={meal.id} className="rounded-2xl border border-border bg-card px-4 py-3 space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold truncate">{meal.food_name}</p>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {new Date(meal.log_date).toLocaleDateString("ro-RO", { day: "numeric", month: "short" })}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  {meal.calories && (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-orange-400">
                      <Flame className="w-3 h-3" /> {meal.calories} kcal
                    </span>
                  )}
                  {meal.protein_g && <span className="text-xs text-muted-foreground">P {meal.protein_g}g</span>}
                  {meal.carbs_g && <span className="text-xs text-muted-foreground">C {meal.carbs_g}g</span>}
                  {meal.fat_g && <span className="text-xs text-muted-foreground">F {meal.fat_g}g</span>}
                </div>
                {meal.notes && <p className="text-xs text-muted-foreground border-t border-border pt-1.5">{meal.notes}</p>}
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed p-10 flex flex-col items-center gap-3 text-center">
            <Utensils className="w-8 h-8 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">No meals logged yet. Add your first meal above.</p>
          </div>
        )}
      </section>
    </main>
  );
}
