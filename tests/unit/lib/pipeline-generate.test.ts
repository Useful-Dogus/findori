/* @vitest-environment node */

import { describe, expect, it, vi } from 'vitest'

import { generateContextIssues, generateIssues } from '@/lib/pipeline/generate'

const VALID_CARDS = [
  {
    id: 1,
    type: 'cover',
    tag: '핵심',
    title: '삼성전자 급등',
    sub: '+6.9%',
    visual: {
      bg_from: '#000000',
      bg_via: '#111111',
      bg_to: '#222222',
      accent: '#ffffff',
    },
  },
  {
    id: 2,
    type: 'reason',
    tag: '배경',
    title: '실적 기대',
    body: '실적 개선 기대가 반영됐다.',
    visual: {
      bg_from: '#000000',
      bg_via: '#111111',
      bg_to: '#222222',
      accent: '#ffffff',
    },
    sources: [
      {
        title: '기사 1',
        url: 'https://news.test/1',
        domain: 'news.test',
      },
    ],
  },
  {
    id: 3,
    type: 'source',
    tag: '출처',
    visual: {
      bg_from: '#000000',
      bg_via: '#111111',
      bg_to: '#222222',
      accent: '#ffffff',
    },
    sources: [
      {
        title: '기사 1',
        url: 'https://news.test/1',
        domain: 'news.test',
      },
    ],
  },
]

const ARTICLES = [
  {
    sourceId: 'source-1',
    sourceName: 'Source One',
    sourceUrl: 'https://source-one.test/rss',
    url: 'https://news.test/1',
    title: '기사 1',
    summary: '요약',
    content: '본문',
    publishedAt: '2026-03-03T01:00:00.000Z',
  },
]

const CONTEXT_MARKET_DATA = [
  {
    entityId: 'KOSPI',
    entityName: '코스피',
    entityType: 'index' as const,
    value: '2,650.25',
    change: '+12.50',
    changePercent: '+0.47%',
  },
]

describe('generateIssues', () => {
  it('parses valid tool_use output into draft issues', async () => {
    const anthropic = {
      messages: {
        create: vi.fn().mockResolvedValue({
          content: [
            {
              type: 'tool_use',
              name: 'generate_cards',
              input: {
                issues: [
                  {
                    entity_id: '005930',
                    entity_name: '삼성전자',
                    entity_type: 'stock',
                    title: '삼성전자 급등',
                    cards: VALID_CARDS,
                    change_value: '+6.9%',
                  },
                ],
              },
            },
          ],
        }),
      },
    }

    const result = await generateIssues(ARTICLES, { anthropic })

    expect(result.errors).toEqual([])
    expect(result.issues).toHaveLength(1)
    expect(result.issues[0]).toMatchObject({
      entityId: '005930',
      entityName: '삼성전자',
      entityType: 'stock',
      title: '삼성전자 급등',
      changeValue: '+6.9%',
      channel: 'v1',
    })
  })

  it('skips issues whose cards fail validation', async () => {
    const anthropic = {
      messages: {
        create: vi.fn().mockResolvedValue({
          content: [
            {
              type: 'tool_use',
              name: 'generate_cards',
              input: {
                issues: [
                  {
                    entity_id: '035720',
                    entity_name: '카카오',
                    entity_type: 'stock',
                    title: '카카오 변동성 확대',
                    cards: [VALID_CARDS[0], VALID_CARDS[2]],
                  },
                ],
              },
            },
          ],
        }),
      },
    }

    const result = await generateIssues(ARTICLES, { anthropic })

    expect(result.issues).toEqual([])
    expect(result.errors).toHaveLength(1)
    expect(result.errors[0].source).toBe('카카오')
  })

  it('returns early when there are no collected articles', async () => {
    const anthropic = {
      messages: {
        create: vi.fn(),
      },
    }

    const result = await generateIssues([], { anthropic })

    expect(result).toEqual({ issues: [], errors: [] })
    expect(anthropic.messages.create).not.toHaveBeenCalled()
  })

  // T006: system prompt 포함 검증
  it('calls anthropic.messages.create with a system parameter', async () => {
    const anthropic = {
      messages: {
        create: vi.fn().mockResolvedValue({
          content: [
            {
              type: 'tool_use',
              name: 'generate_cards',
              input: { issues: [] },
            },
          ],
        }),
      },
    }

    await generateIssues(ARTICLES, { anthropic })

    expect(anthropic.messages.create).toHaveBeenCalledOnce()
    const callArgs = anthropic.messages.create.mock.calls[0][0] as Record<string, unknown>
    expect(callArgs).toHaveProperty('system')
    expect(typeof callArgs.system).toBe('string')
    expect((callArgs.system as string).length).toBeGreaterThan(0)
  })

  // T007: channel 기본값 'v1' 검증 (AI 응답에 channel 필드 없는 경우)
  it('sets channel to v1 when AI response omits channel field', async () => {
    const anthropic = {
      messages: {
        create: vi.fn().mockResolvedValue({
          content: [
            {
              type: 'tool_use',
              name: 'generate_cards',
              input: {
                issues: [
                  {
                    entity_id: '005930',
                    entity_name: '삼성전자',
                    entity_type: 'stock',
                    title: '삼성전자 급등',
                    cards: VALID_CARDS,
                    // channel 필드 의도적으로 생략
                  },
                ],
              },
            },
          ],
        }),
      },
    }

    const result = await generateIssues(ARTICLES, { anthropic })

    expect(result.errors).toEqual([])
    expect(result.issues).toHaveLength(1)
    expect(result.issues[0].channel).toBe('v1')
  })
})

describe('generateContextIssues', () => {
  // T011: happy path — entity_type: 'index' 이슈 생성, channel 'v1' 확인
  it('generates index issues from context market data', async () => {
    const anthropic = {
      messages: {
        create: vi.fn().mockResolvedValue({
          content: [
            {
              type: 'tool_use',
              name: 'generate_cards',
              input: {
                issues: [
                  {
                    entity_id: 'KOSPI',
                    entity_name: '코스피',
                    entity_type: 'index',
                    title: '코스피 소폭 상승',
                    cards: VALID_CARDS,
                    change_value: '+0.47%',
                  },
                ],
              },
            },
          ],
        }),
      },
    }

    const result = await generateContextIssues(CONTEXT_MARKET_DATA, { anthropic })

    expect(result.errors).toEqual([])
    expect(result.issues).toHaveLength(1)
    expect(result.issues[0]).toMatchObject({
      entityId: 'KOSPI',
      entityName: '코스피',
      entityType: 'index',
      title: '코스피 소폭 상승',
      channel: 'v1',
    })
  })

  // T012: 빈 배열 입력 시 AI 호출 없이 즉시 종료
  it('returns early without calling AI when contextData is empty', async () => {
    const anthropic = {
      messages: {
        create: vi.fn(),
      },
    }

    const result = await generateContextIssues([], { anthropic })

    expect(result).toEqual({ issues: [], errors: [] })
    expect(anthropic.messages.create).not.toHaveBeenCalled()
  })

  // T013: 부분 성공 — schema 위반 cards[]는 errors에 기록, 유효한 이슈는 정상 반환
  it('records schema-invalid issues in errors and returns valid ones', async () => {
    const anthropic = {
      messages: {
        create: vi.fn().mockResolvedValue({
          content: [
            {
              type: 'tool_use',
              name: 'generate_cards',
              input: {
                issues: [
                  {
                    entity_id: 'KOSPI',
                    entity_name: '코스피',
                    entity_type: 'index',
                    title: '코스피 소폭 상승',
                    cards: VALID_CARDS,
                  },
                  {
                    entity_id: 'USD-KRW',
                    entity_name: '달러-원',
                    entity_type: 'currency',
                    title: '달러 강세',
                    // schema 위반: cover와 source만 있고 중간 카드 없어 최소 3장 미충족
                    cards: [VALID_CARDS[0], VALID_CARDS[2]],
                  },
                ],
              },
            },
          ],
        }),
      },
    }

    const result = await generateContextIssues(CONTEXT_MARKET_DATA, { anthropic })

    expect(result.issues).toHaveLength(1)
    expect(result.issues[0].entityId).toBe('KOSPI')
    expect(result.errors).toHaveLength(1)
    expect(result.errors[0].source).toBe('달러-원')
  })
})
