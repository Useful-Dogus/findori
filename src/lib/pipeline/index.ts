import { createAdminClient } from '@/lib/supabase/admin'
import { collectArticles } from '@/lib/pipeline/collect'
import { extractFacts } from '@/lib/pipeline/extract'
import { filterArticles } from '@/lib/pipeline/filter'
import { generateIssues } from '@/lib/pipeline/generate'
import {
  finishPipelineRun,
  getActivePipelineRun,
  markStalePipelineRuns,
  startPipelineRun,
} from '@/lib/pipeline/log'
import { ensureDraftFeed, insertDraftIssues } from '@/lib/pipeline/store'
import type {
  PipelineError,
  PipelineRunResult,
  PipelineStatus,
  PipelineTrigger,
  TokenUsage,
} from '@/types/pipeline'

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

function resolvePipelineStatus(params: {
  articlesCollected: number
  issuesCreated: number
  errors: PipelineError[]
}): Exclude<PipelineStatus, 'running'> {
  if (params.errors.length === 0) {
    return 'success'
  }

  if (params.articlesCollected === 0 && params.issuesCreated === 0) {
    return 'failed'
  }

  return 'partial'
}

export async function runPipeline(
  params: {
    triggeredBy: PipelineTrigger
    now?: Date
  },
  deps: {
    client?: ReturnType<typeof createAdminClient>
  } = {},
): Promise<PipelineRunResult> {
  const client = deps.client ?? createAdminClient()
  const now = params.now ?? new Date()
  const date = getKstDateString(now)

  await markStalePipelineRuns(client, date, now)

  const activeRun = await getActivePipelineRun(client, date, now)
  if (activeRun) {
    return {
      kind: 'duplicate',
      log: activeRun,
      date,
    }
  }

  const startedAt = new Date()
  const log = await startPipelineRun(client, date, params.triggeredBy, startedAt)

  let collected: Awaited<ReturnType<typeof collectArticles>> | undefined
  let tokenUsage: TokenUsage | undefined

  try {
    collected = await collectArticles(client, date)

    const filtered = await filterArticles(collected.articles)
    const filterUsage = filtered.usage

    // Phase 2: 팩트 추출 단계 (Haiku) — 실패 시 null로 fallback
    const extracted = await extractFacts(filtered.articles)
    const extractUsage = extracted.usage

    const generated = await generateIssues(filtered.articles, {
      extractedFacts: extracted.facts,
    })
    const generateUsage = generated.usage

    if (filterUsage || extractUsage || generateUsage) {
      tokenUsage = {
        inputTokens:
          (filterUsage?.inputTokens ?? 0) +
          (extractUsage?.inputTokens ?? 0) +
          (generateUsage?.inputTokens ?? 0),
        outputTokens:
          (filterUsage?.outputTokens ?? 0) +
          (extractUsage?.outputTokens ?? 0) +
          (generateUsage?.outputTokens ?? 0),
        estimatedCostUsd:
          (filterUsage?.estimatedCostUsd ?? 0) +
          (extractUsage?.estimatedCostUsd ?? 0) +
          (generateUsage?.estimatedCostUsd ?? 0),
      }
    }

    const errors = [...collected.errors, ...generated.errors]

    const feed = await ensureDraftFeed(client, date)
    const insertedIssues = await insertDraftIssues(client, feed.id, generated.issues)

    const status = resolvePipelineStatus({
      articlesCollected: filtered.articles.length,
      issuesCreated: insertedIssues.length,
      errors,
    })

    const completedAt = new Date()
    await finishPipelineRun(client, log.id, {
      status,
      completedAt,
      articlesCollected: filtered.articles.length,
      articlesRaw: collected.articlesRaw,
      sourceStats: collected.sourceStats,
      issuesCreated: insertedIssues.length,
      errors,
      tokenUsage,
    })

    return {
      kind: 'completed',
      summary: {
        ok: true,
        log_id: log.id,
        date,
        status,
        articles_collected: filtered.articles.length,
        articles_raw: collected.articlesRaw,
        source_stats: collected.sourceStats,
        issues_created: insertedIssues.length,
        errors,
        duration_ms: completedAt.getTime() - startedAt.getTime(),
      },
    }
  } catch (error) {
    const pipelineError = {
      source: 'pipeline',
      message: error instanceof Error ? error.message : 'unknown_error',
    }
    const completedAt = new Date()

    await finishPipelineRun(client, log.id, {
      status: 'failed',
      completedAt,
      articlesCollected: collected?.articles.length ?? 0,
      articlesRaw: collected?.articlesRaw ?? 0,
      sourceStats: collected?.sourceStats ?? [],
      issuesCreated: 0,
      errors: [pipelineError],
      tokenUsage,
    })

    throw error
  }
}

export { collectArticles } from '@/lib/pipeline/collect'
export { extractFacts } from '@/lib/pipeline/extract'
export { generateContextIssues, generateIssues } from '@/lib/pipeline/generate'
export { listPipelineLogs } from '@/lib/pipeline/log'
export { ensureDraftFeed, insertDraftIssues } from '@/lib/pipeline/store'
