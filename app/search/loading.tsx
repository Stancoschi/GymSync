export default function SearchLoading() {
  return (
    <main className="p-6 max-w-2xl mx-auto space-y-8 animate-pulse">
      <div>
        <div className="h-3 w-20 bg-muted rounded mb-2" />
        <div className="h-8 w-36 bg-muted rounded" />
      </div>
      <div className="h-11 w-full bg-muted rounded-xl" />
      {[1, 2, 3].map((i) => (
        <section key={i} className="space-y-3">
          <div className="h-3 w-24 bg-muted rounded" />
          {[1, 2, 3].map((j) => (
            <div key={j} className="h-16 bg-muted rounded-xl" />
          ))}
        </section>
      ))}
    </main>
  );
}
