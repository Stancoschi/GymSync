export default function ChallengesLoading() {
  return (
    <div className="space-y-6 p-6 animate-pulse">
      <div className="h-8 w-56 rounded-xl bg-muted" />
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border bg-card p-5 md:col-span-2 space-y-4">
          <div className="h-6 w-40 rounded bg-muted" />
          <div className="h-3 rounded-full bg-muted" />
        </div>
        <div className="rounded-2xl border bg-card p-5 space-y-3">
          <div className="h-4 w-28 rounded bg-muted" />
          <div className="h-4 w-20 rounded bg-muted" />
        </div>
      </div>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-16 rounded-2xl bg-muted" />
      ))}
    </div>
  );
}
