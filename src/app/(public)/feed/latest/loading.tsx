export default function FeedLatestLoading() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-border border-b px-4 py-3">
        <div className="bg-surface h-3 w-24 animate-pulse rounded" />
        <div className="bg-surface mt-1 h-2.5 w-16 animate-pulse rounded" />
      </header>
      <main className="flex flex-1 flex-col gap-4 p-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-surface rounded-xl p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="flex flex-1 flex-col gap-2">
                <div className="flex gap-1">
                  <div className="bg-surface-raised h-4 w-14 animate-pulse rounded" />
                  <div className="bg-surface-raised h-4 w-10 animate-pulse rounded" />
                </div>
                <div className="bg-surface-raised h-4 w-3/4 animate-pulse rounded" />
              </div>
              <div className="bg-surface-raised h-5 w-12 animate-pulse rounded" />
            </div>
          </div>
        ))}
      </main>
    </div>
  )
}
