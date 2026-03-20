import { describe, it, expect, vi, beforeEach } from 'vitest'

import {
  isValidDate,
  getLatestPublishedDate,
  getPreviousPublishedDate,
  getPublicFeedByDate,
  getPublicIssueById,
  type PublicIssueSummary,
  type PublicIssueDetail,
} from '@/lib/public/feeds'

// ── Supabase 클라이언트 모킹 ──────────────────────────────────────────────

const mockFrom = vi.fn()
const mockSelect = vi.fn()
const mockEq = vi.fn()
const mockOrder = vi.fn()
const mockLimit = vi.fn()
const mockMaybeSingle = vi.fn()
const mockIn = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() =>
    Promise.resolve({
      from: mockFrom,
    }),
  ),
}))

// ── 픽스처 ────────────────────────────────────────────────────────────────

const validVisual = {
  bg_from: '#0f172a',
  bg_via: '#1e3a5f',
  bg_to: '#0f172a',
  accent: '#3B82F6',
}

const validSource = { title: '기사', url: 'https://example.com', domain: 'example.com' }

const validCardsData = [
  {
    id: 1,
    type: 'cover',
    tag: '속보',
    title: '삼성전자 -2.1%',
    sub: '외국인 매도',
    visual: validVisual,
  },
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

// ── isValidDate ────────────────────────────────────────────────────────────

describe('isValidDate', () => {
  it('유효한 날짜를 허용한다', () => {
    expect(isValidDate('2026-03-12')).toBe(true)
    expect(isValidDate('2026-01-01')).toBe(true)
    expect(isValidDate('2025-12-31')).toBe(true)
  })

  it('YYYY-MM-DD 형식이 아닌 문자열을 거부한다', () => {
    expect(isValidDate('20260312')).toBe(false)
    expect(isValidDate('2026/03/12')).toBe(false)
    expect(isValidDate('2026-3-12')).toBe(false)
    expect(isValidDate('')).toBe(false)
    expect(isValidDate('abc')).toBe(false)
  })

  it('존재하지 않는 날짜를 거부한다', () => {
    expect(isValidDate('2026-02-30')).toBe(false)
    expect(isValidDate('2026-13-01')).toBe(false)
    expect(isValidDate('2026-00-01')).toBe(false)
  })
})

// ── getLatestPublishedDate ─────────────────────────────────────────────────

describe('getLatestPublishedDate', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  function setupLatestChain(result: { data: unknown; error: unknown }) {
    mockMaybeSingle.mockResolvedValue(result)
    mockLimit.mockReturnValue({ maybeSingle: mockMaybeSingle })
    mockOrder.mockReturnValue({ limit: mockLimit })
    mockEq.mockReturnValue({ order: mockOrder })
    mockSelect.mockReturnValue({ eq: mockEq })
    mockFrom.mockReturnValue({ select: mockSelect })
  }

  it('published 피드가 있으면 최신 날짜를 반환한다', async () => {
    setupLatestChain({ data: { date: '2026-03-12' }, error: null })
    const result = await getLatestPublishedDate()
    expect(result).toBe('2026-03-12')
  })

  it('published 피드가 없으면 null을 반환한다', async () => {
    setupLatestChain({ data: null, error: null })
    const result = await getLatestPublishedDate()
    expect(result).toBeNull()
  })

  it('DB 오류 시 에러를 던진다', async () => {
    setupLatestChain({ data: null, error: { message: 'connection failed' } })
    await expect(getLatestPublishedDate()).rejects.toThrow('feeds 조회 실패')
  })
})

describe('getPreviousPublishedDate', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  function setupPreviousChain(result: { data: unknown; error: unknown }) {
    mockMaybeSingle.mockResolvedValue(result)
    mockLimit.mockReturnValue({ maybeSingle: mockMaybeSingle })
    mockOrder.mockReturnValue({ limit: mockLimit })
    const mockLt = vi.fn().mockReturnValue({ order: mockOrder })
    mockEq.mockReturnValue({ lt: mockLt })
    mockSelect.mockReturnValue({ eq: mockEq })
    mockFrom.mockReturnValue({ select: mockSelect })
  }

  it('현재 날짜보다 이전의 최신 published 날짜를 반환한다', async () => {
    setupPreviousChain({ data: { date: '2026-03-19' }, error: null })

    const result = await getPreviousPublishedDate('2026-03-20')

    expect(result).toBe('2026-03-19')
  })

  it('이전 published 피드가 없으면 null을 반환한다', async () => {
    setupPreviousChain({ data: null, error: null })

    const result = await getPreviousPublishedDate('2026-03-20')

    expect(result).toBeNull()
  })

  it('DB 오류 시 에러를 던진다', async () => {
    setupPreviousChain({ data: null, error: { message: 'connection failed' } })

    await expect(getPreviousPublishedDate('2026-03-20')).rejects.toThrow('이전 feed 조회 실패')
  })
})

// ── getPublicFeedByDate ────────────────────────────────────────────────────

describe('getPublicFeedByDate', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('published 피드가 없으면 { feed: null, issues: [] }를 반환한다', async () => {
    // feeds 쿼리 체인: .select().eq().eq().maybeSingle()
    mockMaybeSingle.mockResolvedValueOnce({ data: null, error: null })
    const feedEq2 = vi.fn().mockReturnValue({ maybeSingle: mockMaybeSingle })
    const feedEq1 = vi.fn().mockReturnValue({ eq: feedEq2 })
    const feedSelect = vi.fn().mockReturnValue({ eq: feedEq1 })
    mockFrom.mockReturnValueOnce({ select: feedSelect })

    const result = await getPublicFeedByDate('2026-03-12')
    expect(result.feed).toBeNull()
    expect(result.issues).toEqual([])
  })

  it('published 피드와 approved 이슈를 올바르게 반환한다', async () => {
    const feedData = { id: 'feed-1', date: '2026-03-12' }
    const issueData = [
      {
        id: 'issue-1',
        entity_type: 'stock',
        entity_id: '005930',
        entity_name: '삼성전자',
        title: '삼성전자 -2.1%',
        change_value: '-2.1%',
        channel: 'v1',
        display_order: 1,
        cards_data: validCardsData,
      },
    ]
    const tagData = [{ issue_id: 'issue-1', tag_id: 'tag-1', tags: { name: '반도체' } }]

    // feeds 쿼리
    mockMaybeSingle.mockResolvedValueOnce({ data: feedData, error: null })
    const feedEq2 = vi.fn().mockReturnValue({ maybeSingle: mockMaybeSingle })
    const feedEq1 = vi.fn().mockReturnValue({ eq: feedEq2 })
    const feedSelect = vi.fn().mockReturnValue({ eq: feedEq1 })

    // issues 쿼리
    mockOrder.mockResolvedValueOnce({ data: issueData, error: null })
    const issueEq2 = vi.fn().mockReturnValue({ order: mockOrder })
    const issueEq1 = vi.fn().mockReturnValue({ eq: issueEq2 })
    const issueSelect = vi.fn().mockReturnValue({ eq: issueEq1 })

    // tags 쿼리
    mockIn.mockResolvedValueOnce({ data: tagData, error: null })
    const tagSelect = vi.fn().mockReturnValue({ in: mockIn })

    mockFrom
      .mockReturnValueOnce({ select: feedSelect })
      .mockReturnValueOnce({ select: issueSelect })
      .mockReturnValueOnce({ select: tagSelect })

    const result = await getPublicFeedByDate('2026-03-12')

    expect(result.feed).toEqual({ date: '2026-03-12' })
    expect(result.issues).toHaveLength(1)

    const issue = result.issues[0] as PublicIssueSummary
    expect(issue.id).toBe('issue-1')
    expect(issue.entityType).toBe('stock')
    expect(issue.entityName).toBe('삼성전자')
    expect(issue.changeValue).toBe('-2.1%')
    expect(issue.channel).toBe('v1')
    expect(issue.displayOrder).toBe(1)
    expect(issue.cardsData).not.toBeNull()
    expect(issue.tags).toEqual(['반도체'])
  })

  it('이슈가 없으면 빈 배열을 반환한다', async () => {
    const feedData = { id: 'feed-1', date: '2026-03-12' }

    mockMaybeSingle.mockResolvedValueOnce({ data: feedData, error: null })
    const feedEq2 = vi.fn().mockReturnValue({ maybeSingle: mockMaybeSingle })
    const feedEq1 = vi.fn().mockReturnValue({ eq: feedEq2 })
    const feedSelect = vi.fn().mockReturnValue({ eq: feedEq1 })

    mockOrder.mockResolvedValueOnce({ data: [], error: null })
    const issueEq2 = vi.fn().mockReturnValue({ order: mockOrder })
    const issueEq1 = vi.fn().mockReturnValue({ eq: issueEq2 })
    const issueSelect = vi.fn().mockReturnValue({ eq: issueEq1 })

    mockFrom
      .mockReturnValueOnce({ select: feedSelect })
      .mockReturnValueOnce({ select: issueSelect })

    const result = await getPublicFeedByDate('2026-03-12')
    expect(result.feed).toEqual({ date: '2026-03-12' })
    expect(result.issues).toEqual([])
  })

  it('cards_data가 null이면 cardsData: null을 반환한다', async () => {
    const feedData = { id: 'feed-1', date: '2026-03-12' }
    const issueData = [
      {
        id: 'issue-1',
        entity_type: 'stock',
        entity_id: '005930',
        entity_name: '삼성전자',
        title: '삼성전자',
        change_value: null,
        channel: 'v1',
        display_order: 1,
        cards_data: null,
      },
    ]

    mockMaybeSingle.mockResolvedValueOnce({ data: feedData, error: null })
    const feedEq2 = vi.fn().mockReturnValue({ maybeSingle: mockMaybeSingle })
    const feedEq1 = vi.fn().mockReturnValue({ eq: feedEq2 })
    const feedSelect = vi.fn().mockReturnValue({ eq: feedEq1 })

    mockOrder.mockResolvedValueOnce({ data: issueData, error: null })
    const issueEq2 = vi.fn().mockReturnValue({ order: mockOrder })
    const issueEq1 = vi.fn().mockReturnValue({ eq: issueEq2 })
    const issueSelect = vi.fn().mockReturnValue({ eq: issueEq1 })

    mockIn.mockResolvedValueOnce({ data: [], error: null })
    const tagSelect = vi.fn().mockReturnValue({ in: mockIn })

    mockFrom
      .mockReturnValueOnce({ select: feedSelect })
      .mockReturnValueOnce({ select: issueSelect })
      .mockReturnValueOnce({ select: tagSelect })

    const result = await getPublicFeedByDate('2026-03-12')
    expect(result.issues[0].cardsData).toBeNull()
    expect(result.issues[0].tags).toEqual([])
  })

  it('feeds 조회 오류 시 에러를 던진다', async () => {
    mockMaybeSingle.mockResolvedValueOnce({ data: null, error: { message: 'db error' } })
    const feedEq2 = vi.fn().mockReturnValue({ maybeSingle: mockMaybeSingle })
    const feedEq1 = vi.fn().mockReturnValue({ eq: feedEq2 })
    const feedSelect = vi.fn().mockReturnValue({ eq: feedEq1 })
    mockFrom.mockReturnValueOnce({ select: feedSelect })

    await expect(getPublicFeedByDate('2026-03-12')).rejects.toThrow('feed 조회 실패')
  })
})

// ── getPublicIssueById ─────────────────────────────────────────────────────

describe('getPublicIssueById', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('published 피드의 approved 이슈를 반환한다', async () => {
    const issueData = {
      id: 'issue-1',
      entity_type: 'stock',
      entity_id: '005930',
      entity_name: '삼성전자',
      title: '삼성전자 -2.1%',
      change_value: '-2.1%',
      channel: 'v1',
      cards_data: validCardsData,
      feeds: { date: '2026-03-12', status: 'published' },
    }
    const tagData = [{ issue_id: 'issue-1', tag_id: 'tag-1', tags: { name: '반도체' } }]

    mockMaybeSingle.mockResolvedValueOnce({ data: issueData, error: null })
    const issueEq2 = vi.fn().mockReturnValue({ maybeSingle: mockMaybeSingle })
    const issueEq1 = vi.fn().mockReturnValue({ eq: issueEq2 })
    const issueSelect = vi.fn().mockReturnValue({ eq: issueEq1 })

    mockIn.mockResolvedValueOnce({ data: tagData, error: null })
    const tagSelect = vi.fn().mockReturnValue({ in: mockIn })

    mockFrom.mockReturnValueOnce({ select: issueSelect }).mockReturnValueOnce({ select: tagSelect })

    const result = await getPublicIssueById('issue-1')

    expect(result).not.toBeNull()
    const detail = result as PublicIssueDetail
    expect(detail.id).toBe('issue-1')
    expect(detail.feedDate).toBe('2026-03-12')
    expect(detail.entityName).toBe('삼성전자')
    expect(detail.cardsData).not.toBeNull()
    expect(detail.tags).toEqual(['반도체'])
  })

  it('이슈가 없으면 null을 반환한다', async () => {
    mockMaybeSingle.mockResolvedValueOnce({ data: null, error: null })
    const issueEq2 = vi.fn().mockReturnValue({ maybeSingle: mockMaybeSingle })
    const issueEq1 = vi.fn().mockReturnValue({ eq: issueEq2 })
    const issueSelect = vi.fn().mockReturnValue({ eq: issueEq1 })
    mockFrom.mockReturnValueOnce({ select: issueSelect })

    const result = await getPublicIssueById('nonexistent')
    expect(result).toBeNull()
  })

  it('피드가 draft 상태이면 null을 반환한다', async () => {
    const issueData = {
      id: 'issue-1',
      entity_type: 'stock',
      entity_id: '005930',
      entity_name: '삼성전자',
      title: '삼성전자',
      change_value: null,
      channel: 'v1',
      cards_data: null,
      feeds: { date: '2026-03-12', status: 'draft' },
    }

    mockMaybeSingle.mockResolvedValueOnce({ data: issueData, error: null })
    const issueEq2 = vi.fn().mockReturnValue({ maybeSingle: mockMaybeSingle })
    const issueEq1 = vi.fn().mockReturnValue({ eq: issueEq2 })
    const issueSelect = vi.fn().mockReturnValue({ eq: issueEq1 })
    mockFrom.mockReturnValueOnce({ select: issueSelect })

    const result = await getPublicIssueById('issue-1')
    expect(result).toBeNull()
  })

  it('feeds가 null이면 null을 반환한다', async () => {
    const issueData = {
      id: 'issue-1',
      entity_type: 'stock',
      entity_id: '005930',
      entity_name: '삼성전자',
      title: '삼성전자',
      change_value: null,
      channel: 'v1',
      cards_data: null,
      feeds: null,
    }

    mockMaybeSingle.mockResolvedValueOnce({ data: issueData, error: null })
    const issueEq2 = vi.fn().mockReturnValue({ maybeSingle: mockMaybeSingle })
    const issueEq1 = vi.fn().mockReturnValue({ eq: issueEq2 })
    const issueSelect = vi.fn().mockReturnValue({ eq: issueEq1 })
    mockFrom.mockReturnValueOnce({ select: issueSelect })

    const result = await getPublicIssueById('issue-1')
    expect(result).toBeNull()
  })

  it('issue 조회 오류 시 에러를 던진다', async () => {
    mockMaybeSingle.mockResolvedValueOnce({ data: null, error: { message: 'db error' } })
    const issueEq2 = vi.fn().mockReturnValue({ maybeSingle: mockMaybeSingle })
    const issueEq1 = vi.fn().mockReturnValue({ eq: issueEq2 })
    const issueSelect = vi.fn().mockReturnValue({ eq: issueEq1 })
    mockFrom.mockReturnValueOnce({ select: issueSelect })

    await expect(getPublicIssueById('issue-1')).rejects.toThrow('issue 조회 실패')
  })
})
