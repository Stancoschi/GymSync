import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <main className="min-h-screen bg-background flex flex-col">
      {/* Nav */}
      <header className="px-6 py-4 flex items-center justify-between border-b border-border">
        <span className="text-lg font-bold tracking-tight">
          Gym<span className="text-primary">Sync</span>
        </span>
        <div className="flex items-center gap-3">
          <Link
            href="/auth/login"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Log in
          </Link>
          <Link
            href="/auth/register"
            className="text-sm bg-primary text-primary-foreground rounded-lg px-4 py-2 font-medium hover:opacity-90 transition-opacity"
          >
            Get started
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-6 py-24 gap-6">
        <div className="inline-flex items-center gap-2 rounded-full bg-accent border border-primary/20 px-4 py-1.5 text-xs font-medium text-primary mb-2">
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          Train together. Track everything.
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight max-w-3xl">
          Your gym, your squad,{" "}
          <span className="text-primary">one place.</span>
        </h1>

        <p className="text-muted-foreground text-lg max-w-xl">
          GymSync lets you log workouts, track nutrition, schedule gym sessions
          with friends, and compete on weekly challenges — all in one dark,
          focused app.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 mt-2">
          <Link
            href="/auth/register"
            className="bg-primary text-primary-foreground rounded-xl px-8 py-3 font-semibold text-base hover:opacity-90 transition-opacity"
          >
            Start for free
          </Link>
          <Link
            href="/auth/login"
            className="rounded-xl px-8 py-3 font-semibold text-base border border-border hover:bg-muted transition-colors"
          >
            Log in
          </Link>
        </div>
      </section>

      {/* Feature strip */}
      <section className="border-t border-border px-6 py-12">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { icon: "◈", label: "Workout logging", desc: "Sets, reps, PRs" },
            { icon: "◉", label: "Nutrition", desc: "Meals & body logs" },
            { icon: "◎", label: "Gym sessions", desc: "Schedule & join" },
            { icon: "◆", label: "Challenges", desc: "Compete weekly" },
          ].map((f) => (
            <div key={f.label} className="space-y-2">
              <div className="text-2xl text-primary">{f.icon}</div>
              <p className="font-semibold text-sm">{f.label}</p>
              <p className="text-xs text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-border px-6 py-5 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} GymSync. Built to help you train smarter.
      </footer>
    </main>
  );
}
