import { describe, it, expect } from 'vitest'

import {
  parseCards,
  isCoverCard,
  isReasonCard,
  isBullishCard,
  isBearishCard,
  isCommunityCard,
  isStatsCard,
  isSourceCard,
  type ParseCardsResult,
} from '@/lib/cards'
import type { Card } from '@/types/cards'

// ── 공통 픽스처 ──────────────────────────────────────────────────────────────

const validVisual = {
  bg_from: '#0f172a',
  bg_via: '#1e3a5f',
  bg_to: '#0f172a',
  accent: '#3B82F6',
}

const validSource = { title: '기사 제목', url: 'https://example.com', domain: 'example.com' }

const coverCard = {
  id: 1,
  type: 'cover' as const,
  tag: '속보',
  title: '삼성전자 +6.9% 급등',
  sub: '신고가 돌파 · 2026.02.27',
  visual: validVisual,
}

const reasonCard = {
  id: 2,
  type: 'reason' as const,
  tag: '원인 ①',
  title: '엔비디아가 불을 질렀다',
  body: '분기 매출 681억 달러 발표',
  visual: validVisual,
  sources: [validSource],
}

const bullishCard = {
  id: 3,
  type: 'bullish' as const,
  tag: '상승 논거',
  title: 'AI 수요 급증',
  body: 'HBM 공급 계약 확대',
  visual: validVisual,
  sources: [validSource],
}

const bearishCard = {
  id: 4,
  type: 'bearish' as const,
  tag: '리스크',
  title: '중국 규제 우려',
  body: '반도체 수출 제한 확대',
  visual: validVisual,
  sources: [validSource],
}

const communityCard = {
  id: 5,
  type: 'community' as const,
  tag: '커뮤니티 반응',
  title: '디씨 분위기는?',
  quotes: [{ text: '아직도 싼 거 아님?', mood: '🔥' }],
  visual: validVisual,
}

const statsCard = {
  id: 6,
  type: 'stats' as const,
  tag: '수치',
  title: '주요 지표',
  items: [{ label: '등락률', value: '+6.9%' }],
  visual: validVisual,
}

const sourceCard = {
  id: 7,
  type: 'source' as const,
  tag: '출처',
  sources: [validSource],
  visual: validVisual,
}

/** 3장 최소 유효 배열 */
const minValidCards = [coverCard, reasonCard, sourceCard]

/** 7장 최대 유효 배열 */
const maxValidCards = [
  coverCard,
  reasonCard,
  bullishCard,
  bearishCard,
  communityCard,
  statsCard,
  sourceCard,
]

// ── T008: parseCards 유효 케이스 ─────────────────────────────────────────────

describe('parseCards — 유효 케이스', () => {
  it('null 입력 시 { success: true, data: null } 반환', () => {
    const result = parseCards(null)
    expect(result.success).toBe(true)
    if (result.success) expect(result.data).toBeNull()
  })

  it('3장 최소 유효 배열 → success true, Card[] 반환', () => {
    const result = parseCards(minValidCards)
    expect(result.success).toBe(true)
    if (result.success && result.data !== null) {
      expect(result.data).toHaveLength(3)
      expect(result.data[0].type).toBe('cover')
    }
  })

  it('7장 최대 유효 배열 → success true, Card[] 반환', () => {
    const result = parseCards(maxValidCards)
    expect(result.success).toBe(true)
    if (result.success && result.data !== null) {
      expect(result.data).toHaveLength(7)
    }
  })

  it('stat 필드 없는 reasonCard → 유효 처리 (선택 필드)', () => {
    const cards = [coverCard, { ...reasonCard, stat: undefined }, sourceCard]
    const result = parseCards(cards)
    expect(result.success).toBe(true)
  })

  it('change 필드 없는 statsCard → 유효 처리 (선택 필드)', () => {
    const cards = [
      coverCard,
      { ...statsCard, items: [{ label: '지표', value: '100' }] },
      sourceCard,
    ]
    const result = parseCards(cards)
    expect(result.success).toBe(true)
  })
})

// ── T009: parseCards 실패 케이스 ─────────────────────────────────────────────

describe('parseCards — 실패 케이스', () => {
  it('카드 수 2장 (최소 3장 미만) → failure', () => {
    const result = parseCards([coverCard, sourceCard])
    expect(result.success).toBe(false)
  })

  it('카드 수 8장 (최대 7장 초과) → failure', () => {
    const eightCards = [...maxValidCards, { ...reasonCard, id: 8 }]
    const result = parseCards(eightCards)
    expect(result.success).toBe(false)
  })

  it('첫 번째 카드가 cover 아님 → failure', () => {
    const result = parseCards([reasonCard, coverCard, sourceCard])
    expect(result.success).toBe(false)
  })

  it('마지막 카드가 source 아님 → failure', () => {
    const result = parseCards([coverCard, reasonCard, coverCard])
    expect(result.success).toBe(false)
  })

  it('visual.bg_from에 Tailwind 클래스 문자열 → failure', () => {
    const badVisual = { ...validVisual, bg_from: 'bg-slate-900' }
    const result = parseCards([{ ...coverCard, visual: badVisual }, reasonCard, sourceCard])
    expect(result.success).toBe(false)
  })

  it('visual.accent에 잘못된 hex 값 → failure', () => {
    const badVisual = { ...validVisual, accent: 'blue' }
    const result = parseCards([{ ...coverCard, visual: badVisual }, reasonCard, sourceCard])
    expect(result.success).toBe(false)
  })

  it('reason 카드 sources 누락 → failure', () => {
    const noSources = {
      id: 2,
      type: 'reason',
      tag: '원인',
      title: '제목',
      body: '내용',
      visual: validVisual,
    }
    const result = parseCards([coverCard, noSources, sourceCard])
    expect(result.success).toBe(false)
  })

  it('bullish 카드 sources 빈 배열 → failure', () => {
    const emptySources = { ...bullishCard, sources: [] }
    const result = parseCards([coverCard, emptySources, sourceCard])
    expect(result.success).toBe(false)
  })

  it('bearish 카드 sources 누락 → failure', () => {
    const noSources = {
      id: 4,
      type: 'bearish',
      tag: '리스크',
      title: '제목',
      body: '내용',
      visual: validVisual,
    }
    const result = parseCards([coverCard, noSources, sourceCard])
    expect(result.success).toBe(false)
  })

  it('community 카드 quotes 빈 배열 → failure', () => {
    const emptyQuotes = { ...communityCard, quotes: [] }
    const result = parseCards([coverCard, emptyQuotes, sourceCard])
    expect(result.success).toBe(false)
  })

  it('배열이 아닌 객체 입력 → failure', () => {
    const result = parseCards({ id: 1, type: 'cover' })
    expect(result.success).toBe(false)
  })
})

// ── T010: 파이프라인 거부 시나리오 — 에러 상세 검증 ──────────────────────────

describe('parseCards — 파이프라인 거부: errors 상세 검증', () => {
  function assertErrors(result: ParseCardsResult, ...patterns: RegExp[]) {
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.errors.length).toBeGreaterThan(0)
      for (const pattern of patterns) {
        expect(result.errors.some((e) => pattern.test(e))).toBe(true)
      }
    }
  }

  it('카드 수 위반 시 errors에 카드 수 관련 메시지 포함', () => {
    const result = parseCards([coverCard, sourceCard])
    assertErrors(result, /최소|minimum|장/)
  })

  it('첫 카드 순서 위반 시 errors에 cover 언급', () => {
    const result = parseCards([reasonCard, coverCard, sourceCard])
    assertErrors(result, /cover|첫/)
  })

  it('마지막 카드 순서 위반 시 errors에 source 언급', () => {
    const result = parseCards([coverCard, reasonCard, coverCard])
    assertErrors(result, /source|마지막/)
  })

  it('hex 위반 시 errors에 필드 경로 포함 (visual.*)', () => {
    const badVisual = { ...validVisual, bg_from: 'bg-slate-900' }
    const result = parseCards([{ ...coverCard, visual: badVisual }, reasonCard, sourceCard])
    assertErrors(result, /visual|hex|bg_from/)
  })

  it('sources 부재 시 errors에 sources 언급', () => {
    const noSources = {
      id: 2,
      type: 'reason',
      tag: '원인',
      title: '제목',
      body: '내용',
      visual: validVisual,
    }
    const result = parseCards([coverCard, noSources, sourceCard])
    assertErrors(result, /sources|최소/)
  })

  it('community quotes 빈 배열 시 errors에 quotes 언급', () => {
    const result = parseCards([coverCard, { ...communityCard, quotes: [] }, sourceCard])
    assertErrors(result, /quotes|최소/)
  })

  it('비배열 입력 시 errors가 비어있지 않음', () => {
    const result = parseCards('not-an-array')
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.errors.length).toBeGreaterThan(0)
    }
  })

  it('유효한 데이터는 파이프라인 저장 허용 (success true)', () => {
    const result = parseCards(minValidCards)
    expect(result.success).toBe(true)
  })

  it('유효하지 않은 데이터는 파이프라인 저장 거부 (success false)', () => {
    const result = parseCards([coverCard, sourceCard]) // 2장
    expect(result.success).toBe(false)
  })
})

// ── T012: 타입 가드 테스트 ────────────────────────────────────────────────────

describe('타입 가드', () => {
  const fixtures: Card[] = [
    coverCard as Card,
    reasonCard as Card,
    bullishCard as Card,
    bearishCard as Card,
    communityCard as Card,
    statsCard as Card,
    sourceCard as Card,
  ]

  const guards = [
    { fn: isCoverCard, targetType: 'cover', name: 'isCoverCard' },
    { fn: isReasonCard, targetType: 'reason', name: 'isReasonCard' },
    { fn: isBullishCard, targetType: 'bullish', name: 'isBullishCard' },
    { fn: isBearishCard, targetType: 'bearish', name: 'isBearishCard' },
    { fn: isCommunityCard, targetType: 'community', name: 'isCommunityCard' },
    { fn: isStatsCard, targetType: 'stats', name: 'isStatsCard' },
    { fn: isSourceCard, targetType: 'source', name: 'isSourceCard' },
  ] as const

  for (const { fn, targetType, name } of guards) {
    describe(name, () => {
      for (const card of fixtures) {
        const expected = card.type === targetType
        it(`${card.type} 카드 → ${expected}`, () => {
          expect(fn(card)).toBe(expected)
        })
      }
    })
  }
})
