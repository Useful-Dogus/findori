import type { Card } from '@/types/cards'
import type { Json, Tables } from '@/types/database.types'

export type PipelineTrigger = 'cron' | 'admin'
export type PipelineStatus = 'running' | 'success' | 'partial' | 'failed'

export type PipelineError = {
  source: string
  message: string
}

export type GuardrailViolation = {
  entityId: string
  cardId: number
  cardType: string
  field: string
  actual: number
  limit: number
  violationType: 'max_chars' | 'max_sentences'
}

export type PipelineSourceStat = {
  source: string
  count: number
}

export type PipelineSource = Tables<'media_sources'>

export type CollectedArticle = {
  sourceId: string
  sourceName: string
  sourceUrl: string
  url: string
  title: string
  summary: string
  content: string
  publishedAt: string | null
}

export type GeneratedIssueDraft = {
  entityId: string
  entityName: string
  entityType: 'stock' | 'index' | 'fx' | 'theme'
  title: string
  cards: Card[]
  changeValue: string | null
  channel: string
}

export type ContextMarketData = {
  entityId: string
  entityName: string
  entityType: 'index' | 'fx'
  value: string
  change: string
  changePercent: string
}

export type TokenUsage = {
  inputTokens: number
  outputTokens: number
  estimatedCostUsd: number
}

export type PipelineLogRow = Tables<'pipeline_logs'>

export type PipelineLogErrorJson = Json

export type PipelineExecutionSummary = {
  ok: true
  log_id: string
  date: string
  status: Exclude<PipelineStatus, 'running'>
  articles_collected: number
  articles_raw: number
  source_stats: PipelineSourceStat[]
  issues_created: number
  errors: PipelineError[]
  guardrail_violations: GuardrailViolation[]
  duration_ms: number
}

export type PipelineRunResult =
  | {
      kind: 'duplicate'
      log: PipelineLogRow
      date: string
    }
  | {
      kind: 'completed'
      summary: PipelineExecutionSummary
    }
