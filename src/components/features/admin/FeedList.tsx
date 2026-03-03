import type { AdminFeedSummary } from '@/lib/admin/feeds'

import { FeedListItem } from './FeedListItem'

type FeedListProps = {
  feeds: AdminFeedSummary[]
}

export function FeedList({ feeds }: FeedListProps) {
  if (feeds.length === 0) {
    return (
      <div className="bg-surface-raised border-border rounded-2xl border px-5 py-8 text-center text-sm text-slate-300">
        아직 생성된 피드가 없습니다.
      </div>
    )
  }

  return (
    <ul className="space-y-3">
      {feeds.map((feed) => (
        <FeedListItem key={feed.id} feed={feed} />
      ))}
    </ul>
  )
}
