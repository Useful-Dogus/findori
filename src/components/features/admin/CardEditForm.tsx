'use client'

import type { Card } from '@/types/cards'

type CardEditFormProps = {
  card: Card
  disabled?: boolean
  errorMessage?: string | null
  onCancel: () => void
  onChange: (card: Card) => void
  onSave: () => void
}

function baseInputClassName() {
  return 'w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-sky-500'
}

function readOnlyBox(label: string, value: string) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-slate-400">{label}</p>
      <div className="rounded-lg bg-slate-950/60 px-3 py-2 text-sm text-slate-300">{value}</div>
    </div>
  )
}

function getValidationError(card: Card): string | null {
  switch (card.type) {
    case 'cover':
      if (card.title.trim().length === 0) return '제목을 입력해주세요.'
      if (card.sub.trim().length === 0) return '부제를 입력해주세요.'
      return null
    case 'reason':
    case 'bullish':
    case 'bearish':
      if (card.title.trim().length === 0) return '제목을 입력해주세요.'
      if (card.body.trim().length === 0) return '본문을 입력해주세요.'
      return null
    case 'community':
    case 'stats':
      if (card.title.trim().length === 0) return '제목을 입력해주세요.'
      return null
    case 'source':
      return null
    // Phase 2 신규 타입 — Admin 편집 폼은 기존 타입만 지원
    case 'delta':
    case 'delta-intro':
    case 'cause':
    case 'stat':
    case 'compare':
    case 'impact':
    case 'verdict':
    case 'question':
      return null
  }
}

export function CardEditForm({
  card,
  disabled = false,
  errorMessage,
  onCancel,
  onChange,
  onSave,
}: CardEditFormProps) {
  const validationError = getValidationError(card)
  const combinedError = errorMessage ?? validationError

  return (
    <div className="mt-3 space-y-3 rounded-xl border border-slate-700 bg-slate-950/40 p-4">
      <div className="space-y-1">
        <label className="text-xs font-medium text-slate-400" htmlFor={`card-tag-${card.id}`}>
          태그
        </label>
        <input
          id={`card-tag-${card.id}`}
          type="text"
          value={card.tag}
          disabled={disabled}
          onChange={(event) => onChange({ ...card, tag: event.target.value })}
          className={baseInputClassName()}
        />
      </div>

      {'title' in card ? (
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-400" htmlFor={`card-title-${card.id}`}>
            제목
          </label>
          <input
            id={`card-title-${card.id}`}
            type="text"
            value={card.title}
            disabled={disabled}
            onChange={(event) => onChange({ ...card, title: event.target.value })}
            className={baseInputClassName()}
          />
        </div>
      ) : null}

      {card.type === 'cover' ? (
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-400" htmlFor={`card-sub-${card.id}`}>
            부제
          </label>
          <textarea
            id={`card-sub-${card.id}`}
            value={card.sub}
            disabled={disabled}
            onChange={(event) => onChange({ ...card, sub: event.target.value })}
            className={`${baseInputClassName()} min-h-20 resize-y`}
          />
        </div>
      ) : null}

      {card.type === 'reason' || card.type === 'bullish' || card.type === 'bearish' ? (
        <>
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-400" htmlFor={`card-body-${card.id}`}>
              본문
            </label>
            <textarea
              id={`card-body-${card.id}`}
              value={card.body}
              disabled={disabled}
              onChange={(event) => onChange({ ...card, body: event.target.value })}
              className={`${baseInputClassName()} min-h-28 resize-y`}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-400" htmlFor={`card-stat-${card.id}`}>
              보조 수치
            </label>
            <input
              id={`card-stat-${card.id}`}
              type="text"
              value={card.stat ?? ''}
              disabled={disabled}
              onChange={(event) =>
                onChange({
                  ...card,
                  stat: event.target.value.trim().length === 0 ? undefined : event.target.value,
                })
              }
              className={baseInputClassName()}
            />
          </div>
          {readOnlyBox('출처', card.sources.map((source) => source.domain).join(', '))}
        </>
      ) : null}

      {card.type === 'community'
        ? readOnlyBox('인용문', card.quotes.map((quote) => quote.text).join(' / '))
        : null}
      {card.type === 'stats'
        ? readOnlyBox('지표', card.items.map((item) => `${item.label} ${item.value}`).join(' / '))
        : null}
      {card.type === 'source'
        ? readOnlyBox('출처', card.sources.map((source) => source.domain).join(', '))
        : null}

      {combinedError ? (
        <p className="rounded-lg bg-rose-950/40 px-3 py-2 text-sm text-rose-100">{combinedError}</p>
      ) : null}

      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={disabled}
          className="cursor-pointer rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-300 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          취소
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={disabled || validationError !== null}
          className="cursor-pointer rounded-lg bg-sky-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {disabled ? '저장 중...' : '저장'}
        </button>
      </div>
    </div>
  )
}
