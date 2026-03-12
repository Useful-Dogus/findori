import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET } from '@/app/api/feeds/latest/route'

// ── lib 모킹 ──────────────────────────────────────────────────────────────

const mockGetLatestPublishedDate = vi.fn()

vi.mock('@/lib/public/feeds', () => ({
  getLatestPublishedDate: () => mockGetLatestPublishedDate(),
}))

// ── 테스트 ────────────────────────────────────────────────────────────────

describe('GET /api/feeds/latest', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('published 피드가 있으면 200 { date }를 반환한다', async () => {
    mockGetLatestPublishedDate.mockResolvedValue('2026-03-12')

    const response = await GET()
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body).toEqual({ date: '2026-03-12' })
  })

  it('published 피드가 없으면 200 { date: null }을 반환한다', async () => {
    mockGetLatestPublishedDate.mockResolvedValue(null)

    const response = await GET()
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body).toEqual({ date: null })
  })

  it('내부 오류 발생 시 500을 반환한다', async () => {
    mockGetLatestPublishedDate.mockRejectedValue(new Error('DB 오류'))

    const response = await GET()
    const body = await response.json()

    expect(response.status).toBe(500)
    expect(body).toHaveProperty('error', 'internal_error')
  })
})
