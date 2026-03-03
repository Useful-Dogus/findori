'use client'

import { useState } from 'react'

import type { AdminIssueSummary } from '@/lib/admin/feeds'
import type { Card } from '@/types/cards'

import { StatusBadge } from './StatusBadge'

type IssueListItemProps = {
  issue: AdminIssueSummary
}

function getCardSummary(card: Card): string {
  switch (card.type) {
    case 'cover':
      return card.sub
    case 'reason':
    case 'bullish':
    case 'bearish':
      return card.body
    case 'community':
      return card.quotes.map((quote) => quote.text).join(' / ')
    case 'stats':
      return card.items.map((item) => `${item.label} ${item.value}`).join(' / ')
    case 'source':
      return card.sources.map((source) => source.domain).join(', ')
  }
}

export function IssueListItem({ issue }: IssueListItemProps) {
  const [open, setOpen] = useState(false)

  return (
    <li className="bg-surface-raised border-border rounded-2xl border">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-start justify-between gap-4 px-5 py-4 text-left"
      >
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-400">#{issue.displayOrder}</span>
            <StatusBadge status={issue.status} />
            <span className="rounded-full bg-slate-800 px-2 py-0.5 text-xs text-slate-300">
              {issue.entityType}
            </span>
          </div>
          <h3 className="text-base font-semibold text-slate-50">{issue.title}</h3>
          <p className="text-sm text-slate-300">
            {issue.entityName} · 카드 {issue.cardCount}장
          </p>
        </div>
        <span className="pt-1 text-sm text-slate-400">{open ? '접기' : '펼치기'}</span>
      </button>

      {open ? (
        <div className="border-border border-t px-5 py-4">
          {issue.cardsParseError ? (
            <p className="rounded-xl bg-rose-950/40 px-4 py-3 text-sm text-rose-100">
              카드 데이터를 해석하지 못했습니다. 원본 `cards_data`를 확인해주세요.
            </p>
          ) : null}

          {!issue.cardsParseError && issue.cardsData && issue.cardsData.length > 0 ? (
            <ul className="space-y-3">
              {issue.cardsData.map((card) => (
                <li key={card.id} className="rounded-xl bg-slate-900/60 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-slate-700 px-2 py-0.5 text-xs text-slate-100 uppercase">
                      {card.type}
                    </span>
                    <span className="text-sm font-medium text-slate-200">{card.tag}</span>
                  </div>
                  {'title' in card ? (
                    <p className="mt-2 text-sm font-semibold text-slate-50">{card.title}</p>
                  ) : null}
                  <p className="mt-1 line-clamp-3 text-sm text-slate-300">{getCardSummary(card)}</p>
                </li>
              ))}
            </ul>
          ) : null}

          {!issue.cardsParseError && (!issue.cardsData || issue.cardsData.length === 0) ? (
            <p className="text-sm text-slate-400">미리보기 가능한 카드 데이터가 없습니다.</p>
          ) : null}
        </div>
      ) : null}
    </li>
  )
}
