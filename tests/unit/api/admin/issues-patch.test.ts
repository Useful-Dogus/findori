/* @vitest-environment node */

import { beforeEach, describe, expect, it, vi } from 'vitest'

const { requireAdminSessionMock, updateIssueStatusMock } = vi.hoisted(() => ({
  requireAdminSessionMock: vi.fn(),
  updateIssueStatusMock: vi.fn(),
}))

const { TestIssueNotFoundError } = vi.hoisted(() => ({
  TestIssueNotFoundError: class TestIssueNotFoundError extends Error {},
}))

vi.mock('@/lib/admin/session', () => ({
  requireAdminSession: requireAdminSessionMock,
}))

vi.mock('@/lib/admin/issues', () => ({
  updateIssueStatus: updateIssueStatusMock,
  updateIssueCards: vi.fn(),
  IssueNotFoundError: TestIssueNotFoundError,
}))

import { PATCH } from '@/app/api/admin/issues/[id]/route'

describe('PATCH /api/admin/issues/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when the admin session is invalid', async () => {
    requireAdminSessionMock.mockResolvedValue({
      valid: false,
      response: Response.json({ error: 'unauthorized' }, { status: 401 }),
    })

    const response = await PATCH(new Request('http://localhost/api/admin/issues/issue-1'), {
      params: Promise.resolve({ id: 'issue-1' }),
    })

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual({ error: 'unauthorized' })
  })

  it('returns 400 when status is invalid', async () => {
    requireAdminSessionMock.mockResolvedValue({
      valid: true,
      payload: { sub: 'admin', iat: 1, exp: 2 },
    })

    const response = await PATCH(
      new Request('http://localhost/api/admin/issues/issue-1', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'bad-status' }),
      }),
      {
        params: Promise.resolve({ id: 'issue-1' }),
      },
    )

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      error: 'invalid_body',
      message: 'status는 draft, approved, rejected 중 하나여야 합니다',
    })
  })

  it('returns 200 with the updated status on success', async () => {
    requireAdminSessionMock.mockResolvedValue({
      valid: true,
      payload: { sub: 'admin', iat: 1, exp: 2 },
    })
    updateIssueStatusMock.mockResolvedValue(undefined)

    const response = await PATCH(
      new Request('http://localhost/api/admin/issues/issue-1', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'draft' }),
      }),
      {
        params: Promise.resolve({ id: 'issue-1' }),
      },
    )

    expect(updateIssueStatusMock).toHaveBeenCalledWith('issue-1', 'draft')
    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ id: 'issue-1', status: 'draft' })
  })

  it('returns 404 when the issue does not exist', async () => {
    requireAdminSessionMock.mockResolvedValue({
      valid: true,
      payload: { sub: 'admin', iat: 1, exp: 2 },
    })
    updateIssueStatusMock.mockRejectedValue(new TestIssueNotFoundError('missing'))

    const response = await PATCH(
      new Request('http://localhost/api/admin/issues/missing', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'approved' }),
      }),
      {
        params: Promise.resolve({ id: 'missing' }),
      },
    )

    expect(response.status).toBe(404)
    await expect(response.json()).resolves.toEqual({ error: 'not_found' })
  })

  it('returns 500 when the update fails', async () => {
    requireAdminSessionMock.mockResolvedValue({
      valid: true,
      payload: { sub: 'admin', iat: 1, exp: 2 },
    })
    updateIssueStatusMock.mockRejectedValue(new Error('db error'))

    const response = await PATCH(
      new Request('http://localhost/api/admin/issues/issue-1', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'approved' }),
      }),
      {
        params: Promise.resolve({ id: 'issue-1' }),
      },
    )

    expect(response.status).toBe(500)
    await expect(response.json()).resolves.toEqual({ error: 'internal_error' })
  })
})
