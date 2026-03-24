'use client'

// TODO(#18): 스와이프 UI 구현 시 스와이프 탐색 추가

import Link from 'next/link'
import { useEffect } from 'react'

import FeedSourceLink from '@/components/features/feed/FeedSourceLink'
import { trackFeedEvent } from '@/lib/analytics'
import type { PublicIssueSummary } from '@/lib/public/feeds'
import type { CardSource } from '@/types/cards'

import FeedCardStack from './FeedCardStack'
import FeedShareButton from './FeedShareButton'

type FeedViewProps = {
  date: string
  issues: PublicIssueSummary[]
  initialIssueId?: string
  previousDate?: string | null
}

const CONTEXT_SLOTS = [
  { entityId: 'KOSPI', entityName: '코스피', entityType: 'index' as const },
  { entityId: 'NASDAQ', entityName: '나스닥', entityType: 'index' as const },
  { entityId: 'USD-KRW', entityName: 'USD/KRW', entityType: 'fx' as const },
] as const

function getContextSummary(issue: PublicIssueSummary | null): {
  summary: string
  source: CardSource | null
} {
  if (!issue?.cardsData || issue.cardsData.length === 0) {
    return {
      summary: '당일 변동 요약을 준비 중입니다. 데이터 수급이 완료되면 업데이트됩니다.',
      source: null,
    }
  }

  const explanationCard = issue.cardsData.find(
    (card) =>
      card.type === 'reason' ||
      card.type === 'bullish' ||
      card.type === 'bearish' ||
      card.type === 'cover',
  )

  if (!explanationCard) {
    return {
      summary: '당일 변동 요약을 준비 중입니다. 데이터 수급이 완료되면 업데이트됩니다.',
      source: null,
    }
  }

  if (explanationCard.type === 'cover') {
    return {
      summary: explanationCard.sub ?? '당일 변동 요약을 준비 중입니다.',
      source: null,
    }
  }

  return {
    summary: explanationCard.body,
    source: explanationCard.sources[0] ?? null,
  }
}

export default function FeedView({ date, issues, initialIssueId, previousDate }: FeedViewProps) {
  const origin = typeof window === 'undefined' ? 'https://findori.app' : window.location.origin
  const openedIssue =
    issues.find((issue) => issue.id === initialIssueId) ??
    issues.find((issue) => issue.entityType === 'stock') ??
    issues[0]

  useEffect(() => {
    if (!openedIssue) {
      return
    }

    trackFeedEvent({
      event: 'feed_opened',
      entityType: openedIssue.entityType,
      entityId: openedIssue.entityId,
      cardIndex: 1,
      totalCards: openedIssue.cardsData?.length ?? 0,
      isLoggedIn: false,
    })
  }, [openedIssue])

  const contextIssues = CONTEXT_SLOTS.map((slot) => {
    const issue =
      issues.find((candidate) => candidate.entityId === slot.entityId) ??
      issues.find(
        (candidate) =>
          candidate.entityName === slot.entityName && candidate.entityType === slot.entityType,
      ) ??
      null

    return {
      ...slot,
      issue,
      ...getContextSummary(issue),
    }
  })

  return (
    <div className="flex min-h-screen flex-col pb-10">
      <header className="border-border border-b px-4 py-4">
        <p className="text-muted text-sm">{date}</p>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-foreground text-xl font-semibold">오늘의 이슈 카드 스트림</h1>
            <p className="text-muted mt-1 text-sm">이슈 {issues.length}건</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <p className="text-muted max-w-44 text-right text-xs leading-5">
              사건, 해석, 시장 반응 흐름으로 정리한 카드 브리핑
            </p>
            <div className="flex flex-wrap justify-end gap-2 text-xs">
              {previousDate ? (
                <Link
                  href={`/feed/${previousDate}`}
                  className="rounded-full border border-white/12 px-3 py-1.5 text-white/75 transition hover:border-white/30 hover:text-white"
                >
                  이전 발행일
                </Link>
              ) : null}
              <Link
                href="/feed/latest"
                className="rounded-full border border-white/12 px-3 py-1.5 text-white/75 transition hover:border-white/30 hover:text-white"
              >
                최신 피드
              </Link>
            </div>
          </div>
        </div>
      </header>
      <main className="flex flex-1 flex-col gap-5 p-4">
        <section className="rounded-[32px] border border-white/10 bg-[linear-gradient(160deg,rgba(15,23,42,0.96),rgba(17,24,39,0.92),rgba(3,7,18,0.98))] p-5 shadow-[0_18px_40px_rgba(2,6,23,0.24)]">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[11px] font-semibold tracking-[0.22em] text-cyan-200 uppercase">
                Market Context
              </p>
              <h2 className="mt-2 text-xl font-semibold text-white">대표 지수·환율 맥락 카드</h2>
            </div>
            <p className="max-w-full text-sm leading-6 text-slate-300 sm:max-w-xl">
              코스피, 나스닥, USD/KRW 흐름을 먼저 확인하고 개별 이슈 카드로 내려가세요.
            </p>
          </div>
          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {contextIssues.map((item) => (
              <article
                key={item.entityId}
                className="rounded-[28px] border border-white/12 bg-white/[0.04] p-4 text-white backdrop-blur-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-semibold tracking-[0.2em] text-white/55 uppercase">
                      {item.entityType}
                    </p>
                    <h3 className="mt-2 text-lg font-semibold">{item.entityName}</h3>
                  </div>
                  <span
                    className={[
                      'rounded-full px-3 py-1 text-sm font-bold',
                      item.issue?.changeValue?.startsWith('-')
                        ? 'bg-cyan-400/10 text-cyan-200'
                        : 'bg-emerald-400/10 text-emerald-200',
                    ].join(' ')}
                  >
                    {item.issue?.changeValue
                      ? (item.issue.changeValue.startsWith('-') ? '▼ ' : '▲ ') +
                        item.issue.changeValue
                      : '업데이트 지연'}
                  </span>
                </div>
                <p className="mt-4 line-clamp-3 text-sm leading-6 text-slate-200">{item.summary}</p>
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  {item.source ? (
                    <FeedSourceLink
                      source={item.source}
                      onClick={() =>
                        trackFeedEvent({
                          event: 'source_clicked',
                          entityType: item.entityType,
                          entityId: item.entityId,
                          url: item.source!.url,
                          isLoggedIn: false,
                        })
                      }
                    />
                  ) : (
                    <span className="rounded-full border border-dashed border-white/15 px-3 py-2 text-xs text-white/60">
                      출처 확인 후 업데이트
                    </span>
                  )}
                  {item.issue ? (
                    <a
                      href={`#issue-${item.issue.id}`}
                      className="rounded-full border border-white/12 px-3 py-2 text-xs font-medium text-white/75 transition hover:border-white/30 hover:text-white"
                    >
                      이슈 카드 보기
                    </a>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        </section>
        {issues.map((issue) => (
          <section
            key={issue.id}
            id={`issue-${issue.id}`}
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
                  {(issue.tags.length > 0 ? issue.tags : ['기타']).map((tag) => (
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
              <div className="flex shrink-0 flex-col items-end gap-3">
                {issue.changeValue && (
                  <span
                    className={[
                      'rounded-full px-3 py-1 text-sm font-bold',
                      issue.changeValue.startsWith('-') ? 'text-accent-red' : 'text-accent-green',
                    ].join(' ')}
                  >
                    {(issue.changeValue.startsWith('-') ? '▼ ' : '▲ ') + issue.changeValue}
                  </span>
                )}
                <FeedShareButton
                  permalink={`${origin}/feed/${date}/issue/${issue.id}`}
                  title={issue.title}
                  summary={`${issue.entityName} 이슈 카드 스트림`}
                  entityType={issue.entityType}
                  entityId={issue.entityId}
                />
              </div>
            </div>
            <FeedCardStack
              cards={issue.cardsData}
              entityType={issue.entityType}
              entityId={issue.entityId}
            />
          </section>
        ))}
      </main>
    </div>
  )
}
