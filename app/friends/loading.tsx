export default function FriendsLoading() {
  return (
    <div className="space-y-6 animate-pulse p-6">
      <div className="h-8 w-28 rounded-xl bg-muted" />
      <div className="grid gap-6 xl:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-border bg-card p-6 space-y-4">
            <div className="h-5 w-32 rounded bg-muted" />
            {Array.from({ length: 3 }).map((_, j) => (
              <div key={j} className="h-12 rounded-xl bg-muted" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
