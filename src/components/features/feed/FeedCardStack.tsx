'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties, TouchEvent } from 'react'

import { trackFeedEvent } from '@/lib/analytics'
import { resolveImageUrl } from '@/lib/images/registry'
import FeedSourceLink from '@/components/features/feed/FeedSourceLink'
import type { Card, CardSource, CardVisual } from '@/types/cards'

type FeedCardStackProps = {
  cards: Card[] | null
  entityType?: string
  entityId?: string
}

const KOREAN_COPY_STYLE: CSSProperties = {
  wordBreak: 'keep-all',
}

const BODY_TEXT_CLASS =
  'text-foreground/82 text-sm leading-6 break-keep whitespace-pre-line md:text-base md:leading-7'

const HEADING_TEXT_CLASS =
  'leading-tight font-semibold break-keep whitespace-pre-line md:text-[1.65rem] xl:text-[1.8rem]'

const LABEL_TEXT_CLASS = 'text-[11px] font-medium tracking-[0.14em] text-white/70 uppercase'

function cardStyle(visual: CardVisual, imageUrl: string | null): CSSProperties {
  const gradient = `linear-gradient(160deg, ${visual.bg_from}f2, ${visual.bg_via}d9, ${visual.bg_to})`
  const base: CSSProperties = {
    borderColor: `${visual.accent}55`,
    boxShadow: `inset 0 1px 0 rgba(255,255,255,0.08), 0 18px 40px rgba(15, 23, 42, 0.25)`,
  }
  if (imageUrl) {
    return {
      ...base,
      backgroundImage: `${gradient}, url(${imageUrl})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundBlendMode: 'multiply',
    }
  }
  return {
    ...base,
    backgroundImage: gradient,
  }
}

function progressLabel(index: number, total: number) {
  return `${index + 1}/${total}`
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
          <h3 className="text-2xl font-bold break-keep whitespace-pre-line md:text-3xl xl:text-[2.1rem]">
            {card.title}
          </h3>
          <p className={BODY_TEXT_CLASS} style={KOREAN_COPY_STYLE}>
            {card.sub}
          </p>
        </>
      )
    case 'reason':
    case 'bullish':
    case 'bearish':
      return (
        <>
          <h3 className={`text-xl ${HEADING_TEXT_CLASS}`}>{card.title}</h3>
          <p className={BODY_TEXT_CLASS} style={KOREAN_COPY_STYLE}>
            {card.body}
          </p>
          {card.stat ? (
            <p className="inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-semibold md:text-sm">
              {card.stat}
            </p>
          ) : null}
          <SourceList sources={card.sources} onSourceClick={onSourceClick} />
        </>
      )
    case 'community':
      return (
        <>
          <h3 className={`text-xl ${HEADING_TEXT_CLASS}`}>{card.title}</h3>
          <div className="space-y-3">
            {card.quotes.map((quote, index) => (
              <blockquote
                key={`${quote.text}-${index}`}
                className="rounded-2xl bg-white/8 px-4 py-3 text-sm leading-6 md:text-base md:leading-7"
              >
                <p className="break-keep" style={KOREAN_COPY_STYLE}>
                  {quote.text}
                </p>
                <footer className="text-foreground/65 mt-2 text-xs">{quote.mood}</footer>
              </blockquote>
            ))}
          </div>
        </>
      )
    case 'stats':
      return (
        <>
          <h3 className={`text-xl ${HEADING_TEXT_CLASS}`}>{card.title}</h3>
          <dl className="grid gap-3 sm:grid-cols-2">
            {card.items.map((item) => (
              <div key={`${item.label}-${item.value}`} className="rounded-2xl bg-white/8 px-4 py-3">
                <dt className="text-foreground/65 text-xs">{item.label}</dt>
                <dd className="mt-1 text-lg font-semibold md:text-xl">{item.value}</dd>
                {item.change ? (
                  <dd className="text-foreground/80 mt-1 text-xs break-keep md:text-sm">
                    {item.change}
                  </dd>
                ) : null}
              </div>
            ))}
          </dl>
        </>
      )
    case 'source':
      return (
        <>
          <h3 className={`text-xl ${HEADING_TEXT_CLASS}`}>출처 전체 보기</h3>
          <p className={BODY_TEXT_CLASS} style={KOREAN_COPY_STYLE}>
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
              <p className="text-foreground/60 text-2xl font-black md:text-3xl">{card.before}</p>
            </div>
            <p className="mb-1 text-3xl font-black md:text-4xl" style={{ color: accent }}>
              →
            </p>
            <div className="text-center">
              <p className="mb-1 text-xs font-bold" style={{ color: accent }}>
                {card.period}
              </p>
              <p className="text-3xl font-black text-white md:text-4xl">{card.after}</p>
            </div>
          </div>
          <p className={BODY_TEXT_CLASS} style={KOREAN_COPY_STYLE}>
            {card.context}
          </p>
        </>
      )
    case 'delta-intro':
      return (
        <>
          <div className="flex items-end gap-3">
            <div className="text-center">
              <p className="text-foreground/50 mb-1 text-xs">시가</p>
              <p className="text-foreground/60 text-xl font-black md:text-2xl">{card.before}</p>
            </div>
            <p className="mb-1 text-2xl font-black md:text-3xl" style={{ color: accent }}>
              →
            </p>
            <div className="text-center">
              <p className="mb-1 text-xs font-bold" style={{ color: accent }}>
                {card.period}
              </p>
              <p className="text-2xl font-black text-white md:text-3xl">{card.after}</p>
            </div>
          </div>
          <div className="rounded-xl bg-white/8 px-3 py-2">
            <p className="mb-1 text-xs font-bold" style={{ color: accent }}>
              {card.what}이 뭔가요?
            </p>
            <p className={BODY_TEXT_CLASS} style={KOREAN_COPY_STYLE}>
              {card.whatDesc}
            </p>
          </div>
          <p className={BODY_TEXT_CLASS} style={KOREAN_COPY_STYLE}>
            {card.trigger}
          </p>
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
          <p className={BODY_TEXT_CLASS} style={KOREAN_COPY_STYLE}>
            {card.cause}
          </p>
          <SourceList sources={card.sources} onSourceClick={onSourceClick} />
        </>
      )
    case 'stat':
      return (
        <>
          <p className="text-4xl leading-none font-black" style={{ color: accent }}>
            {card.number}
          </p>
          <p className="text-lg font-bold text-white md:text-xl">{card.label}</p>
          <div className="h-0.5 w-8 rounded" style={{ backgroundColor: accent }} />
          <p className={BODY_TEXT_CLASS} style={KOREAN_COPY_STYLE}>
            {card.reveal}
          </p>
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
          <h3 className="text-lg leading-tight font-semibold break-keep whitespace-pre-line text-white md:text-xl">
            {card.q}
          </h3>
          <div className="flex flex-col gap-2">
            {card.rows.map((row, i) => (
              <div
                key={`${row.label}-${i}`}
                className="flex items-center gap-2 rounded-xl px-3 py-2"
                style={{
                  background: row.dir === 'worst' ? `${accent}18` : 'rgba(255,255,255,0.05)',
                  border: row.dir === 'worst' ? `1px solid ${accent}55` : '1px solid transparent',
                }}
              >
                <span className="w-24 shrink-0 text-sm font-bold text-white md:text-base">
                  {row.label}
                </span>
                <span
                  className="w-16 shrink-0 text-sm font-black md:text-base"
                  style={{ color: dirColor[row.dir] }}
                >
                  {dirIcon[row.dir]} {row.change}
                </span>
                <span className="text-foreground/70 text-xs break-keep md:text-sm">{row.note}</span>
              </div>
            ))}
          </div>
          <p
            className="text-foreground/70 border-t border-white/10 pt-3 text-xs leading-6 break-keep whitespace-pre-line md:text-sm"
            style={KOREAN_COPY_STYLE}
          >
            {card.footer}
          </p>
        </>
      )
    }
    case 'impact':
      return (
        <>
          <h3 className="text-lg font-semibold text-white md:text-xl">
            내 지갑엔 얼마나 영향이 있을까요?
          </h3>
          <div className="flex flex-col gap-3">
            {card.items.map((item, i) => (
              <div key={`${item.label}-${i}`} className="flex items-center gap-2">
                <div className="flex-1">
                  <p className="text-foreground/60 mb-1 text-xs">{item.label}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-foreground/50 text-sm line-through md:text-base">
                      {item.before}
                    </span>
                    <span className="text-sm font-bold text-white md:text-base">{item.after}</span>
                  </div>
                </div>
                <span
                  className="shrink-0 text-xs font-black"
                  style={{
                    color:
                      item.diff === '위험' ? '#ef4444' : item.diff === '주의' ? '#f59e0b' : accent,
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
          <h3 className="text-xl leading-tight font-black break-keep whitespace-pre-line text-white md:text-2xl">
            {card.verdict}
          </h3>
          <div className="flex flex-col gap-2">
            {card.reasons.map((reason, i) => (
              <div key={`${reason}-${i}`} className="flex items-start gap-2">
                <span className="mt-0.5 shrink-0 font-black" style={{ color: accent }}>
                  ·
                </span>
                <span className="text-foreground/75 text-sm leading-6 break-keep md:text-base md:leading-7">
                  {reason}
                </span>
              </div>
            ))}
          </div>
        </>
      )
    case 'question':
      return (
        <>
          <h3 className="text-xl leading-tight font-black break-keep whitespace-pre-line text-white md:text-2xl">
            {card.q}
          </h3>
          <div className="h-px bg-white/10" />
          <p className={BODY_TEXT_CLASS} style={KOREAN_COPY_STYLE}>
            {card.hint}
          </p>
        </>
      )
  }
}

export default function FeedCardStack({ cards, entityType, entityId }: FeedCardStackProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [imageReady, setImageReady] = useState(true)
  const touchStartXRef = useRef<number | null>(null)

  const totalCards = cards?.length ?? 0
  const activeCard = cards?.[activeIndex] ?? null
  const progress = ((activeIndex + 1) / totalCards) * 100
  const activeImageUrl = useMemo(
    () => (activeCard ? resolveImageUrl(activeCard.visual.imgCategory) : null),
    [activeCard],
  )

  useEffect(() => {
    if (!activeCard || !activeImageUrl) {
      setImageReady(true)
      return
    }

    setImageReady(false)

    const preloader = new Image()
    preloader.onload = () => setImageReady(true)
    preloader.onerror = () => setImageReady(true)
    preloader.src = activeImageUrl

    return () => {
      preloader.onload = null
      preloader.onerror = null
    }
  }, [activeCard, activeImageUrl])

  if (!cards || cards.length === 0 || !activeCard) {
    return (
      <div className="border-border bg-surface/60 rounded-[28px] border p-5">
        <p className="text-foreground text-sm font-semibold">카드 데이터를 준비 중입니다.</p>
        <p className="text-muted mt-2 text-sm">운영 검수 후 이 이슈의 카드 스트림이 표시됩니다.</p>
      </div>
    )
  }

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
          <p className="text-muted text-xs font-medium">{progressLabel(activeIndex, totalCards)}</p>
          <p className={LABEL_TEXT_CLASS}>{activeCard.type}</p>
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
          aria-busy={!imageReady}
          className="relative aspect-[4/5] w-full overflow-hidden rounded-[28px] border text-white"
          style={cardStyle(activeCard.visual, activeImageUrl)}
        >
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(2,6,23,0.12),rgba(2,6,23,0.42),rgba(2,6,23,0.72))]" />
          {!imageReady ? (
            <div className="absolute inset-0 flex animate-pulse flex-col justify-end gap-3 px-5 py-6 sm:px-6 sm:py-6 xl:px-8 xl:py-8">
              <div className="h-5 w-24 rounded-full bg-white/10" />
              <div className="h-10 w-4/5 rounded-2xl bg-white/10" />
              <div className="h-4 w-full rounded-full bg-white/8" />
              <div className="h-4 w-3/4 rounded-full bg-white/8" />
            </div>
          ) : null}
          <div
            className={[
              'absolute inset-0 flex flex-col px-5 py-6 transition-opacity duration-200 sm:px-6 sm:py-6 lg:px-7 lg:py-7 xl:px-8 xl:py-8',
              imageReady ? 'opacity-100' : 'opacity-0',
            ].join(' ')}
          >
            <div className="flex min-h-0 flex-1 flex-col space-y-5 lg:space-y-6">
              <div className="flex items-center justify-between gap-3">
                <p className="rounded-full bg-white/12 px-3 py-1 text-[11px] font-semibold tracking-[0.18em] uppercase">
                  {progressLabel(activeIndex, totalCards)}
                </p>
                <p className="rounded-full bg-white/8 px-3 py-1 text-[11px] font-semibold tracking-[0.18em] uppercase">
                  {activeCard.tag}
                </p>
              </div>
              <div className="min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">
                <CardBody card={activeCard} onSourceClick={handleSourceClick} />
              </div>
            </div>
          </div>
        </article>
      </div>
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => moveCard('prev')}
          disabled={activeIndex === 0}
          className="min-h-11 cursor-pointer rounded-full border border-white/12 px-4 py-2 text-sm font-medium text-white/80 transition focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-1 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-40"
        >
          이전 카드
        </button>
        <p className="text-muted text-xs" aria-live="polite">
          {progressLabel(activeIndex, totalCards)}
        </p>
        <button
          type="button"
          onClick={() => moveCard('next')}
          disabled={activeIndex === totalCards - 1}
          className="min-h-11 cursor-pointer rounded-full border border-white/12 px-4 py-2 text-sm font-medium text-white/80 transition focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-1 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-40"
        >
          다음 카드
        </button>
      </div>
    </div>
  )
}
