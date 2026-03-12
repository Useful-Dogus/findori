import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET } from '@/app/api/issues/[id]/route'

// ── lib 모킹 ──────────────────────────────────────────────────────────────

const mockGetPublicIssueById = vi.fn()

vi.mock('@/lib/public/feeds', () => ({
  getPublicIssueById: (id: string) => mockGetPublicIssueById(id),
}))

// ── 헬퍼 ──────────────────────────────────────────────────────────────────

function makeParams(id: string) {
  return { params: Promise.resolve({ id }) }
}

// ── 테스트 ────────────────────────────────────────────────────────────────

describe('GET /api/issues/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('approved 이슈가 있으면 200 PublicIssueDetail을 반환한다', async () => {
    const issueDetail = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      feedDate: '2026-03-12',
      entityType: 'stock',
      entityId: '005930',
      entityName: '삼성전자',
      title: '삼성전자, 외국인 순매도로 -2.1%',
      changeValue: '-2.1%',
      channel: 'v1',
      cardsData: null,
      tags: ['반도체', '외국인'],
    }
    mockGetPublicIssueById.mockResolvedValue(issueDetail)

    const request = new Request(
      'http://localhost:3000/api/issues/550e8400-e29b-41d4-a716-446655440000',
    )
    const response = await GET(request, makeParams('550e8400-e29b-41d4-a716-446655440000'))
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body).toEqual(issueDetail)
    expect(mockGetPublicIssueById).toHaveBeenCalledWith('550e8400-e29b-41d4-a716-446655440000')
  })

  it('이슈가 없거나 비공개이면 404를 반환한다', async () => {
    mockGetPublicIssueById.mockResolvedValue(null)

    const request = new Request('http://localhost:3000/api/issues/nonexistent-id')
    const response = await GET(request, makeParams('nonexistent-id'))
    const body = await response.json()

    expect(response.status).toBe(404)
    expect(body).toHaveProperty('error', 'not_found')
    expect(body).toHaveProperty('message')
  })

  it('내부 오류 발생 시 500을 반환한다', async () => {
    mockGetPublicIssueById.mockRejectedValue(new Error('DB 오류'))

    const request = new Request('http://localhost:3000/api/issues/some-id')
    const response = await GET(request, makeParams('some-id'))
    const body = await response.json()

    expect(response.status).toBe(500)
    expect(body).toHaveProperty('error', 'internal_error')
  })
})
