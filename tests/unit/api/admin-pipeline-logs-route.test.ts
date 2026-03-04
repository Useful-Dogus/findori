/* @vitest-environment node */

import { beforeEach, describe, expect, it, vi } from 'vitest'

const { requireAdminSessionMock, listPipelineLogsMock, createAdminClientMock } = vi.hoisted(() => ({
  requireAdminSessionMock: vi.fn(),
  listPipelineLogsMock: vi.fn(),
  createAdminClientMock: vi.fn(),
}))

vi.mock('@/lib/admin/session', () => ({
  requireAdminSession: requireAdminSessionMock,
}))

vi.mock('@/lib/pipeline', () => ({
  listPipelineLogs: listPipelineLogsMock,
}))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: createAdminClientMock,
}))

import { GET } from '@/app/api/admin/pipeline/logs/route'

describe('GET /api/admin/pipeline/logs', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    createAdminClientMock.mockReturnValue({ name: 'admin-client' })
  })

  it('returns unauthorized when the admin session is missing', async () => {
    requireAdminSessionMock.mockResolvedValue({
      valid: false,
      response: Response.json({ error: 'unauthorized' }, { status: 401 }),
    })

    const response = await GET(new Request('http://localhost/api/admin/pipeline/logs'))

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual({ error: 'unauthorized' })
  })

  it('returns paginated logs and normalizes invalid query params', async () => {
    requireAdminSessionMock.mockResolvedValue({
      valid: true,
      payload: {
        sub: 'admin',
        iat: 1,
        exp: 2,
      },
    })
    listPipelineLogsMock.mockResolvedValue({
      logs: [
        {
          id: 'log-1',
          date: '2026-03-03',
          status: 'success',
          triggered_by: 'cron',
          started_at: '2026-03-03T01:00:00.000Z',
          completed_at: '2026-03-03T01:05:00.000Z',
          articles_collected: 3,
          issues_created: 1,
          errors: [],
        },
      ],
      total: 1,
    })

    const response = await GET(
      new Request('http://localhost/api/admin/pipeline/logs?limit=abc&page=0'),
    )

    expect(listPipelineLogsMock).toHaveBeenCalledWith(
      { name: 'admin-client' },
      { page: 1, limit: 20 },
    )
    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      logs: [
        {
          id: 'log-1',
          date: '2026-03-03',
          status: 'success',
          triggered_by: 'cron',
          started_at: '2026-03-03T01:00:00.000Z',
          completed_at: '2026-03-03T01:05:00.000Z',
          articles_collected: 3,
          issues_created: 1,
          errors: [],
        },
      ],
      total: 1,
      page: 1,
      limit: 20,
    })
  })
})
