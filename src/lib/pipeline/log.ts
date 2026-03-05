import type { SupabaseClient } from '@supabase/supabase-js'

import type { Database, TablesInsert } from '@/types/database.types'
import type {
  PipelineError,
  PipelineLogRow,
  PipelineSourceStat,
  PipelineStatus,
  PipelineTrigger,
} from '@/types/pipeline'

const RUNNING_TTL_MS = 360 * 1000

function serializeErrors(errors: PipelineError[]) {
  return errors.map((error) => ({
    source: error.source,
    message: error.message,
  }))
}

function isExpiredRunningLog(startedAt: string, now: Date) {
  return now.getTime() - new Date(startedAt).getTime() >= RUNNING_TTL_MS
}

export async function getActivePipelineRun(
  client: SupabaseClient<Database>,
  date: string,
  now = new Date(),
) {
  const { data, error } = await client
    .from('pipeline_logs')
    .select('*')
    .eq('date', date)
    .eq('status', 'running')
    .order('started_at', { ascending: false })

  if (error) {
    throw new Error(`파이프라인 실행 상태를 조회하지 못했습니다: ${error.message}`)
  }

  const active = data.find((log) => !isExpiredRunningLog(log.started_at, now))
  return active ?? null
}

export async function markStalePipelineRuns(
  client: SupabaseClient<Database>,
  date: string,
  now = new Date(),
) {
  const { data, error } = await client
    .from('pipeline_logs')
    .select('*')
    .eq('date', date)
    .eq('status', 'running')

  if (error) {
    throw new Error(`만료된 파이프라인 실행을 조회하지 못했습니다: ${error.message}`)
  }

  const staleLogs = data.filter((log) => isExpiredRunningLog(log.started_at, now))

  await Promise.all(
    staleLogs.map(async (log) => {
      const staleErrors = [
        ...(Array.isArray(log.errors) ? log.errors : []),
        { source: 'pipeline', message: 'stale_running_log' },
      ]

      const { error: updateError } = await client
        .from('pipeline_logs')
        .update({
          status: 'failed',
          completed_at: now.toISOString(),
          errors: staleErrors,
        })
        .eq('id', log.id)

      if (updateError) {
        throw new Error(`만료된 파이프라인 실행을 종료하지 못했습니다: ${updateError.message}`)
      }
    }),
  )
}

export async function startPipelineRun(
  client: SupabaseClient<Database>,
  date: string,
  triggeredBy: PipelineTrigger,
  startedAt = new Date(),
) {
  const payload: TablesInsert<'pipeline_logs'> = {
    date,
    status: 'running',
    triggered_by: triggeredBy,
    started_at: startedAt.toISOString(),
    errors: [],
  }

  const { data, error } = await client.from('pipeline_logs').insert(payload).select('*').single()

  if (error) {
    throw new Error(`파이프라인 실행 로그를 시작하지 못했습니다: ${error.message}`)
  }

  return data
}

export async function finishPipelineRun(
  client: SupabaseClient<Database>,
  logId: string,
  params: {
    status: Exclude<PipelineStatus, 'running'>
    completedAt?: Date
    articlesCollected: number
    articlesRaw: number
    sourceStats: PipelineSourceStat[]
    issuesCreated: number
    errors: PipelineError[]
  },
) {
  const completedAt = params.completedAt ?? new Date()

  const { data, error } = await client
    .from('pipeline_logs')
    .update({
      status: params.status,
      completed_at: completedAt.toISOString(),
      articles_collected: params.articlesCollected,
      articles_raw: params.articlesRaw,
      source_stats: params.sourceStats,
      issues_created: params.issuesCreated,
      errors: serializeErrors(params.errors),
    })
    .eq('id', logId)
    .select('*')
    .single()

  if (error) {
    throw new Error(`파이프라인 실행 로그를 완료하지 못했습니다: ${error.message}`)
  }

  return data
}

export async function listPipelineLogs(
  client: SupabaseClient<Database>,
  params: { page: number; limit: number },
): Promise<{ logs: PipelineLogRow[]; total: number }> {
  const from = (params.page - 1) * params.limit
  const to = from + params.limit - 1

  const { data, count, error } = await client
    .from('pipeline_logs')
    .select('*', { count: 'exact' })
    .order('started_at', { ascending: false })
    .range(from, to)

  if (error) {
    throw new Error(`파이프라인 실행 로그를 조회하지 못했습니다: ${error.message}`)
  }

  return {
    logs: data,
    total: count ?? 0,
  }
}
