/* @vitest-environment node */

import { beforeEach, describe, expect, it, vi } from 'vitest'

const {
  collectArticlesMock,
  filterArticlesMock,
  extractFactsMock,
  generateIssuesMock,
  getActivePipelineRunMock,
  markStalePipelineRunsMock,
  startPipelineRunMock,
  finishPipelineRunMock,
  ensureDraftFeedMock,
  insertDraftIssuesMock,
  createAdminClientMock,
} = vi.hoisted(() => ({
  collectArticlesMock: vi.fn(),
  filterArticlesMock: vi.fn(),
  extractFactsMock: vi.fn(),
  generateIssuesMock: vi.fn(),
  getActivePipelineRunMock: vi.fn(),
  markStalePipelineRunsMock: vi.fn(),
  startPipelineRunMock: vi.fn(),
  finishPipelineRunMock: vi.fn(),
  ensureDraftFeedMock: vi.fn(),
  insertDraftIssuesMock: vi.fn(),
  createAdminClientMock: vi.fn(),
}))

vi.mock('@/lib/pipeline/collect', () => ({
  collectArticles: collectArticlesMock,
}))

vi.mock('@/lib/pipeline/filter', () => ({
  filterArticles: filterArticlesMock,
}))

vi.mock('@/lib/pipeline/extract', () => ({
  extractFacts: extractFactsMock,
}))

vi.mock('@/lib/pipeline/generate', () => ({
  generateIssues: generateIssuesMock,
}))

vi.mock('@/lib/pipeline/log', () => ({
  getActivePipelineRun: getActivePipelineRunMock,
  markStalePipelineRuns: markStalePipelineRunsMock,
  startPipelineRun: startPipelineRunMock,
  finishPipelineRun: finishPipelineRunMock,
  listPipelineLogs: vi.fn(),
}))

vi.mock('@/lib/pipeline/store', () => ({
  ensureDraftFeed: ensureDraftFeedMock,
  insertDraftIssues: insertDraftIssuesMock,
}))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: createAdminClientMock,
}))

import { runPipeline } from '@/lib/pipeline'

describe('runPipeline', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    createAdminClientMock.mockReturnValue({ name: 'admin-client' })
    markStalePipelineRunsMock.mockResolvedValue(undefined)
    filterArticlesMock.mockResolvedValue({ articles: [], usage: null, skipped: false })
    extractFactsMock.mockResolvedValue({ facts: null, usage: null })
  })

  it('returns duplicate when there is an active running log', async () => {
    getActivePipelineRunMock.mockResolvedValue({
      id: 'log-1',
      started_at: '2026-03-03T01:00:00.000Z',
      date: '2026-03-03',
      status: 'running',
      triggered_by: 'cron',
      completed_at: null,
      articles_collected: 0,
      issues_created: 0,
      errors: [],
    })

    const result = await runPipeline({
      triggeredBy: 'cron',
      now: new Date('2026-03-03T02:00:00.000Z'),
    })

    expect(result.kind).toBe('duplicate')
    expect(startPipelineRunMock).not.toHaveBeenCalled()
  })

  it('returns a partial summary when some steps emit errors', async () => {
    getActivePipelineRunMock.mockResolvedValue(null)
    startPipelineRunMock.mockResolvedValue({ id: 'log-2' })
    collectArticlesMock.mockResolvedValue({
      articles: [
        {
          url: 'https://news.test/1',
        },
      ],
      articlesRaw: 1,
      sourceStats: [],
      errors: [{ source: 'Source One', message: 'RSS fetch timeout' }],
    })
    filterArticlesMock.mockResolvedValue({
      articles: [{ url: 'https://news.test/1' }],
      usage: null,
      skipped: false,
    })
    generateIssuesMock.mockResolvedValue({
      issues: [
        {
          entityId: '005930',
          entityName: '삼성전자',
          entityType: 'stock',
          title: '삼성전자 급등',
          cards: [],
          changeValue: null,
          channel: 'default',
        },
      ],
      errors: [],
    })
    ensureDraftFeedMock.mockResolvedValue({ id: 'feed-1' })
    insertDraftIssuesMock.mockResolvedValue([{ id: 'issue-1' }])
    finishPipelineRunMock.mockResolvedValue(undefined)

    const result = await runPipeline({
      triggeredBy: 'cron',
      now: new Date('2026-03-03T02:00:00.000Z'),
    })

    expect(result.kind).toBe('completed')
    if (result.kind === 'completed') {
      expect(result.summary.status).toBe('partial')
      expect(result.summary.articles_collected).toBe(1)
      expect(result.summary.issues_created).toBe(1)
      expect(result.summary.errors).toEqual([
        { source: 'Source One', message: 'RSS fetch timeout' },
      ])
    }

    expect(finishPipelineRunMock).toHaveBeenCalledWith(
      { name: 'admin-client' },
      'log-2',
      expect.objectContaining({
        status: 'partial',
        articlesCollected: 1,
        issuesCreated: 1,
      }),
    )
  })
})
