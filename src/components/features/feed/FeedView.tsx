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

type ContextIssueSummary = {
  entityId: string
  entityName: string
  entityType: 'index' | 'fx'
  issue: PublicIssueSummary | null
  summary: string
  source: CardSource | null
  isRenderable: boolean
}

const CONTEXT_SLOTS = [
  { entityId: 'KOSPI', entityName: '코스피', entityType: 'index' as const },
  { entityId: 'NASDAQ', entityName: '나스닥', entityType: 'index' as const },
  { entityId: 'USD-KRW', entityName: 'USD/KRW', entityType: 'fx' as const },
] as const

function getContextSummary(issue: PublicIssueSummary | null): {
  summary: string
  source: CardSource | null
  isRenderable: boolean
} {
  if (!issue?.cardsData || issue.cardsData.length === 0) {
    return {
      summary: '',
      source: null,
      isRenderable: false,
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
      summary: '',
      source: null,
      isRenderable: false,
    }
  }

  if (explanationCard.type === 'cover') {
    return {
      summary: explanationCard.sub ?? '당일 변동 요약을 준비 중입니다.',
      source: null,
      isRenderable: true,
    }
  }

  return {
    summary: explanationCard.body,
    source: explanationCard.sources[0] ?? null,
    isRenderable: true,
  }
}

function getVisibleTags(tags: string[]) {
  return tags.filter((tag) => tag.trim().length > 0 && tag !== '기타').slice(0, 1)
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

  const contextIssues: ContextIssueSummary[] = CONTEXT_SLOTS.map((slot) => {
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
  }).filter((item) => item.isRenderable)

  return (
    <div className="flex min-h-screen flex-col pb-10">
      <header className="border-border border-b px-4 py-4 sm:py-5">
        <p className="text-muted text-sm">{date}</p>
        <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-foreground text-xl font-semibold sm:text-2xl">
              오늘의 이슈 카드 스트림
            </h1>
            <p className="text-muted mt-1 text-sm">이슈 {issues.length}건</p>
          </div>
          <div className="flex w-full flex-wrap gap-2 text-xs sm:w-auto sm:justify-end">
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
      </header>
      <main className="flex flex-1 flex-col items-center gap-12 px-4 py-6 sm:gap-16 sm:px-6">
        {contextIssues.length > 0 ? (
          <section className="rounded-[32px] border border-white/10 bg-[linear-gradient(160deg,rgba(15,23,42,0.96),rgba(17,24,39,0.92),rgba(3,7,18,0.98))] p-5 shadow-[0_18px_40px_rgba(2,6,23,0.24)]">
            <div className="flex flex-col gap-2">
              <p className="text-[11px] font-semibold tracking-[0.22em] text-cyan-200 uppercase">
                Market Context
              </p>
              <h2 className="text-lg font-semibold text-white sm:text-xl">대표 지수·환율</h2>
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
                      {(item.issue?.changeValue?.startsWith('-') ? '▼ ' : '▲ ') +
                        (item.issue?.changeValue ?? '')}
                    </span>
                  </div>
                  <p className="mt-4 text-sm leading-6 break-keep text-slate-200">{item.summary}</p>
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
                    ) : null}
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
        ) : null}
        {issues.map((issue) => (
          <section
            key={issue.id}
            id={`issue-${issue.id}`}
            data-issue-id={issue.id}
            className="w-full max-w-2xl"
          >
            <div
              className={[
                'rounded-[28px]',
                initialIssueId === issue.id
                  ? 'ring-accent-blue ring-2 ring-offset-2 ring-offset-slate-950'
                  : '',
              ]
                .join(' ')
                .trim()}
            >
              <FeedCardStack
                cards={issue.cardsData}
                entityType={issue.entityType}
                entityId={issue.entityId}
              />
            </div>
            <div className="mt-3 flex items-start justify-between gap-3 px-1">
              <div className="min-w-0 flex-1">
                <p className="text-muted text-xs sm:text-sm">{issue.entityName}</p>
                <h2 className="text-foreground mt-1 text-sm leading-snug font-medium break-keep sm:text-base">
                  {issue.title}
                </h2>
                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                  {issue.changeValue ? (
                    <span
                      className={[
                        'text-xs font-bold sm:text-sm',
                        issue.changeValue.startsWith('-')
                          ? 'text-accent-red'
                          : 'text-accent-green',
                      ].join(' ')}
                    >
                      {(issue.changeValue.startsWith('-') ? '▼ ' : '▲ ') + issue.changeValue}
                    </span>
                  ) : null}
                  <span className="text-muted text-[11px] tracking-[0.14em] uppercase">
                    {issue.entityType}
                  </span>
                  {getVisibleTags(issue.tags).map((tag) => (
                    <span
                      key={tag}
                      className="bg-surface-raised text-muted rounded-full px-2 py-0.5 text-xs"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <div className="mt-0.5 shrink-0">
                <FeedShareButton
                  permalink={`${origin}/feed/${date}/issue/${issue.id}`}
                  title={issue.title}
                  summary={`${issue.entityName} 이슈 카드 스트림`}
                  entityType={issue.entityType}
                  entityId={issue.entityId}
                />
              </div>
            </div>
          </section>
        ))}
      </main>
    </div>
  )
}
