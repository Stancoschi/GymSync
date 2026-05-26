import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { BodyLogForm } from "@/components/nutrition/body-log-form";
import { MealForm } from "@/components/nutrition/meal-form";

export default async function NutritionPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: bodyLogs, error: bodyLogsError } = await supabase
    .from("body_logs")
    .select("*")
    .order("log_date", { ascending: false })
    .limit(20);

  const { data: meals, error: mealsError } = await supabase
    .from("meals")
    .select("*")
    .order("log_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(30);

    if (bodyLogsError || mealsError) {
        return (
          <main className="p-6 space-y-2">
            <p className="text-sm text-red-600">Failed to load nutrition data.</p>
            {bodyLogsError ? (
              <pre className="text-xs text-red-500 whitespace-pre-wrap">
                bodyLogsError: {bodyLogsError.message}
              </pre>
            ) : null}
            {mealsError ? (
              <pre className="text-xs text-red-500 whitespace-pre-wrap">
                mealsError: {mealsError.message}
              </pre>
            ) : null}
          </main>
        );
      }

  return (
    <main className="p-6 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Nutrition & body logs</h1>
          <p className="text-sm text-muted-foreground">
            Track meals, body weight and progress metrics.
          </p>
        </div>

        <Link href="/dashboard" className="rounded-md border px-4 py-2 text-sm">
          Back to dashboard
        </Link>
      </div>

      {params?.message ? (
        <p className="rounded-md bg-muted p-3 text-sm">
          {params.message}
        </p>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <BodyLogForm />
        <MealForm />
      </div>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Recent body logs</h2>

        {bodyLogs && bodyLogs.length > 0 ? (
          <div className="grid gap-4">
            {bodyLogs.map((log: any) => (
              <div key={log.id} className="rounded-2xl border p-4">
                <p className="font-medium">{log.log_date}</p>
                <p className="text-sm text-muted-foreground">
                  Weight: {log.weight_kg} kg
                  {log.body_fat_percent ? ` • Body fat: ${log.body_fat_percent}%` : ""}
                </p>
                {log.notes ? (
                  <p className="mt-2 text-sm text-muted-foreground">{log.notes}</p>
                ) : null}
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border p-6 text-sm text-muted-foreground">
            No body logs yet.
          </div>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Recent meals</h2>

        {meals && meals.length > 0 ? (
          <div className="grid gap-4">
            {meals.map((meal: any) => (
              <div key={meal.id} className="rounded-2xl border p-4">
                <p className="font-medium">
                  {meal.food_name} <span className="text-sm text-muted-foreground">• {meal.log_date}</span>
                </p>
                <p className="text-sm text-muted-foreground">
                  {meal.calories ?? "-"} kcal • P: {meal.protein_g ?? "-"}g • C: {meal.carbs_g ?? "-"}g • F: {meal.fat_g ?? "-"}g
                </p>
                {meal.notes ? (
                  <p className="mt-2 text-sm text-muted-foreground">{meal.notes}</p>
                ) : null}
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border p-6 text-sm text-muted-foreground">
            No meals yet.
          </div>
        )}
      </section>
    </main>
  );
}