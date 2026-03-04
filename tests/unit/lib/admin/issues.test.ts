import { beforeEach, describe, expect, it, vi } from 'vitest'

import { IssueNotFoundError, updateIssueCards, updateIssueStatus } from '@/lib/admin/issues'

const { mockMaybeSingle, mockSelect, mockEq, mockUpdate, mockFrom, createAdminClientMock } =
  vi.hoisted(() => ({
    mockMaybeSingle: vi.fn(),
    mockSelect: vi.fn(),
    mockEq: vi.fn(),
    mockUpdate: vi.fn(),
    mockFrom: vi.fn(),
    createAdminClientMock: vi.fn(),
  }))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: createAdminClientMock,
}))

describe('lib/admin/issues', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    mockSelect.mockReturnValue({ maybeSingle: mockMaybeSingle })
    mockEq.mockReturnValue({ select: mockSelect })
    mockUpdate.mockReturnValue({ eq: mockEq })
    mockFrom.mockReturnValue({ update: mockUpdate })
    createAdminClientMock.mockReturnValue({ from: mockFrom })
  })

  it('updates the issue status', async () => {
    mockMaybeSingle.mockResolvedValue({ data: { id: 'issue-1' }, error: null })

    await expect(updateIssueStatus('issue-1', 'approved')).resolves.toBeUndefined()

    expect(mockFrom).toHaveBeenCalledWith('issues')
    expect(mockUpdate).toHaveBeenCalledWith({ status: 'approved' })
    expect(mockEq).toHaveBeenCalledWith('id', 'issue-1')
  })

  it('throws IssueNotFoundError when no row is updated', async () => {
    mockMaybeSingle.mockResolvedValue({ data: null, error: null })

    await expect(updateIssueStatus('missing', 'approved')).rejects.toBeInstanceOf(
      IssueNotFoundError,
    )
  })

  it('throws when the database returns an error for status updates', async () => {
    mockMaybeSingle.mockResolvedValue({ data: null, error: { message: 'db down' } })

    await expect(updateIssueStatus('issue-1', 'approved')).rejects.toThrow('status 업데이트 실패')
  })

  it('updates cards_data with the full card array', async () => {
    mockMaybeSingle.mockResolvedValue({ data: { id: 'issue-1' }, error: null })
    const cards = [
      {
        id: 1,
        type: 'cover' as const,
        tag: '속보',
        title: '삼성전자 급등',
        sub: '+3.2%',
        visual: {
          bg_from: '#0f172a',
          bg_via: '#1e3a5f',
          bg_to: '#0f172a',
          accent: '#3B82F6',
        },
      },
    ]

    await expect(updateIssueCards('issue-1', cards)).resolves.toBeUndefined()

    expect(mockUpdate).toHaveBeenCalledWith({ cards_data: cards })
  })

  it('throws when the database returns an error for card updates', async () => {
    mockMaybeSingle.mockResolvedValue({ data: null, error: { message: 'write failed' } })

    await expect(updateIssueCards('issue-1', [])).rejects.toThrow('cards 업데이트 실패')
  })
})
