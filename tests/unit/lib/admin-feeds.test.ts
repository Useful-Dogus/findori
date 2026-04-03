import { describe, it, expect, vi, beforeEach } from 'vitest'

import {
  getAdminFeeds,
  getAdminFeedByDate,
  isValidDate,
  type AdminFeedSummary,
  type AdminIssueSummary,
} from '@/lib/admin/feeds'

// ── Supabase 클라이언트 모킹 ──────────────────────────────────────────────

const mockSelect = vi.fn()
const mockOrder = vi.fn()
const mockLimit = vi.fn()
const mockEq = vi.fn()
const mockMaybeSingle = vi.fn()
const mockFrom = vi.fn()

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(() => ({
    from: mockFrom,
  })),
}))

// 쿼리 체인 헬퍼
function setupQueryChain(result: { data: unknown; error: unknown }) {
  mockLimit.mockResolvedValue(result)
  mockOrder.mockReturnValue({ limit: mockLimit })
  mockSelect.mockReturnValue({ order: mockOrder, eq: mockEq, maybeSingle: mockMaybeSingle })
  mockFrom.mockReturnValue({ select: mockSelect })
}

// ── 픽스처 ────────────────────────────────────────────────────────────────

const validVisual = {
  bg_from: '#0f172a',
  bg_via: '#1e3a5f',
  bg_to: '#0f172a',
  accent: '#3B82F6',
}

const validSource = { title: '기사 제목', url: 'https://example.com', domain: 'example.com' }

const validCardsData = [
  { id: 1, type: 'cover', tag: '속보', title: '삼성전자 급등', sub: '+3.2%', visual: validVisual },
  {
    id: 2,
    type: 'reason',
    tag: '원인',
    title: '이유',
    body: '본문',
    visual: validVisual,
    sources: [validSource],
  },
  { id: 3, type: 'source', tag: '출처', sources: [validSource], visual: validVisual },
]

// ── isValidDate 테스트 ────────────────────────────────────────────────────

describe('isValidDate', () => {
  it('유효한 날짜 형식을 허용한다', () => {
    expect(isValidDate('2026-03-03')).toBe(true)
    expect(isValidDate('2026-01-01')).toBe(true)
    expect(isValidDate('2025-12-31')).toBe(true)
  })

  it('YYYY-MM-DD 형식이 아닌 문자열을 거부한다', () => {
    expect(isValidDate('20260303')).toBe(false)
    expect(isValidDate('2026/03/03')).toBe(false)
    expect(isValidDate('2026-3-3')).toBe(false)
    expect(isValidDate('')).toBe(false)
    expect(isValidDate('abc')).toBe(false)
  })

  it('존재하지 않는 날짜를 거부한다', () => {
    expect(isValidDate('2026-02-30')).toBe(false)
    expect(isValidDate('2026-13-01')).toBe(false)
    expect(isValidDate('2026-00-01')).toBe(false)
  })
})

// ── getAdminFeeds 테스트 ─────────────────────────────────────────────────

describe('getAdminFeeds', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('피드 목록을 AdminFeedSummary[]로 매핑하여 반환한다', async () => {
    setupQueryChain({
      data: [
        {
          id: 'feed-1',
          date: '2026-03-03',
          status: 'draft',
          published_at: null,
          issues: [{ count: 5 }],
        },
        {
          id: 'feed-2',
          date: '2026-03-02',
          status: 'published',
          published_at: '2026-03-02T14:00:00Z',
          issues: [{ count: 3 }],
        },
      ],
      error: null,
    })

    const result = await getAdminFeeds()

    expect(result).toHaveLength(2)
    expect(result[0]).toEqual<AdminFeedSummary>({
      id: 'feed-1',
      date: '2026-03-03',
      status: 'draft',
      publishedAt: null,
      issueCount: 5,
      isOverdue: true,
    })
    expect(result[1]).toEqual<AdminFeedSummary>({
      id: 'feed-2',
      date: '2026-03-02',
      status: 'published',
      publishedAt: '2026-03-02T14:00:00Z',
      issueCount: 3,
      isOverdue: false,
    })
  })

  it('데이터가 없으면 빈 배열을 반환한다', async () => {
    setupQueryChain({ data: [], error: null })
    const result = await getAdminFeeds()
    expect(result).toEqual([])
  })

  it('data가 null이면 빈 배열을 반환한다', async () => {
    setupQueryChain({ data: null, error: null })
    const result = await getAdminFeeds()
    expect(result).toEqual([])
  })

  it('DB 오류 발생 시 에러를 던진다', async () => {
    setupQueryChain({ data: null, error: { message: 'connection failed' } })
    await expect(getAdminFeeds()).rejects.toThrow('feeds 조회 실패')
  })
})

// ── getAdminFeedByDate 테스트 ────────────────────────────────────────────

describe('getAdminFeedByDate', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('피드가 없는 날짜는 { feed: null, issues: [] }를 반환한다', async () => {
    // from('feeds').select(...).eq(...).maybeSingle() → null
    mockMaybeSingle.mockResolvedValue({ data: null, error: null })
    mockEq.mockReturnValue({ maybeSingle: mockMaybeSingle })
    mockSelect.mockReturnValue({ eq: mockEq })
    mockFrom.mockReturnValue({ select: mockSelect })

    const result = await getAdminFeedByDate('2026-01-01')

    expect(result.feed).toBeNull()
    expect(result.issues).toEqual([])
  })

  it('피드와 이슈를 올바르게 매핑한다', async () => {
    // feeds 쿼리 체인 설정
    const feedData = {
      id: 'feed-1',
      date: '2026-03-03',
      status: 'draft',
      published_at: null,
    }
    const issueData = [
      {
        id: 'issue-1',
        title: '삼성전자 +3.2% 급등',
        entity_name: '삼성전자',
        entity_type: 'stock',
        status: 'draft',
        display_order: 1,
        cards_data: validCardsData,
      },
    ]

    // feeds 호출 → maybeSingle 반환
    mockMaybeSingle.mockResolvedValueOnce({ data: feedData, error: null })
    const feedEq = vi.fn().mockReturnValue({ maybeSingle: mockMaybeSingle })
    const feedSelect = vi.fn().mockReturnValue({ eq: feedEq })

    // issues 호출 → order 반환
    mockOrder.mockResolvedValueOnce({ data: issueData, error: null })
    const issueEq = vi.fn().mockReturnValue({ order: mockOrder })
    const issueSelect = vi.fn().mockReturnValue({ eq: issueEq })

    mockFrom
      .mockReturnValueOnce({ select: feedSelect })
      .mockReturnValueOnce({ select: issueSelect })

    const result = await getAdminFeedByDate('2026-03-03')

    expect(result.feed).toEqual<AdminFeedSummary>({
      id: 'feed-1',
      date: '2026-03-03',
      status: 'draft',
      publishedAt: null,
      issueCount: 1,
      isOverdue: true,
    })

    expect(result.issues).toHaveLength(1)
    const issue = result.issues[0]
    expect(issue.id).toBe('issue-1')
    expect(issue.entityType).toBe('stock')
    expect(issue.cardCount).toBe(3)
    expect(issue.cardsParseError).toBe(false)
    expect(issue.cardsData).not.toBeNull()
  })

  it('cards_data가 null이면 cardsData: null, cardsParseError: false', async () => {
    const feedData = { id: 'feed-1', date: '2026-03-03', status: 'draft', published_at: null }
    const issueData = [
      {
        id: 'issue-1',
        title: '이슈',
        entity_name: '엔티티',
        entity_type: 'index',
        status: 'approved',
        display_order: 1,
        cards_data: null,
      },
    ]

    mockMaybeSingle.mockResolvedValueOnce({ data: feedData, error: null })
    const feedEq = vi.fn().mockReturnValue({ maybeSingle: mockMaybeSingle })
    const feedSelect = vi.fn().mockReturnValue({ eq: feedEq })

    mockOrder.mockResolvedValueOnce({ data: issueData, error: null })
    const issueEq = vi.fn().mockReturnValue({ order: mockOrder })
    const issueSelect = vi.fn().mockReturnValue({ eq: issueEq })

    mockFrom
      .mockReturnValueOnce({ select: feedSelect })
      .mockReturnValueOnce({ select: issueSelect })

    const result = await getAdminFeedByDate('2026-03-03')
    const issue = result.issues[0] as AdminIssueSummary

    expect(issue.cardsData).toBeNull()
    expect(issue.cardsParseError).toBe(false)
    expect(issue.cardCount).toBe(0)
  })

  it('cards_data가 있으나 파싱 실패하면 cardsParseError: true', async () => {
    const feedData = { id: 'feed-1', date: '2026-03-03', status: 'draft', published_at: null }
    const issueData = [
      {
        id: 'issue-1',
        title: '이슈',
        entity_name: '엔티티',
        entity_type: 'fx',
        status: 'draft',
        display_order: 1,
        cards_data: [{ invalid: 'data' }], // 잘못된 형식
      },
    ]

    mockMaybeSingle.mockResolvedValueOnce({ data: feedData, error: null })
    const feedEq = vi.fn().mockReturnValue({ maybeSingle: mockMaybeSingle })
    const feedSelect = vi.fn().mockReturnValue({ eq: feedEq })

    mockOrder.mockResolvedValueOnce({ data: issueData, error: null })
    const issueEq = vi.fn().mockReturnValue({ order: mockOrder })
    const issueSelect = vi.fn().mockReturnValue({ eq: issueEq })

    mockFrom
      .mockReturnValueOnce({ select: feedSelect })
      .mockReturnValueOnce({ select: issueSelect })

    const result = await getAdminFeedByDate('2026-03-03')
    const issue = result.issues[0] as AdminIssueSummary

    expect(issue.cardsData).toBeNull()
    expect(issue.cardsParseError).toBe(true)
  })

  it('feeds 조회 오류 시 에러를 던진다', async () => {
    mockMaybeSingle.mockResolvedValue({ data: null, error: { message: 'db error' } })
    mockEq.mockReturnValue({ maybeSingle: mockMaybeSingle })
    mockSelect.mockReturnValue({ eq: mockEq })
    mockFrom.mockReturnValue({ select: mockSelect })

    await expect(getAdminFeedByDate('2026-03-03')).rejects.toThrow('feed 조회 실패')
  })
})
