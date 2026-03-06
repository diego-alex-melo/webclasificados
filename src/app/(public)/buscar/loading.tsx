export default function SearchLoading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8 h-12 animate-pulse rounded-xl bg-bg-card" />
      <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
        <aside className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 animate-pulse rounded-lg bg-bg-card" />
          ))}
        </aside>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-64 animate-pulse rounded-xl bg-bg-card" />
          ))}
        </div>
      </div>
    </div>
  );
}
