/* @vitest-environment node */

import { beforeEach, describe, expect, it, vi } from 'vitest'

const { requireAdminSessionMock, runPipelineMock } = vi.hoisted(() => ({
  requireAdminSessionMock: vi.fn(),
  runPipelineMock: vi.fn(),
}))

vi.mock('@/lib/admin/session', () => ({
  requireAdminSession: requireAdminSessionMock,
}))

vi.mock('@/lib/pipeline', () => ({
  runPipeline: runPipelineMock,
}))

import { POST } from '@/app/api/admin/pipeline/run/route'

describe('POST /api/admin/pipeline/run', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns the auth helper response when the session is invalid', async () => {
    requireAdminSessionMock.mockResolvedValue({
      valid: false,
      response: Response.json({ error: 'unauthorized' }, { status: 401 }),
    })

    const response = await POST(new Request('http://localhost/api/admin/pipeline/run'))

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual({ error: 'unauthorized' })
    expect(runPipelineMock).not.toHaveBeenCalled()
  })

  it('returns 202 with pipeline metadata when execution completes', async () => {
    requireAdminSessionMock.mockResolvedValue({
      valid: true,
      payload: {
        sub: 'admin',
        iat: 1,
        exp: 2,
      },
    })
    runPipelineMock.mockResolvedValue({
      kind: 'completed',
      summary: {
        ok: true,
        log_id: 'log-1',
        date: '2026-03-03',
        status: 'partial',
        articles_collected: 2,
        issues_created: 1,
        errors: [{ source: 'Source One', message: 'RSS fetch timeout' }],
        duration_ms: 900,
      },
    })

    const response = await POST(new Request('http://localhost/api/admin/pipeline/run'))

    expect(response.status).toBe(202)
    await expect(response.json()).resolves.toEqual({
      ok: true,
      log_id: 'log-1',
      date: '2026-03-03',
      status: 'partial',
      articles_collected: 2,
      issues_created: 1,
      errors: [{ source: 'Source One', message: 'RSS fetch timeout' }],
      message: '파이프라인 실행이 시작되었습니다.',
    })
  })
})
