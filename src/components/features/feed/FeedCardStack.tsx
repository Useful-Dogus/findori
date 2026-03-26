'use client'

import { useRef, useState } from 'react'
import type { CSSProperties, TouchEvent } from 'react'

import { trackFeedEvent } from '@/lib/analytics'
import FeedSourceLink from '@/components/features/feed/FeedSourceLink'
import type { Card, CardSource } from '@/types/cards'

type FeedCardStackProps = {
  cards: Card[] | null
  entityType?: string
  entityId?: string
}

function cardStyle(card: Card): CSSProperties {
  return {
    backgroundImage: `linear-gradient(160deg, ${card.visual.bg_from} 0%, ${card.visual.bg_via} 55%, ${card.visual.bg_to} 100%)`,
    borderColor: `${card.visual.accent}55`,
    boxShadow: `inset 0 1px 0 rgba(255,255,255,0.08), 0 18px 40px rgba(15, 23, 42, 0.25)`,
  }
}

function sectionLabel(card: Card, index: number, total: number) {
  return `${index + 1}/${total} · ${card.tag}`
}

function SourceList({
  sources,
  emptyLabel = '출처 확인 중',
  onSourceClick,
}: {
  sources: CardSource[]
  emptyLabel?: string
  onSourceClick?: (source: CardSource) => void
}) {
  if (sources.length === 0) {
    return <p className="text-muted text-xs">{emptyLabel}</p>
  }

  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {sources.map((source) => (
        <FeedSourceLink
          key={`${source.domain}-${source.url}`}
          source={source}
          onClick={() => onSourceClick?.(source)}
        />
      ))}
    </div>
  )
}

function CardBody({
  card,
  onSourceClick,
}: {
  card: Card
  onSourceClick?: (source: CardSource) => void
}) {
  const accent = card.visual.accent
  switch (card.type) {
    case 'cover':
      return (
        <>
          <h3 className="text-2xl leading-tight font-bold whitespace-pre-line">{card.title}</h3>
          <p className="text-foreground/80 text-sm whitespace-pre-line">{card.sub}</p>
        </>
      )
    case 'reason':
    case 'bullish':
    case 'bearish':
      return (
        <>
          <h3 className="text-xl leading-tight font-semibold whitespace-pre-line">{card.title}</h3>
          <p className="text-foreground/85 text-sm leading-6 whitespace-pre-line">{card.body}</p>
          {card.stat ? (
            <p className="inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-semibold">
              {card.stat}
            </p>
          ) : null}
          <SourceList sources={card.sources} onSourceClick={onSourceClick} />
        </>
      )
    case 'community':
      return (
        <>
          <h3 className="text-xl leading-tight font-semibold whitespace-pre-line">{card.title}</h3>
          <div className="space-y-3">
            {card.quotes.map((quote, index) => (
              <blockquote
                key={`${quote.text}-${index}`}
                className="rounded-2xl bg-white/8 px-4 py-3 text-sm leading-6"
              >
                <p>{quote.text}</p>
                <footer className="text-foreground/65 mt-2 text-xs">{quote.mood}</footer>
              </blockquote>
            ))}
          </div>
        </>
      )
    case 'stats':
      return (
        <>
          <h3 className="text-xl leading-tight font-semibold whitespace-pre-line">{card.title}</h3>
          <dl className="grid gap-3 sm:grid-cols-2">
            {card.items.map((item) => (
              <div key={`${item.label}-${item.value}`} className="rounded-2xl bg-white/8 px-4 py-3">
                <dt className="text-foreground/65 text-xs">{item.label}</dt>
                <dd className="mt-1 text-lg font-semibold">{item.value}</dd>
                {item.change ? (
                  <dd className="text-foreground/80 mt-1 text-xs">{item.change}</dd>
                ) : null}
              </div>
            ))}
          </dl>
        </>
      )
    case 'source':
      return (
        <>
          <h3 className="text-xl leading-tight font-semibold">출처 전체 보기</h3>
          <p className="text-foreground/80 text-sm leading-6">
            아래 링크에서 원문을 확인할 수 있습니다.
          </p>
          <SourceList
            sources={card.sources}
            emptyLabel="출처가 아직 연결되지 않았습니다. 운영 화면에서 보완이 필요합니다."
            onSourceClick={onSourceClick}
          />
        </>
      )
    // ── Phase 2 신규 카드 타입 렌더러 ─────────────────────────────────────────
    case 'delta':
      return (
        <>
          <div className="flex items-end gap-3">
            <div className="text-center">
              <p className="text-foreground/50 mb-1 text-xs">전</p>
              <p className="text-foreground/60 text-2xl font-black">{card.before}</p>
            </div>
            <p className="mb-1 text-3xl font-black" style={{ color: accent }}>
              →
            </p>
            <div className="text-center">
              <p className="mb-1 text-xs font-bold" style={{ color: accent }}>
                {card.period}
              </p>
              <p className="text-3xl font-black text-white">{card.after}</p>
            </div>
          </div>
          <p className="text-foreground/75 text-sm leading-6 whitespace-pre-line">{card.context}</p>
        </>
      )
    case 'delta-intro':
      return (
        <>
          <div className="flex items-end gap-3">
            <div className="text-center">
              <p className="text-foreground/50 mb-1 text-xs">시가</p>
              <p className="text-foreground/60 text-xl font-black">{card.before}</p>
            </div>
            <p className="mb-1 text-2xl font-black" style={{ color: accent }}>
              →
            </p>
            <div className="text-center">
              <p className="mb-1 text-xs font-bold" style={{ color: accent }}>
                {card.period}
              </p>
              <p className="text-2xl font-black text-white">{card.after}</p>
            </div>
          </div>
          <div className="rounded-xl bg-white/8 px-3 py-2">
            <p className="mb-1 text-xs font-bold" style={{ color: accent }}>
              {card.what}이 뭔가요?
            </p>
            <p className="text-foreground/80 text-sm leading-6">{card.whatDesc}</p>
          </div>
          <p className="text-foreground/70 text-sm leading-6">{card.trigger}</p>
        </>
      )
    case 'cause':
      return (
        <>
          <div
            className="inline-block rounded-lg px-3 py-1.5 text-sm font-black text-black"
            style={{ backgroundColor: accent }}
          >
            {card.result}
          </div>
          <p className="text-foreground/82 text-sm leading-6 whitespace-pre-line">{card.cause}</p>
          <SourceList sources={card.sources} onSourceClick={onSourceClick} />
        </>
      )
    case 'stat':
      return (
        <>
          <p className="text-4xl font-black leading-none" style={{ color: accent }}>
            {card.number}
          </p>
          <p className="text-lg font-bold text-white">{card.label}</p>
          <div className="h-0.5 w-8 rounded" style={{ backgroundColor: accent }} />
          <p className="text-foreground/78 text-sm leading-6 whitespace-pre-line">{card.reveal}</p>
          <SourceList sources={card.sources} onSourceClick={onSourceClick} />
        </>
      )
    case 'compare': {
      const dirIcon: Record<string, string> = { up: '↑', down: '↓', worst: '↓↓' }
      const dirColor: Record<string, string> = {
        up: '#22c55e',
        down: '#f87171',
        worst: '#ef4444',
      }
      return (
        <>
          <h3 className="text-lg font-semibold leading-tight text-white whitespace-pre-line">
            {card.q}
          </h3>
          <div className="flex flex-col gap-2">
            {card.rows.map((row, i) => (
              <div
                key={`${row.label}-${i}`}
                className="flex items-center gap-2 rounded-xl px-3 py-2"
                style={{
                  background:
                    row.dir === 'worst' ? `${accent}18` : 'rgba(255,255,255,0.05)',
                  border:
                    row.dir === 'worst' ? `1px solid ${accent}55` : '1px solid transparent',
                }}
              >
                <span className="w-24 shrink-0 text-sm font-bold text-white">{row.label}</span>
                <span
                  className="w-16 shrink-0 text-sm font-black"
                  style={{ color: dirColor[row.dir] }}
                >
                  {dirIcon[row.dir]} {row.change}
                </span>
                <span className="text-foreground/70 text-xs">{row.note}</span>
              </div>
            ))}
          </div>
          <p className="text-foreground/70 border-t border-white/10 pt-3 text-xs leading-6 whitespace-pre-line">
            {card.footer}
          </p>
        </>
      )
    }
    case 'impact':
      return (
        <>
          <h3 className="text-lg font-semibold text-white">내 지갑엔 얼마나 영향이 있을까요?</h3>
          <div className="flex flex-col gap-3">
            {card.items.map((item, i) => (
              <div key={`${item.label}-${i}`} className="flex items-center gap-2">
                <div className="flex-1">
                  <p className="text-foreground/60 mb-1 text-xs">{item.label}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-foreground/50 text-sm line-through">{item.before}</span>
                    <span className="text-sm font-bold text-white">{item.after}</span>
                  </div>
                </div>
                <span
                  className="shrink-0 text-xs font-black"
                  style={{
                    color:
                      item.diff === '위험'
                        ? '#ef4444'
                        : item.diff === '주의'
                          ? '#f59e0b'
                          : accent,
                  }}
                >
                  {item.diff}
                </span>
              </div>
            ))}
          </div>
        </>
      )
    case 'verdict':
      return (
        <>
          <h3 className="text-xl font-black leading-tight text-white whitespace-pre-line">
            {card.verdict}
          </h3>
          <div className="flex flex-col gap-2">
            {card.reasons.map((reason, i) => (
              <div key={`${reason}-${i}`} className="flex items-start gap-2">
                <span className="mt-0.5 shrink-0 font-black" style={{ color: accent }}>
                  ·
                </span>
                <span className="text-foreground/75 text-sm leading-6">{reason}</span>
              </div>
            ))}
          </div>
        </>
      )
    case 'question':
      return (
        <>
          <h3 className="text-xl font-black leading-tight text-white whitespace-pre-line">
            {card.q}
          </h3>
          <div className="h-px bg-white/10" />
          <p className="text-foreground/70 text-sm leading-6 whitespace-pre-line">{card.hint}</p>
        </>
      )
  }
}

export default function FeedCardStack({ cards, entityType, entityId }: FeedCardStackProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const touchStartXRef = useRef<number | null>(null)

  if (!cards || cards.length === 0) {
    return (
      <div className="border-border bg-surface/60 rounded-[28px] border p-5">
        <p className="text-foreground text-sm font-semibold">카드 데이터를 준비 중입니다.</p>
        <p className="text-muted mt-2 text-sm">운영 검수 후 이 이슈의 카드 스트림이 표시됩니다.</p>
      </div>
    )
  }

  const activeCard = cards[activeIndex]
  const totalCards = cards.length
  const progress = ((activeIndex + 1) / totalCards) * 100

  function moveCard(direction: 'prev' | 'next') {
    setActiveIndex((current) => {
      const nextIndex =
        direction === 'prev' ? Math.max(0, current - 1) : Math.min(totalCards - 1, current + 1)

      if (nextIndex !== current) {
        trackFeedEvent({
          event: 'card_swiped',
          entityType,
          entityId,
          cardIndex: nextIndex + 1,
          totalCards,
          isLoggedIn: false,
        })
      }

      return nextIndex
    })
  }

  function handleSourceClick(source: CardSource) {
    trackFeedEvent({
      event: 'source_clicked',
      entityType,
      entityId,
      cardIndex: activeIndex + 1,
      totalCards,
      url: source.url,
      isLoggedIn: false,
    })
  }

  function handleTouchStart(event: TouchEvent<HTMLDivElement>) {
    touchStartXRef.current = event.changedTouches[0]?.clientX ?? null
  }

  function handleTouchEnd(event: TouchEvent<HTMLDivElement>) {
    if (touchStartXRef.current === null) {
      return
    }

    const endX = event.changedTouches[0]?.clientX ?? touchStartXRef.current
    const deltaX = endX - touchStartXRef.current
    touchStartXRef.current = null

    if (Math.abs(deltaX) < 40) {
      return
    }

    if (deltaX < 0) {
      moveCard('next')
      return
    }

    moveCard('prev')
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <p className="text-muted text-xs">좌우로 넘기거나 버튼으로 카드를 이동하세요.</p>
          <p className="text-muted text-xs font-medium">
            {activeIndex + 1}/{totalCards}
          </p>
        </div>
        <div
          aria-hidden="true"
          className="h-1.5 overflow-hidden rounded-full bg-white/10"
          role="progressbar"
          aria-valuemin={1}
          aria-valuemax={totalCards}
          aria-valuenow={activeIndex + 1}
        >
          <div
            className="h-full rounded-full bg-white/80 transition-[width] duration-200 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
      <div
        data-testid="feed-card-swipe"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <article
          key={activeCard.id}
          className="overflow-hidden rounded-[28px] border px-4 py-5 text-white sm:px-6 sm:py-6"
          style={cardStyle(activeCard)}
        >
          <div className="space-y-5">
            <div className="flex items-center justify-between gap-3">
              <p className="rounded-full bg-white/12 px-3 py-1 text-[11px] font-semibold tracking-[0.18em] uppercase">
                {sectionLabel(activeCard, activeIndex, totalCards)}
              </p>
              <p className="text-[11px] font-medium tracking-[0.14em] text-white/70 uppercase">
                {activeCard.type}
              </p>
            </div>
            <div className="space-y-4">
              <CardBody card={activeCard} onSourceClick={handleSourceClick} />
            </div>
          </div>
        </article>
      </div>
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => moveCard('prev')}
          disabled={activeIndex === 0}
          className="min-h-11 rounded-full border border-white/12 px-4 py-2 text-sm font-medium text-white/80 transition focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-1 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-40"
        >
          이전 카드
        </button>
        <p className="text-muted text-xs" aria-live="polite">
          {sectionLabel(activeCard, activeIndex, totalCards)}
        </p>
        <button
          type="button"
          onClick={() => moveCard('next')}
          disabled={activeIndex === totalCards - 1}
          className="min-h-11 rounded-full border border-white/12 px-4 py-2 text-sm font-medium text-white/80 transition focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-1 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-40"
        >
          다음 카드
        </button>
      </div>
    </div>
  )
}
