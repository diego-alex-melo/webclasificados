export default function AdLoading() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-4 h-6 w-48 animate-pulse rounded bg-bg-card" />
      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          <div className="aspect-[4/3] animate-pulse rounded-xl bg-bg-card" />
          <div className="h-8 w-3/4 animate-pulse rounded bg-bg-card" />
          <div className="h-40 animate-pulse rounded-lg bg-bg-card" />
        </div>
        <div className="h-64 animate-pulse rounded-xl bg-bg-card" />
      </div>
    </div>
  );
}
