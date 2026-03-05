/* @vitest-environment node */

import { describe, expect, it, vi } from 'vitest'

import { collectArticles } from '@/lib/pipeline/collect'

function createMediaSourceClient() {
  const sources = [
    {
      id: 'source-1',
      name: 'Source One',
      rss_url: 'https://source-one.test/rss',
      active: true,
      created_at: '2026-03-03T00:00:00.000Z',
    },
    {
      id: 'source-2',
      name: 'Source Two',
      rss_url: 'https://source-two.test/rss',
      active: true,
      created_at: '2026-03-03T00:00:00.000Z',
    },
  ]

  return {
    from(table: string) {
      expect(table).toBe('media_sources')

      return {
        select() {
          return this
        },
        eq() {
          return this
        },
        order: vi.fn().mockResolvedValue({
          data: sources,
          error: null,
        }),
      }
    },
  }
}

describe('collectArticles', () => {
  it('collects same-day articles and removes duplicate URLs', async () => {
    const client = createMediaSourceClient()
    const parser = {
      parseURL: vi.fn(async (url: string) => {
        if (url.includes('source-one')) {
          return {
            items: [
              {
                link: 'https://news.test/article-1',
                title: '첫 번째 기사',
                contentSnippet: '요약 1',
                content: '본문 1',
                isoDate: '2026-03-03T01:00:00.000Z',
              },
              {
                link: 'https://news.test/article-old',
                title: '이전 날짜 기사',
                contentSnippet: '요약 old',
                content: '본문 old',
                isoDate: '2026-03-02T01:00:00.000Z',
              },
            ],
          }
        }

        return {
          items: [
            {
              link: 'https://news.test/article-1',
              title: '중복 기사',
              contentSnippet: '요약 dup',
              content: '본문 dup',
              isoDate: '2026-03-03T02:00:00.000Z',
            },
            {
              link: 'https://news.test/article-2',
              title: '두 번째 기사',
              contentSnippet: '요약 2',
              content: '본문 2',
              isoDate: '2026-03-03T03:00:00.000Z',
            },
          ],
        }
      }),
    }

    const result = await collectArticles(client as never, '2026-03-03', { parser })

    expect(result.errors).toEqual([])
    expect(result.articles).toHaveLength(2)
    expect(result.articles.map((article) => article.url)).toEqual([
      'https://news.test/article-1',
      'https://news.test/article-2',
    ])

    // T007: sourceStats and articlesRaw
    // source-one: 1 same-day article (article-old filtered), source-two: 2 same-day articles (article-1 + article-2)
    expect(result.sourceStats).toEqual([
      { source: 'Source One', count: 1 },
      { source: 'Source Two', count: 2 },
    ])
    expect(result.articlesRaw).toBe(3)
    // dedup: article-1 appears in both sources, so articles.length < articlesRaw
    expect(result.articles.length).toBeLessThan(result.articlesRaw)
    // articlesRaw === sum of sourceStats counts
    expect(result.articlesRaw).toBe(result.sourceStats.reduce((sum, stat) => sum + stat.count, 0))
  })

  it('keeps successful articles when one RSS source fails', async () => {
    const client = createMediaSourceClient()
    const parser = {
      parseURL: vi.fn(async (url: string) => {
        if (url.includes('source-one')) {
          throw new Error('RSS fetch timeout')
        }

        return {
          items: [
            {
              link: 'https://news.test/article-3',
              title: '정상 기사',
              contentSnippet: '요약 3',
              content: '본문 3',
              isoDate: '2026-03-03T03:00:00.000Z',
            },
          ],
        }
      }),
    }

    const result = await collectArticles(client as never, '2026-03-03', { parser })

    expect(result.articles).toHaveLength(1)
    expect(result.errors).toEqual([
      {
        source: 'Source One',
        message: 'RSS fetch timeout',
      },
    ])

    // T009: US2 — failed source excluded from sourceStats
    expect(result.sourceStats).toEqual([{ source: 'Source Two', count: 1 }])
    expect(result.sourceStats.find((s) => s.source === 'Source One')).toBeUndefined()
    // articlesRaw = sum of successful sources only (failed source returned [])
    expect(result.articlesRaw).toBe(1)
    expect(result.articlesRaw).toBe(result.sourceStats.reduce((sum, stat) => sum + stat.count, 0))
  })
})
