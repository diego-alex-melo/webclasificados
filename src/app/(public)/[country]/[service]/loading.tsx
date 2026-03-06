export default function CountryServiceLoading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 h-8 w-64 animate-pulse rounded bg-bg-card" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-64 animate-pulse rounded-xl bg-bg-card" />
        ))}
      </div>
    </div>
  );
}
