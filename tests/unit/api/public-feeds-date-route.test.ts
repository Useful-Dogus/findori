import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET } from '@/app/api/feeds/[date]/route'
import type { PublicIssueSummary } from '@/lib/public/feeds'

// ── lib 모킹 ──────────────────────────────────────────────────────────────

const mockGetPublicFeedByDate = vi.fn()

vi.mock('@/lib/public/feeds', () => ({
  isValidDate: (d: string) => /^\d{4}-\d{2}-\d{2}$/.test(d) && !isNaN(new Date(d).getTime()),
  getPublicFeedByDate: (date: string) => mockGetPublicFeedByDate(date),
}))

// ── 헬퍼 ──────────────────────────────────────────────────────────────────

function makeRequest(date: string) {
  return { params: Promise.resolve({ date }) } as Parameters<typeof GET>[1]
}

const sampleIssue: PublicIssueSummary = {
  id: 'issue-1',
  entityType: 'stock',
  entityId: '005930',
  entityName: '삼성전자',
  title: '삼성전자 -2.1%',
  changeValue: '-2.1%',
  channel: 'v1',
  displayOrder: 1,
  cardsData: null,
  tags: ['반도체'],
}

// ── 테스트 ────────────────────────────────────────────────────────────────

describe('GET /api/feeds/[date]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('정상 요청 시 200 { date, issues[] }를 반환한다', async () => {
    mockGetPublicFeedByDate.mockResolvedValue({
      feed: { date: '2026-03-12' },
      issues: [sampleIssue],
    })

    const response = await GET(new Request('http://localhost'), makeRequest('2026-03-12'))
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.date).toBe('2026-03-12')
    expect(body.issues).toHaveLength(1)
    expect(body.issues[0].entityName).toBe('삼성전자')
  })

  it('이슈가 없는 날짜도 200 { date, issues: [] }를 반환한다', async () => {
    mockGetPublicFeedByDate.mockResolvedValue({
      feed: { date: '2026-03-12' },
      issues: [],
    })

    const response = await GET(new Request('http://localhost'), makeRequest('2026-03-12'))
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.issues).toEqual([])
  })

  it('잘못된 날짜 형식이면 400을 반환한다', async () => {
    const response = await GET(new Request('http://localhost'), makeRequest('20260312'))
    const body = await response.json()

    expect(response.status).toBe(400)
    expect(body).toHaveProperty('error', 'invalid_date')
    expect(mockGetPublicFeedByDate).not.toHaveBeenCalled()
  })

  it('존재하지 않는 날짜 형식도 400을 반환한다', async () => {
    const response = await GET(new Request('http://localhost'), makeRequest('2026-13-01'))
    const body = await response.json()

    expect(response.status).toBe(400)
    expect(body).toHaveProperty('error', 'invalid_date')
  })

  it('published 피드가 없으면 404를 반환한다', async () => {
    mockGetPublicFeedByDate.mockResolvedValue({ feed: null, issues: [] })

    const response = await GET(new Request('http://localhost'), makeRequest('2026-03-12'))
    const body = await response.json()

    expect(response.status).toBe(404)
    expect(body).toHaveProperty('error', 'not_found')
  })

  it('내부 오류 발생 시 500을 반환한다', async () => {
    mockGetPublicFeedByDate.mockRejectedValue(new Error('DB 오류'))

    const response = await GET(new Request('http://localhost'), makeRequest('2026-03-12'))
    const body = await response.json()

    expect(response.status).toBe(500)
    expect(body).toHaveProperty('error', 'internal_error')
  })
})
