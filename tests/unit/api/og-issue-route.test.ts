import { beforeEach, describe, expect, it, vi } from 'vitest'

const { mockGetPublicIssueById, imageResponseMock } = vi.hoisted(() => ({
  mockGetPublicIssueById: vi.fn(),
  imageResponseMock: vi.fn(function MockImageResponse(this: Record<string, unknown>, ...args) {
    this.args = args
  }),
}))

vi.mock('@/lib/public/feeds', () => ({
  getPublicIssueById: mockGetPublicIssueById,
}))

vi.mock('next/og', () => ({
  ImageResponse: imageResponseMock,
}))

import { GET } from '@/app/api/og/issue/[id]/route'

describe('GET /api/og/issue/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('공개 이슈가 있으면 ImageResponse를 반환한다', async () => {
    mockGetPublicIssueById.mockResolvedValue({
      id: 'issue-1',
      feedDate: '2026-03-20',
      entityType: 'stock',
      entityId: '005930',
      entityName: '삼성전자',
      title: '삼성전자 급등',
      changeValue: '+3.2%',
      channel: 'v1',
      tags: ['반도체'],
      cardsData: [
        {
          id: 1,
          type: 'cover',
          tag: '속보',
          title: '삼성전자 급등',
          sub: '외국인 순매수 확대',
          visual: {
            bg_from: '#0f172a',
            bg_via: '#1e3a5f',
            bg_to: '#0f172a',
            accent: '#3B82F6',
          },
        },
      ],
    })

    const response = await GET(new Request('http://localhost/api/og/issue/issue-1'), {
      params: Promise.resolve({ id: 'issue-1' }),
    })

    expect(mockGetPublicIssueById).toHaveBeenCalledWith('issue-1')
    expect(imageResponseMock).toHaveBeenCalled()
    expect(response).toBeInstanceOf(imageResponseMock as unknown as typeof Object)
  })

  it('이슈가 없으면 기본 OG 이미지로 리다이렉트한다', async () => {
    mockGetPublicIssueById.mockResolvedValue(null)

    const response = await GET(new Request('http://localhost/api/og/issue/missing'), {
      params: Promise.resolve({ id: 'missing' }),
    })

    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe('http://localhost/og-default.png')
  })
})
