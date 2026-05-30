import Link from "next/link";
import { CreateWorkoutTemplateForm } from "@/components/workouts/create-workout-template-form";

export default async function NewWorkoutPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  const params = await searchParams;

  return (
    <main className="p-6 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">
            Training
          </p>
          <h1 className="text-3xl font-semibold">Create workout template</h1>
          <p className="text-sm text-muted-foreground">
            Create a reusable workout structure before logging live sessions.
          </p>
        </div>

        <Link href="/workouts" className="rounded-md border px-4 py-2 text-sm">
          Back to workouts
        </Link>
      </div>

      {params?.message ? (
        <div className="rounded-xl border px-4 py-3 text-sm">{params.message}</div>
      ) : null}

      <CreateWorkoutTemplateForm />
    </main>
  );
}