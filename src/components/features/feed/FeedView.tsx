'use client'

// TODO(#17): 카드 렌더러 구현 시 실제 카드 UI로 교체
// TODO(#18): 스와이프 UI 구현 시 스와이프 탐색 추가

import type { PublicIssueSummary } from '@/lib/public/feeds'

type FeedViewProps = {
  date: string
  issues: PublicIssueSummary[]
  initialIssueId?: string
}

export default function FeedView({ date, issues, initialIssueId }: FeedViewProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-border border-b px-4 py-3">
        <p className="text-muted text-sm">{date}</p>
        <p className="text-foreground text-xs">이슈 {issues.length}건</p>
      </header>
      <main className="flex flex-1 flex-col gap-4 p-4">
        {issues.map((issue) => (
          <div
            key={issue.id}
            data-issue-id={issue.id}
            className={[
              'bg-surface rounded-xl p-4',
              initialIssueId === issue.id ? 'ring-accent-blue ring-2' : '',
            ]
              .join(' ')
              .trim()}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex flex-col gap-1">
                <div className="flex flex-wrap gap-1">
                  {issue.tags.map((tag) => (
                    <span
                      key={tag}
                      className="bg-surface-raised text-muted rounded px-2 py-0.5 text-xs"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <h2 className="text-foreground text-sm leading-snug font-semibold">
                  {issue.title}
                </h2>
              </div>
              {issue.changeValue && (
                <span
                  className={[
                    'shrink-0 text-sm font-bold',
                    issue.changeValue.startsWith('-') ? 'text-accent-red' : 'text-accent-green',
                  ].join(' ')}
                >
                  {issue.changeValue}
                </span>
              )}
            </div>
          </div>
        ))}
      </main>
    </div>
  )
}
