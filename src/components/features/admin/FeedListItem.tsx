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
  const isOverdue = feed.isOverdue

  return (
    <li>
      <Link
        href={`/admin/feed/${feed.date}`}
        className={[
          'flex items-center justify-between gap-4 rounded-2xl border px-5 py-4 transition',
          isOverdue
            ? 'border-rose-800/60 bg-rose-950/30 hover:border-rose-700/70 hover:bg-rose-950/50'
            : 'bg-surface-raised border-border hover:border-slate-500 hover:bg-slate-700/60',
        ].join(' ')}
      >
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span className={['text-lg font-semibold', isOverdue ? 'text-rose-200' : 'text-slate-50'].join(' ')}>
              {feed.date}
            </span>
            <StatusBadge status={feed.status} />
            {isOverdue && (
              <span className="rounded-full bg-rose-900/60 px-2 py-0.5 text-xs font-medium text-rose-300">
                미발행
              </span>
            )}
          </div>
          <p className={['text-sm', isOverdue ? 'text-rose-300/80' : 'text-slate-300'].join(' ')}>
            이슈 {feed.issueCount}건 · {formatPublishedAt(feed.publishedAt)}
          </p>
        </div>
        <span className={['text-sm font-medium', isOverdue ? 'text-rose-400' : 'text-slate-400'].join(' ')}>
          검토 보기
        </span>
      </Link>
    </li>
  )
}
