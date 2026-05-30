export default function NutritionLoading() {
  return (
    <div className="space-y-4 animate-pulse p-6">
      <div className="h-8 w-36 rounded-xl bg-muted" />
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-border bg-card p-5 space-y-2">
          <div className="h-4 w-40 rounded bg-muted" />
          <div className="h-3 w-28 rounded bg-muted" />
        </div>
      ))}
    </div>
  );
}
