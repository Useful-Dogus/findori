import { describe, expect, it, vi, beforeEach } from 'vitest'

const mockRequireAdminSession = vi.fn()
const mockGetAdminFeeds = vi.fn()
const mockGetAdminFeedByDate = vi.fn()

vi.mock('@/lib/admin/session', () => ({
  requireAdminSession: mockRequireAdminSession,
}))

vi.mock('@/lib/admin/feeds', () => ({
  getAdminFeeds: mockGetAdminFeeds,
  getAdminFeedByDate: mockGetAdminFeedByDate,
  isValidDate: (date: string) => /^\d{4}-\d{2}-\d{2}$/.test(date),
}))

const { GET: getAdminFeedsRoute } = await import('@/app/api/admin/feeds/route')
const { GET: getAdminFeedByDateRoute } = await import('@/app/api/admin/feeds/[date]/route')

describe('admin feed review routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRequireAdminSession.mockResolvedValue({ valid: true, payload: { sub: 'admin' } })
  })

  it('GET /api/admin/feeds returns feed summaries', async () => {
    mockGetAdminFeeds.mockResolvedValue([
      {
        id: 'feed-1',
        date: '2026-03-03',
        status: 'draft',
        publishedAt: null,
        issueCount: 2,
      },
    ])

    const response = await getAdminFeedsRoute(new Request('http://localhost/api/admin/feeds'))
    const body = (await response.json()) as { feeds: Array<{ id: string }> }

    expect(response.status).toBe(200)
    expect(body.feeds).toHaveLength(1)
    expect(body.feeds[0]?.id).toBe('feed-1')
  })

  it('GET /api/admin/feeds/[date] returns feed detail and issues', async () => {
    mockGetAdminFeedByDate.mockResolvedValue({
      feed: {
        id: 'feed-1',
        date: '2026-03-03',
        status: 'draft',
        publishedAt: null,
        issueCount: 1,
      },
      issues: [
        {
          id: 'issue-1',
          title: '삼성전자 +3.2% 급등',
          entityName: '삼성전자',
          entityType: 'stock',
          status: 'approved',
          displayOrder: 1,
          cardCount: 3,
          cardsData: [],
          cardsParseError: false,
        },
      ],
    })

    const response = await getAdminFeedByDateRoute(
      new Request('http://localhost/api/admin/feeds/2026-03-03'),
      {
        params: Promise.resolve({ date: '2026-03-03' }),
      },
    )
    const body = (await response.json()) as { date: string; issues: Array<{ id: string }> }

    expect(response.status).toBe(200)
    expect(body.date).toBe('2026-03-03')
    expect(body.issues[0]?.id).toBe('issue-1')
  })

  it('invalid date returns 400 before querying data', async () => {
    const response = await getAdminFeedByDateRoute(
      new Request('http://localhost/api/admin/feeds/not-a-date'),
      {
        params: Promise.resolve({ date: 'not-a-date' }),
      },
    )
    const body = (await response.json()) as { error: string }

    expect(response.status).toBe(400)
    expect(body.error).toBe('invalid_date')
    expect(mockGetAdminFeedByDate).not.toHaveBeenCalled()
  })
})
