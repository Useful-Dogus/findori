import Link from 'next/link'

import type { AdminFeedSummary } from '@/lib/admin/feeds'

import { StatusBadge } from './StatusBadge'

type FeedListItemProps = {
  feed: AdminFeedSummary
}

function formatPublishedAt(value: string | null): string {
  if (!value) {
    return '미발행'
  }

  return new Intl.DateTimeFormat('ko-KR', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Seoul',
  }).format(new Date(value))
}

export function FeedListItem({ feed }: FeedListItemProps) {
  return (
    <li>
      <Link
        href={`/admin/feed/${feed.date}`}
        className="bg-surface-raised border-border flex items-center justify-between gap-4 rounded-2xl border px-5 py-4 transition hover:border-slate-500 hover:bg-slate-700/60"
      >
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="text-lg font-semibold text-slate-50">{feed.date}</span>
            <StatusBadge status={feed.status} />
          </div>
          <p className="text-sm text-slate-300">
            이슈 {feed.issueCount}건 · {formatPublishedAt(feed.publishedAt)}
          </p>
        </div>
        <span className="text-sm font-medium text-slate-400">검토 보기</span>
      </Link>
    </li>
  )
}
