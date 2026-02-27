// 카드 스키마 런타임 검증 레이어 — SRS § 4.2 기준
// src/types/cards.ts의 TypeScript 타입 정의 위에 Zod 런타임 검증을 추가합니다.
// src/types/cards.ts는 수정하지 않습니다 (Claude API 스키마 동결).

import { z } from 'zod'

import {
  type Card,
  type CoverCard,
  type ReasonCard,
  type BullishCard,
  type BearishCard,
  type CommunityCard,
  type StatsCard,
  type SourceCard,
  CARD_COUNT_MIN,
  CARD_COUNT_MAX,
} from '@/types/cards'

// ── 공통 서브 스키마 ─────────────────────────────────────────────────────────

// T002: hex 색상 검증 — #RGB 또는 #RRGGBB만 허용 (Tailwind 클래스 금지)
const hexColorSchema = z.string().regex(/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/, {
  message: '유효한 hex 색상값이어야 합니다 (#RGB 또는 #RRGGBB 형식, 예: #0f172a)',
})

// T003: CardVisual 스키마 (4개 hex 필드)
const cardVisualSchema = z.object({
  bg_from: hexColorSchema,
  bg_via: hexColorSchema,
  bg_to: hexColorSchema,
  accent: hexColorSchema,
})

// T004: 서브 엔티티 스키마
const cardSourceSchema = z.object({
  title: z.string(),
  url: z.string(),
  domain: z.string(),
})

const communityQuoteSchema = z.object({
  text: z.string(),
  mood: z.string(),
})

const statsItemSchema = z.object({
  label: z.string(),
  value: z.string(),
  change: z.string().optional(),
})

// ── 카드별 Zod 스키마 ────────────────────────────────────────────────────────

// T005: 7가지 카드 타입 스키마

const coverCardSchema = z.object({
  id: z.number().int(),
  type: z.literal('cover'),
  tag: z.string(),
  title: z.string(),
  sub: z.string(),
  visual: cardVisualSchema,
})

const reasonCardSchema = z.object({
  id: z.number().int(),
  type: z.literal('reason'),
  tag: z.string(),
  title: z.string(),
  body: z.string(),
  stat: z.string().optional(),
  visual: cardVisualSchema,
  sources: z.array(cardSourceSchema).min(1, { message: 'sources는 최소 1개 이상이어야 합니다' }),
})

const bullishCardSchema = z.object({
  id: z.number().int(),
  type: z.literal('bullish'),
  tag: z.string(),
  title: z.string(),
  body: z.string(),
  stat: z.string().optional(),
  visual: cardVisualSchema,
  sources: z.array(cardSourceSchema).min(1, { message: 'sources는 최소 1개 이상이어야 합니다' }),
})

const bearishCardSchema = z.object({
  id: z.number().int(),
  type: z.literal('bearish'),
  tag: z.string(),
  title: z.string(),
  body: z.string(),
  stat: z.string().optional(),
  visual: cardVisualSchema,
  sources: z.array(cardSourceSchema).min(1, { message: 'sources는 최소 1개 이상이어야 합니다' }),
})

const communityCardSchema = z.object({
  id: z.number().int(),
  type: z.literal('community'),
  tag: z.string(),
  title: z.string(),
  quotes: z.array(communityQuoteSchema).min(1, { message: 'quotes는 최소 1개 이상이어야 합니다' }),
  visual: cardVisualSchema,
})

const statsCardSchema = z.object({
  id: z.number().int(),
  type: z.literal('stats'),
  tag: z.string(),
  title: z.string(),
  items: z.array(statsItemSchema),
  visual: cardVisualSchema,
})

const sourceCardSchema = z.object({
  id: z.number().int(),
  type: z.literal('source'),
  tag: z.string(),
  sources: z.array(cardSourceSchema),
  visual: cardVisualSchema,
})

// T006: 통합 카드 스키마 (discriminatedUnion) + 배열 스키마 (순서·개수 제약)

const cardSchema = z.discriminatedUnion('type', [
  coverCardSchema,
  reasonCardSchema,
  bullishCardSchema,
  bearishCardSchema,
  communityCardSchema,
  statsCardSchema,
  sourceCardSchema,
])

const cardsArraySchema = z
  .array(cardSchema)
  .min(CARD_COUNT_MIN, { message: `카드는 최소 ${CARD_COUNT_MIN}장 이상이어야 합니다` })
  .max(CARD_COUNT_MAX, { message: `카드는 최대 ${CARD_COUNT_MAX}장 이하여야 합니다` })
  .refine((cards) => cards.length > 0 && cards[0].type === 'cover', {
    message: '첫 번째 카드는 반드시 cover 타입이어야 합니다',
  })
  .refine((cards) => cards.length > 0 && cards[cards.length - 1].type === 'source', {
    message: '마지막 카드는 반드시 source 타입이어야 합니다',
  })

// ── ParseCardsResult 타입 + parseCards 함수 ──────────────────────────────────

// T007: 검증 결과 타입
export type ParseCardsResult =
  | { success: true; data: Card[] }
  | { success: true; data: null }
  | { success: false; errors: string[] }

/**
 * DB에서 불러온 raw JSON(cards_data)을 검증하여 타입 보장 Card[] 반환.
 * - null 입력 → { success: true, data: null } (에러 없음)
 * - 유효한 배열 → { success: true, data: Card[] }
 * - 위반 시 → { success: false, errors: string[] } (필드 경로 포함)
 */
export function parseCards(json: unknown): ParseCardsResult {
  if (json === null) {
    return { success: true, data: null }
  }

  const result = cardsArraySchema.safeParse(json)
  if (result.success) {
    return { success: true, data: result.data as Card[] }
  }

  const errors = result.error.issues.map((issue) => {
    const path = issue.path.length > 0 ? `${issue.path.join('.')}: ` : ''
    return `${path}${issue.message}`
  })
  return { success: false, errors }
}

// ── 타입 가드 함수 (7가지) ───────────────────────────────────────────────────

// T011: 카드 타입 가드 — 렌더링 코드에서 안전한 타입 분기를 위해 사용

export function isCoverCard(card: Card): card is CoverCard {
  return card.type === 'cover'
}

export function isReasonCard(card: Card): card is ReasonCard {
  return card.type === 'reason'
}

export function isBullishCard(card: Card): card is BullishCard {
  return card.type === 'bullish'
}

export function isBearishCard(card: Card): card is BearishCard {
  return card.type === 'bearish'
}

export function isCommunityCard(card: Card): card is CommunityCard {
  return card.type === 'community'
}

export function isStatsCard(card: Card): card is StatsCard {
  return card.type === 'stats'
}

export function isSourceCard(card: Card): card is SourceCard {
  return card.type === 'source'
}
