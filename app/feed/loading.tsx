export default function FeedLoading() {
  return (
    <div className="space-y-4 animate-pulse p-6">
      <div className="h-8 w-24 rounded-xl bg-muted" />
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-border bg-card p-5 flex gap-4">
          <div className="w-10 h-10 rounded-full bg-muted shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-40 rounded bg-muted" />
            <div className="h-3 w-56 rounded bg-muted" />
          </div>
        </div>
      ))}
    </div>
  );
}
