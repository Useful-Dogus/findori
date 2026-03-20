'use client'

// TODO(#18): 스와이프 UI 구현 시 스와이프 탐색 추가

import type { PublicIssueSummary } from '@/lib/public/feeds'

import FeedCardStack from './FeedCardStack'

type FeedViewProps = {
  date: string
  issues: PublicIssueSummary[]
  initialIssueId?: string
}

export default function FeedView({ date, issues, initialIssueId }: FeedViewProps) {
  return (
    <div className="flex min-h-screen flex-col pb-10">
      <header className="border-border border-b px-4 py-4">
        <p className="text-muted text-sm">{date}</p>
        <div className="mt-2 flex items-end justify-between gap-4">
          <div>
            <h1 className="text-foreground text-xl font-semibold">오늘의 이슈 카드 스트림</h1>
            <p className="text-muted mt-1 text-sm">이슈 {issues.length}건</p>
          </div>
          <p className="text-muted max-w-44 text-right text-xs leading-5">
            사건, 해석, 시장 반응 흐름으로 정리한 카드 브리핑
          </p>
        </div>
      </header>
      <main className="flex flex-1 flex-col gap-5 p-4">
        {issues.map((issue) => (
          <section
            key={issue.id}
            data-issue-id={issue.id}
            className={[
              'border-border rounded-[32px] border bg-white/3 p-4 shadow-[0_18px_40px_rgba(2,6,23,0.18)] backdrop-blur-sm',
              initialIssueId === issue.id
                ? 'ring-accent-blue ring-2 ring-offset-2 ring-offset-slate-950'
                : '',
            ]
              .join(' ')
              .trim()}
          >
            <div className="mb-4 flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap gap-2">
                  <span className="bg-background/70 text-muted rounded-full px-3 py-1 text-[11px] font-semibold tracking-[0.16em] uppercase">
                    {issue.entityType}
                  </span>
                  {issue.tags.map((tag) => (
                    <span
                      key={tag}
                      className="bg-surface-raised text-muted rounded-full px-3 py-1 text-xs"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <h2 className="text-foreground mt-3 text-xl leading-snug font-semibold">
                  {issue.title}
                </h2>
                <p className="text-muted mt-2 text-sm">
                  {issue.entityName} · 카드 {issue.cardsData?.length ?? 0}장
                </p>
              </div>
              {issue.changeValue && (
                <span
                  className={[
                    'shrink-0 rounded-full px-3 py-1 text-sm font-bold',
                    issue.changeValue.startsWith('-') ? 'text-accent-red' : 'text-accent-green',
                  ].join(' ')}
                >
                  {issue.changeValue}
                </span>
              )}
            </div>
            <FeedCardStack cards={issue.cardsData} />
          </section>
        ))}
      </main>
    </div>
  )
}
