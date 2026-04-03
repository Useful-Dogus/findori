import type { Card } from '@/types/cards'
import type { GuardrailViolation } from '@/types/pipeline'

type FieldConstraint = {
  maxChars?: number
  maxSentences?: number
}

type CardFieldConstraints = {
  [cardType: string]: {
    [field: string]: FieldConstraint
  }
}

// 카드 타입별 텍스트 필드 제약 테이블
// 출처: specs/116-card-copy-guardrails/research.md 확정 기준
const CARD_FIELD_CONSTRAINTS: CardFieldConstraints = {
  delta: {
    context: { maxChars: 80 },
  },
  'delta-intro': {
    whatDesc: { maxChars: 100, maxSentences: 2 },
    trigger: { maxChars: 60, maxSentences: 1 },
  },
  cause: {
    result: { maxChars: 30 },
    cause: { maxChars: 120 },
  },
  stat: {
    reveal: { maxChars: 80 },
  },
  compare: {
    q: { maxChars: 40 },
    footer: { maxChars: 60 },
  },
  verdict: {
    verdict: { maxChars: 50, maxSentences: 1 },
  },
  question: {
    q: { maxChars: 50 },
    hint: { maxChars: 60 },
  },
}

function countSentences(text: string): number {
  return text
    .split(/[。！？.!?]/)
    .filter((s) => s.trim().length > 0).length
}

/**
 * 생성된 카드 배열을 CARD_FIELD_CONSTRAINTS 테이블과 대조해 위반 목록을 반환.
 * 위반이 없으면 빈 배열 반환. 저장은 허용 — 경고 전용.
 */
export function validateCardGuardrails(
  entityId: string,
  cards: Card[],
): GuardrailViolation[] {
  const violations: GuardrailViolation[] = []

  for (const card of cards) {
    const constraints = CARD_FIELD_CONSTRAINTS[card.type]
    if (!constraints) continue

    const cardRecord = card as Record<string, unknown>

    for (const [field, constraint] of Object.entries(constraints)) {
      const value = cardRecord[field]
      if (typeof value !== 'string') continue

      if (constraint.maxChars !== undefined && value.length > constraint.maxChars) {
        violations.push({
          entityId,
          cardId: card.id,
          cardType: card.type,
          field,
          actual: value.length,
          limit: constraint.maxChars,
          violationType: 'max_chars',
        })
      }

      if (constraint.maxSentences !== undefined) {
        const sentenceCount = countSentences(value)
        if (sentenceCount > constraint.maxSentences) {
          violations.push({
            entityId,
            cardId: card.id,
            cardType: card.type,
            field,
            actual: sentenceCount,
            limit: constraint.maxSentences,
            violationType: 'max_sentences',
          })
        }
      }
    }
  }

  return violations
}
