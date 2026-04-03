import Link from 'next/link'

import type { AdminFeedSummary } from '@/lib/admin/feeds'

type Props = {
  feeds: AdminFeedSummary[]
}

/**
 * 1일 이상 지난 미발행(draft) 피드가 있을 때 상단에 표시하는 경고 배너.
 * 가장 오래된 미발행 피드로 바로 이동하는 CTA 버튼을 포함한다.
 */
export function DraftFeedAlert({ feeds }: Props) {
  const overdueFeeds = feeds.filter((f) => f.isOverdue)

  if (overdueFeeds.length === 0) return null

  // 오름차순 정렬 후 가장 오래된 항목
  const oldest = [...overdueFeeds].sort((a, b) => a.date.localeCompare(b.date))[0]

  return (
    <div className="rounded-2xl border border-rose-800/50 bg-rose-950/40 px-5 py-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <svg
            className="mt-0.5 h-5 w-5 shrink-0 text-rose-400"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
              clipRule="evenodd"
            />
          </svg>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-rose-200">
              미발행 draft 피드 {overdueFeeds.length}건
            </p>
            <p className="text-xs text-rose-400">
              1일 이상 지난 미발행 피드가 있습니다. 검토 후 발행해주세요.
            </p>
          </div>
        </div>
        <Link
          href={`/admin/feed/${oldest.date}`}
          className="shrink-0 rounded-lg bg-rose-700/60 px-3 py-1.5 text-xs font-medium text-rose-100 transition hover:bg-rose-700/80"
        >
          가장 오래된 피드 검토 ({oldest.date})
        </Link>
      </div>
    </div>
  )
}
