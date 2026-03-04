/* @vitest-environment node */

import { beforeEach, describe, expect, it, vi } from 'vitest'

const { requireAdminSessionMock, updateIssueCardsMock } = vi.hoisted(() => ({
  requireAdminSessionMock: vi.fn(),
  updateIssueCardsMock: vi.fn(),
}))

const { TestIssueNotFoundError } = vi.hoisted(() => ({
  TestIssueNotFoundError: class TestIssueNotFoundError extends Error {},
}))

vi.mock('@/lib/admin/session', () => ({
  requireAdminSession: requireAdminSessionMock,
}))

vi.mock('@/lib/admin/issues', () => ({
  updateIssueStatus: vi.fn(),
  updateIssueCards: updateIssueCardsMock,
  IssueNotFoundError: TestIssueNotFoundError,
}))

import { PUT } from '@/app/api/admin/issues/[id]/route'

const validVisual = {
  bg_from: '#0f172a',
  bg_via: '#1e3a5f',
  bg_to: '#0f172a',
  accent: '#3B82F6',
}

const validSource = { title: '기사', url: 'https://example.com', domain: 'example.com' }

const validCards = [
  { id: 1, type: 'cover', tag: '속보', title: '삼성전자 급등', sub: '+3.2%', visual: validVisual },
  {
    id: 2,
    type: 'reason',
    tag: '원인',
    title: '실적 기대',
    body: '외국인 매수가 늘었습니다.',
    visual: validVisual,
    sources: [validSource],
  },
  { id: 3, type: 'source', tag: '출처', sources: [validSource], visual: validVisual },
]

describe('PUT /api/admin/issues/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when the admin session is invalid', async () => {
    requireAdminSessionMock.mockResolvedValue({
      valid: false,
      response: Response.json({ error: 'unauthorized' }, { status: 401 }),
    })

    const response = await PUT(new Request('http://localhost/api/admin/issues/issue-1'), {
      params: Promise.resolve({ id: 'issue-1' }),
    })

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual({ error: 'unauthorized' })
  })

  it('returns 400 when cards are invalid', async () => {
    requireAdminSessionMock.mockResolvedValue({
      valid: true,
      payload: { sub: 'admin', iat: 1, exp: 2 },
    })

    const response = await PUT(
      new Request('http://localhost/api/admin/issues/issue-1', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cards: [{ id: 1, type: 'cover' }] }),
      }),
      {
        params: Promise.resolve({ id: 'issue-1' }),
      },
    )

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      error: 'invalid_body',
      message: expect.any(String),
    })
    expect(updateIssueCardsMock).not.toHaveBeenCalled()
  })

  it('returns 200 with the updated cards on success', async () => {
    requireAdminSessionMock.mockResolvedValue({
      valid: true,
      payload: { sub: 'admin', iat: 1, exp: 2 },
    })
    updateIssueCardsMock.mockResolvedValue(undefined)

    const response = await PUT(
      new Request('http://localhost/api/admin/issues/issue-1', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cards: validCards }),
      }),
      {
        params: Promise.resolve({ id: 'issue-1' }),
      },
    )

    expect(updateIssueCardsMock).toHaveBeenCalledWith('issue-1', validCards)
    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ id: 'issue-1', cards: validCards })
  })

  it('returns 404 when the issue does not exist', async () => {
    requireAdminSessionMock.mockResolvedValue({
      valid: true,
      payload: { sub: 'admin', iat: 1, exp: 2 },
    })
    updateIssueCardsMock.mockRejectedValue(new TestIssueNotFoundError('missing'))

    const response = await PUT(
      new Request('http://localhost/api/admin/issues/missing', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cards: validCards }),
      }),
      {
        params: Promise.resolve({ id: 'missing' }),
      },
    )

    expect(response.status).toBe(404)
    await expect(response.json()).resolves.toEqual({ error: 'not_found' })
  })

  it('returns 500 when saving cards fails', async () => {
    requireAdminSessionMock.mockResolvedValue({
      valid: true,
      payload: { sub: 'admin', iat: 1, exp: 2 },
    })
    updateIssueCardsMock.mockRejectedValue(new Error('db error'))

    const response = await PUT(
      new Request('http://localhost/api/admin/issues/issue-1', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cards: validCards }),
      }),
      {
        params: Promise.resolve({ id: 'issue-1' }),
      },
    )

    expect(response.status).toBe(500)
    await expect(response.json()).resolves.toEqual({ error: 'internal_error' })
  })
})
