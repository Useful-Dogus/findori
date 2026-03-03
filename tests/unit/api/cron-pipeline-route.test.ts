/* @vitest-environment node */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { runPipelineMock } = vi.hoisted(() => ({
  runPipelineMock: vi.fn(),
}))

vi.mock('@/lib/pipeline', () => ({
  runPipeline: runPipelineMock,
}))

import { GET } from '@/app/api/cron/pipeline/route'

describe('GET /api/cron/pipeline', () => {
  const originalSecret = process.env.CRON_SECRET

  beforeEach(() => {
    process.env.CRON_SECRET = 'test-cron-secret-16!'
    vi.clearAllMocks()
  })

  afterEach(() => {
    if (originalSecret === undefined) {
      delete process.env.CRON_SECRET
    } else {
      process.env.CRON_SECRET = originalSecret
    }
  })

  it('returns 401 when the bearer token does not match', async () => {
    const response = await GET(
      new Request('http://localhost/api/cron/pipeline', {
        headers: { authorization: 'Bearer wrong-secret' },
      }) as never,
    )

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual({ error: 'unauthorized' })
    expect(runPipelineMock).not.toHaveBeenCalled()
  })

  it('returns 409 when a pipeline run is already active', async () => {
    runPipelineMock.mockResolvedValue({
      kind: 'duplicate',
      log: {
        started_at: '2026-03-03T01:00:00.000Z',
      },
    })

    const response = await GET(
      new Request('http://localhost/api/cron/pipeline', {
        headers: { authorization: 'Bearer test-cron-secret-16!' },
      }) as never,
    )

    expect(response.status).toBe(409)
    await expect(response.json()).resolves.toEqual({
      error: 'pipeline_already_running',
      started_at: '2026-03-03T01:00:00.000Z',
    })
  })

  it('returns the pipeline summary when execution completes', async () => {
    runPipelineMock.mockResolvedValue({
      kind: 'completed',
      summary: {
        ok: true,
        log_id: 'log-1',
        date: '2026-03-03',
        status: 'success',
        articles_collected: 3,
        issues_created: 1,
        errors: [],
        duration_ms: 3210,
      },
    })

    const response = await GET(
      new Request('http://localhost/api/cron/pipeline', {
        headers: { authorization: 'Bearer test-cron-secret-16!' },
      }) as never,
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      ok: true,
      log_id: 'log-1',
      date: '2026-03-03',
      status: 'success',
      articles_collected: 3,
      issues_created: 1,
      errors: [],
      duration_ms: 3210,
    })
  })
})
