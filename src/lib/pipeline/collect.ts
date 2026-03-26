import Parser from 'rss-parser'
import type { SupabaseClient } from '@supabase/supabase-js'

import type { Database } from '@/types/database.types'
import type {
  CollectedArticle,
  PipelineError,
  PipelineSource,
  PipelineSourceStat,
} from '@/types/pipeline'

const RSS_TIMEOUT_MS = 30_000

type ParserLike = Pick<Parser, 'parseURL'>

function getKstDateString(date: Date) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)

  const year = parts.find((part) => part.type === 'year')?.value
  const month = parts.find((part) => part.type === 'month')?.value
  const day = parts.find((part) => part.type === 'day')?.value

  if (!year || !month || !day) {
    throw new Error('KST 날짜를 계산하지 못했습니다.')
  }

  return `${year}-${month}-${day}`
}

function normalizeArticleUrl(item: Parser.Item) {
  return item.link?.trim() || item.guid?.trim() || null
}

function resolvePublishedAt(item: Parser.Item) {
  return item.isoDate ?? item.pubDate ?? null
}

const MAX_ARTICLES_PER_SOURCE = 30
const MAX_CONTENT_LENGTH = 1500

function buildArticle(source: PipelineSource, item: Parser.Item): CollectedArticle | null {
  const url = normalizeArticleUrl(item)
  if (!url) {
    return null
  }

  const content = item.content?.trim() || item.contentSnippet?.trim() || item.summary?.trim() || ''

  return {
    sourceId: source.id,
    sourceName: source.name,
    sourceUrl: source.rss_url,
    url,
    title: item.title?.trim() || '제목 없음',
    summary: item.contentSnippet?.trim() || item.summary?.trim() || '',
    content: content.slice(0, MAX_CONTENT_LENGTH),
    publishedAt: resolvePublishedAt(item),
  }
}

function isSameTargetDate(publishedAt: string | null, targetDate: string) {
  if (!publishedAt) {
    return true
  }

  return getKstDateString(new Date(publishedAt)) === targetDate
}

export async function getActiveSources(client: SupabaseClient<Database>) {
  const { data, error } = await client
    .from('media_sources')
    .select('*')
    .eq('active', true)
    .order('created_at', { ascending: true })

  if (error) {
    throw new Error(`활성 매체 목록을 조회하지 못했습니다: ${error.message}`)
  }

  return data
}

export async function collectArticles(
  client: SupabaseClient<Database>,
  targetDate: string,
  deps: {
    parser?: ParserLike
  } = {},
): Promise<{
  articles: CollectedArticle[]
  errors: PipelineError[]
  sourceStats: PipelineSourceStat[]
  articlesRaw: number
}> {
  const sources = await getActiveSources(client)
  const parser =
    deps.parser ??
    new Parser({
      timeout: RSS_TIMEOUT_MS,
      headers: {
        'user-agent': 'findori-pipeline/1.0',
      },
    })

  const errors: PipelineError[] = []
  const seenUrls = new Set<string>()
  const perSourceResults = await Promise.all(
    sources.map(async (source) => {
      try {
        const feed = await parser.parseURL(source.rss_url)

        return feed.items
          .slice(0, MAX_ARTICLES_PER_SOURCE)
          .map((item) => buildArticle(source, item))
          .filter((article): article is CollectedArticle => article !== null)
          .filter((article) => isSameTargetDate(article.publishedAt, targetDate))
      } catch (error) {
        errors.push({
          source: source.name,
          message: error instanceof Error ? error.message : 'unknown_error',
        })
        return []
      }
    }),
  )

  const articles = perSourceResults.flat().filter((article) => {
    if (seenUrls.has(article.url)) {
      return false
    }
    seenUrls.add(article.url)
    return true
  })

  const failedSources = new Set(errors.map((e) => e.source))
  const sourceStats: PipelineSourceStat[] = sources
    .map((source, i) => ({ source: source.name, count: perSourceResults[i].length }))
    .filter((stat) => !failedSources.has(stat.source))
  const articlesRaw = perSourceResults.flat().length

  return { articles, errors, sourceStats, articlesRaw }
}
