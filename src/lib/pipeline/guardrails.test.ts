import { describe, test, expect } from 'vitest'
import { validateCardGuardrails } from './guardrails'
import type { Card } from '@/types/cards'

// 기본 visual 헬퍼
const visual = {
  bg_from: '#000000',
  bg_via: '#111111',
  bg_to: '#222222',
  accent: '#ffffff',
}

// ── 위반 없는 케이스 ──────────────────────────────────────────────────────────

describe('validateCardGuardrails — 위반 없음', () => {
  test('빈 배열은 빈 배열을 반환한다', () => {
    expect(validateCardGuardrails('entity-1', [])).toEqual([])
  })

  test('제약이 없는 카드 타입(source)은 위반을 반환하지 않는다', () => {
    const cards: Card[] = [
      {
        id: 1,
        type: 'source',
        tag: '출처',
        sources: [{ title: '기사', url: 'https://example.com', domain: 'example.com' }],
        visual,
      },
    ]
    expect(validateCardGuardrails('entity-1', cards)).toEqual([])
  })

  test('delta.context가 정확히 80자이면 통과한다 (경계값)', () => {
    const cards: Card[] = [
      {
        id: 1,
        type: 'delta',
        tag: '변화',
        before: '100',
        after: '200',
        period: '하루 만에',
        context: 'a'.repeat(80),
        visual,
      },
    ]
    expect(validateCardGuardrails('entity-1', cards)).toEqual([])
  })

  test('cause.result가 정확히 30자이면 통과한다 (경계값)', () => {
    const cards: Card[] = [
      {
        id: 1,
        type: 'cause',
        tag: '원인',
        result: 'a'.repeat(30),
        cause: '원인 설명입니다.',
        sources: [{ title: '기사', url: 'https://example.com', domain: 'example.com' }],
        visual,
      },
    ]
    expect(validateCardGuardrails('entity-1', cards)).toEqual([])
  })

  test('verdict.verdict가 정확히 50자 1문장이면 통과한다 (경계값)', () => {
    const cards: Card[] = [
      {
        id: 1,
        type: 'verdict',
        tag: '결론',
        verdict: 'a'.repeat(50),
        reasons: ['이유1', '이유2'],
        visual,
      },
    ]
    expect(validateCardGuardrails('entity-1', cards)).toEqual([])
  })
})

// ── 글자 수 위반 케이스 ──────────────────────────────────────────────────────

describe('validateCardGuardrails — 글자 수 위반', () => {
  test('delta.context가 81자이면 max_chars 위반을 반환한다', () => {
    const cards: Card[] = [
      {
        id: 1,
        type: 'delta',
        tag: '변화',
        before: '100',
        after: '200',
        period: '하루 만에',
        context: 'a'.repeat(81),
        visual,
      },
    ]
    const violations = validateCardGuardrails('eid', cards)
    expect(violations).toHaveLength(1)
    expect(violations[0]).toMatchObject({
      entityId: 'eid',
      cardId: 1,
      cardType: 'delta',
      field: 'context',
      actual: 81,
      limit: 80,
      violationType: 'max_chars',
    })
  })

  test('cause.result가 31자이면 max_chars 위반을 반환한다', () => {
    const cards: Card[] = [
      {
        id: 1,
        type: 'cause',
        tag: '원인',
        result: 'a'.repeat(31),
        cause: '원인 설명.',
        sources: [{ title: '기사', url: 'https://example.com', domain: 'example.com' }],
        visual,
      },
    ]
    const violations = validateCardGuardrails('eid', cards)
    expect(violations).toHaveLength(1)
    expect(violations[0]).toMatchObject({ field: 'result', actual: 31, limit: 30, violationType: 'max_chars' })
  })

  test('cause.cause가 121자이면 max_chars 위반을 반환한다', () => {
    const cards: Card[] = [
      {
        id: 1,
        type: 'cause',
        tag: '원인',
        result: '결과',
        cause: 'a'.repeat(121),
        sources: [{ title: '기사', url: 'https://example.com', domain: 'example.com' }],
        visual,
      },
    ]
    const violations = validateCardGuardrails('eid', cards)
    expect(violations).toHaveLength(1)
    expect(violations[0]).toMatchObject({ field: 'cause', actual: 121, limit: 120, violationType: 'max_chars' })
  })

  test('verdict.verdict가 51자이면 max_chars 위반을 반환한다', () => {
    const cards: Card[] = [
      {
        id: 1,
        type: 'verdict',
        tag: '결론',
        verdict: 'a'.repeat(51),
        reasons: ['이유1', '이유2'],
        visual,
      },
    ]
    const violations = validateCardGuardrails('eid', cards)
    expect(violations.some((v) => v.field === 'verdict' && v.violationType === 'max_chars')).toBe(true)
  })
})

// ── 문장 수 위반 케이스 ──────────────────────────────────────────────────────

describe('validateCardGuardrails — 문장 수 위반', () => {
  test('delta-intro.whatDesc가 3문장이면 max_sentences 위반을 반환한다', () => {
    const cards: Card[] = [
      {
        id: 1,
        type: 'delta-intro',
        tag: '소개',
        before: '100',
        after: '200',
        period: '하루 만에',
        what: '주체명',
        whatDesc: '첫 문장입니다. 두 번째 문장입니다. 세 번째 문장입니다.',
        trigger: '주목받는 이유.',
        visual,
      },
    ]
    const violations = validateCardGuardrails('eid', cards)
    expect(violations.some((v) => v.field === 'whatDesc' && v.violationType === 'max_sentences')).toBe(true)
  })

  test('delta-intro.whatDesc가 2문장이면 max_sentences 통과한다', () => {
    const cards: Card[] = [
      {
        id: 1,
        type: 'delta-intro',
        tag: '소개',
        before: '100',
        after: '200',
        period: '하루 만에',
        what: '주체명',
        whatDesc: '첫 문장입니다. 두 번째 문장입니다.',
        trigger: '주목받는 이유.',
        visual,
      },
    ]
    const violations = validateCardGuardrails('eid', cards)
    expect(violations.filter((v) => v.field === 'whatDesc' && v.violationType === 'max_sentences')).toHaveLength(0)
  })

  test('verdict.verdict가 2문장이면 max_sentences 위반을 반환한다', () => {
    const cards: Card[] = [
      {
        id: 1,
        type: 'verdict',
        tag: '결론',
        verdict: '첫 문장. 두 번째 문장.',
        reasons: ['이유1', '이유2'],
        visual,
      },
    ]
    const violations = validateCardGuardrails('eid', cards)
    expect(violations.some((v) => v.field === 'verdict' && v.violationType === 'max_sentences')).toBe(true)
  })

  test('verdict.verdict가 1문장이면 max_sentences 통과한다', () => {
    const cards: Card[] = [
      {
        id: 1,
        type: 'verdict',
        tag: '결론',
        verdict: '한 문장 결론.',
        reasons: ['이유1', '이유2'],
        visual,
      },
    ]
    const violations = validateCardGuardrails('eid', cards)
    expect(violations.filter((v) => v.field === 'verdict' && v.violationType === 'max_sentences')).toHaveLength(0)
  })
})

// ── 복합 위반 케이스 ──────────────────────────────────────────────────────────

describe('validateCardGuardrails — 복합 위반', () => {
  test('여러 카드에 걸쳐 복수 위반이 모두 반환된다', () => {
    const cards: Card[] = [
      {
        id: 1,
        type: 'delta',
        tag: '변화',
        before: '100',
        after: '200',
        period: '하루 만에',
        context: 'a'.repeat(100), // 위반
        visual,
      },
      {
        id: 2,
        type: 'verdict',
        tag: '결론',
        verdict: 'a'.repeat(60), // 글자 수 위반
        reasons: ['이유1', '이유2'],
        visual,
      },
    ]
    const violations = validateCardGuardrails('eid', cards)
    expect(violations.length).toBeGreaterThanOrEqual(2)
    expect(violations.some((v) => v.cardId === 1 && v.field === 'context')).toBe(true)
    expect(violations.some((v) => v.cardId === 2 && v.field === 'verdict')).toBe(true)
  })
})
