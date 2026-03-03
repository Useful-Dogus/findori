/* @vitest-environment node */

import { describe, expect, it, vi } from 'vitest'

import { generateIssues } from '@/lib/pipeline/generate'

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
      channel: 'default',
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
})
