import type { Card } from '@/types/cards'
import type { Json, Tables } from '@/types/database.types'

export type PipelineTrigger = 'cron' | 'admin'
export type PipelineStatus = 'running' | 'success' | 'partial' | 'failed'

export type PipelineError = {
  source: string
  message: string
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
  entityType: 'stock' | 'index' | 'currency' | 'theme'
  title: string
  cards: Card[]
  changeValue: string | null
  channel: string
}

export type PipelineLogRow = Tables<'pipeline_logs'>

export type PipelineLogErrorJson = Json

export type PipelineExecutionSummary = {
  ok: true
  log_id: string
  date: string
  status: Exclude<PipelineStatus, 'running'>
  articles_collected: number
  issues_created: number
  errors: PipelineError[]
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
