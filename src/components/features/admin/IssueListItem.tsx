'use client'

import { useState } from 'react'

import type { AdminIssueSummary } from '@/lib/admin/feeds'
import type { Card } from '@/types/cards'

import { CardEditForm } from './CardEditForm'
import { IssueStatusActions } from './IssueStatusActions'
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
    // Phase 2 신규 타입
    case 'delta':
      return `${card.before} → ${card.after} (${card.period})`
    case 'delta-intro':
      return `${card.what}: ${card.before} → ${card.after}`
    case 'cause':
      return card.result
    case 'stat':
      return `${card.number} ${card.label}`
    case 'compare':
      return card.q
    case 'impact':
      return card.items.map((item) => item.label).join(' / ')
    case 'verdict':
      return card.verdict
    case 'question':
      return card.q
  }
}

function canMoveCard(cards: Card[], index: number, direction: -1 | 1) {
  const targetIndex = index + direction

  if (targetIndex < 0 || targetIndex >= cards.length) {
    return false
  }

  const card = cards[index]
  const lastIndex = cards.length - 1

  if (targetIndex === 0 && card.type !== 'cover') {
    return false
  }

  if (targetIndex === lastIndex && card.type !== 'source') {
    return false
  }

  if (card.type === 'cover' && direction === 1) {
    return false
  }

  if (card.type === 'source' && direction === -1) {
    return false
  }

  return true
}

export function IssueListItem({ issue }: IssueListItemProps) {
  const [open, setOpen] = useState(false)
  const [localStatus, setLocalStatus] = useState(issue.status)
  const [isStatusChanging, setIsStatusChanging] = useState(false)
  const [statusError, setStatusError] = useState<string | null>(null)
  const [savedCardsState, setSavedCardsState] = useState<Card[] | null>(issue.cardsData)
  const [cardsState, setCardsState] = useState<Card[] | null>(issue.cardsData)
  const [editingCardId, setEditingCardId] = useState<number | null>(null)
  const [cardDraft, setCardDraft] = useState<Card | null>(null)
  const [isSavingCard, setIsSavingCard] = useState(false)
  const [cardSaveError, setCardSaveError] = useState<string | null>(null)
  const [orderDirty, setOrderDirty] = useState(false)
  const [orderSaveError, setOrderSaveError] = useState<string | null>(null)
  const [orderSaveSuccess, setOrderSaveSuccess] = useState<string | null>(null)

  async function saveCards(nextCards: Card[]) {
    const response = await fetch(`/api/admin/issues/${issue.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cards: nextCards }),
    })

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { message?: string } | null
      throw new Error(payload?.message ?? '저장에 실패했습니다. 다시 시도해주세요.')
    }
  }

  async function handleStatusChange(nextStatus: 'draft' | 'approved' | 'rejected') {
    if (isStatusChanging) {
      return
    }

    const previousStatus = localStatus
    setStatusError(null)
    setLocalStatus(nextStatus)
    setIsStatusChanging(true)

    try {
      const response = await fetch(`/api/admin/issues/${issue.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      })

      if (!response.ok) {
        throw new Error('상태 변경에 실패했습니다. 다시 시도해주세요.')
      }
    } catch (error) {
      setLocalStatus(previousStatus)
      setStatusError(error instanceof Error ? error.message : '상태 변경에 실패했습니다.')
    } finally {
      setIsStatusChanging(false)
    }
  }

  function startEditing(card: Card) {
    setEditingCardId(card.id)
    setCardDraft(card)
    setCardSaveError(null)
    setOrderSaveError(null)
    setOrderSaveSuccess(null)
  }

  function cancelEditing() {
    setEditingCardId(null)
    setCardDraft(null)
    setCardSaveError(null)
  }

  async function handleCardSave() {
    if (!cardDraft || !cardsState || !savedCardsState) {
      return
    }

    const persistedCards = savedCardsState.map((card) =>
      card.id === cardDraft.id ? cardDraft : card,
    )

    setIsSavingCard(true)
    setCardSaveError(null)

    try {
      await saveCards(persistedCards)
      setSavedCardsState(persistedCards)
      setCardsState(
        (currentCards) =>
          currentCards?.map((card) => (card.id === cardDraft.id ? cardDraft : card)) ??
          currentCards,
      )
      setEditingCardId(null)
      setCardDraft(null)
    } catch (error) {
      setCardSaveError(error instanceof Error ? error.message : '저장에 실패했습니다.')
    } finally {
      setIsSavingCard(false)
    }
  }

  function moveCard(index: number, direction: -1 | 1) {
    if (!cardsState) {
      return
    }

    if (!canMoveCard(cardsState, index, direction)) {
      return
    }

    const targetIndex = index + direction
    const nextCards = [...cardsState]
    const [movedCard] = nextCards.splice(index, 1)
    nextCards.splice(targetIndex, 0, movedCard)

    setCardsState(nextCards)
    setOrderDirty(true)
    setOrderSaveError(null)
    setOrderSaveSuccess(null)
  }

  async function handleOrderSave() {
    if (!cardsState || !orderDirty) {
      return
    }

    setOrderSaveError(null)
    setOrderSaveSuccess(null)

    try {
      await saveCards(cardsState)
      setSavedCardsState(cardsState)
      setOrderDirty(false)
      setOrderSaveSuccess('카드 순서를 저장했습니다.')
    } catch (error) {
      setOrderSaveError(error instanceof Error ? error.message : '순서 저장에 실패했습니다.')
    }
  }

  return (
    <li className="bg-surface-raised border-border rounded-2xl border">
      <div className="flex items-start justify-between gap-4 px-5 py-4">
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="min-w-0 flex-1 text-left"
        >
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="text-sm text-slate-400">#{issue.displayOrder}</span>
              <StatusBadge status={localStatus} />
              <span className="rounded-full bg-slate-800 px-2 py-0.5 text-xs text-slate-300">
                {issue.entityType}
              </span>
            </div>
            <h3 className="text-base font-semibold text-slate-50">{issue.title}</h3>
            <p className="text-sm text-slate-300">
              {issue.entityName} · 카드 {issue.cardCount}장
            </p>
          </div>
        </button>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <IssueStatusActions
            currentStatus={localStatus}
            disabled={isStatusChanging}
            onStatusChange={handleStatusChange}
          />
          <span className="pt-1 text-sm text-slate-400">{open ? '접기' : '펼치기'}</span>
        </div>
      </div>

      {open ? (
        <div className="border-border border-t px-5 py-4">
          {statusError ? (
            <p className="mb-3 rounded-xl bg-rose-950/40 px-4 py-3 text-sm text-rose-100">
              {statusError}
            </p>
          ) : null}

          {issue.cardsParseError ? (
            <p className="rounded-xl bg-rose-950/40 px-4 py-3 text-sm text-rose-100">
              카드 데이터를 해석하지 못했습니다. 원본 `cards_data`를 확인해주세요.
            </p>
          ) : null}

          {!issue.cardsParseError && cardsState && cardsState.length > 0 ? (
            <div className="space-y-3">
              {orderDirty ? (
                <div className="flex items-center justify-between rounded-xl border border-slate-700 bg-slate-900/60 px-4 py-3">
                  <p className="text-sm text-slate-300">카드 순서가 변경되었습니다.</p>
                  <button
                    type="button"
                    onClick={handleOrderSave}
                    disabled={isSavingCard}
                    className="rounded-lg bg-sky-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    순서 저장
                  </button>
                </div>
              ) : null}

              {orderSaveError ? (
                <p className="rounded-xl bg-rose-950/40 px-4 py-3 text-sm text-rose-100">
                  {orderSaveError}
                </p>
              ) : null}

              {orderSaveSuccess ? (
                <p className="rounded-xl bg-emerald-950/40 px-4 py-3 text-sm text-emerald-100">
                  {orderSaveSuccess}
                </p>
              ) : null}

              <ul className="space-y-3">
                {cardsState.map((card, index) => {
                  const isEditing = editingCardId === card.id && cardDraft !== null
                  const canMoveUp = canMoveCard(cardsState, index, -1)
                  const canMoveDown = canMoveCard(cardsState, index, 1)

                  return (
                    <li key={card.id} className="rounded-xl bg-slate-900/60 px-4 py-3">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="rounded-full bg-slate-700 px-2 py-0.5 text-xs text-slate-100 uppercase">
                              {card.type}
                            </span>
                            <span className="text-sm font-medium text-slate-200">{card.tag}</span>
                          </div>
                          {'title' in card ? (
                            <p className="mt-2 text-sm font-semibold text-slate-50">{card.title}</p>
                          ) : null}
                          <p className="mt-1 line-clamp-3 text-sm text-slate-300">
                            {getCardSummary(card)}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <button
                            type="button"
                            onClick={() => moveCard(index, -1)}
                            disabled={!canMoveUp || isSavingCard}
                            className="rounded-lg border border-slate-700 px-2 py-1 text-sm text-slate-300 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                            aria-label={`${card.type} 카드를 위로 이동`}
                          >
                            ↑
                          </button>
                          <button
                            type="button"
                            onClick={() => moveCard(index, 1)}
                            disabled={!canMoveDown || isSavingCard}
                            className="rounded-lg border border-slate-700 px-2 py-1 text-sm text-slate-300 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                            aria-label={`${card.type} 카드를 아래로 이동`}
                          >
                            ↓
                          </button>
                          <button
                            type="button"
                            onClick={() => startEditing(card)}
                            disabled={isSavingCard}
                            className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-200 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            편집
                          </button>
                        </div>
                      </div>

                      {isEditing ? (
                        <CardEditForm
                          card={cardDraft}
                          disabled={isSavingCard}
                          errorMessage={cardSaveError}
                          onCancel={cancelEditing}
                          onChange={setCardDraft}
                          onSave={handleCardSave}
                        />
                      ) : null}
                    </li>
                  )
                })}
              </ul>
            </div>
          ) : null}

          {!issue.cardsParseError && (!cardsState || cardsState.length === 0) ? (
            <p className="text-sm text-slate-400">미리보기 가능한 카드 데이터가 없습니다.</p>
          ) : null}
        </div>
      ) : null}
    </li>
  )
}
