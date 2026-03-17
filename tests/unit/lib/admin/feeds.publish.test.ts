import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  FeedAlreadyPublishedError,
  FeedNotFoundError,
  NoApprovedIssuesError,
  publishFeed,
} from '@/lib/admin/feeds'

// ── 모킹 ──────────────────────────────────────────────────────────────────

const {
  // feeds 조회 체인: from('feeds').select().eq().maybeSingle()
  mockFeedReadMaybeSingle,
  mockFeedReadEq,
  mockFeedReadSelect,
  // issues count 체인: from('issues').select(_, {count}).eq().eq()
  // 마지막 .eq()가 await의 대상 → mockIssueEq2 자체가 Promise를 반환
  mockIssueEq2,
  mockIssueEq1,
  mockIssueSelect,
  // feeds 업데이트 체인: from('feeds').update().eq().eq().select().maybeSingle()
  mockFeedUpdateMaybeSingle,
  mockFeedUpdateSelect,
  mockFeedUpdateEq2,
  mockFeedUpdateEq1,
  mockFeedUpdate,
  mockFrom,
  createAdminClientMock,
} = vi.hoisted(() => ({
  mockFeedReadMaybeSingle: vi.fn(),
  mockFeedReadEq: vi.fn(),
  mockFeedReadSelect: vi.fn(),
  mockIssueEq2: vi.fn(),
  mockIssueEq1: vi.fn(),
  mockIssueSelect: vi.fn(),
  mockFeedUpdateMaybeSingle: vi.fn(),
  mockFeedUpdateSelect: vi.fn(),
  mockFeedUpdateEq2: vi.fn(),
  mockFeedUpdateEq1: vi.fn(),
  mockFeedUpdate: vi.fn(),
  mockFrom: vi.fn(),
  createAdminClientMock: vi.fn(),
}))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: createAdminClientMock,
}))

// ── 체인 빌더 ─────────────────────────────────────────────────────────────

function buildFeedReadChain() {
  // .select('id, date, status').eq('date', date).maybeSingle()
  mockFeedReadEq.mockReturnValue({ maybeSingle: mockFeedReadMaybeSingle })
  mockFeedReadSelect.mockReturnValue({ eq: mockFeedReadEq })
  return { select: mockFeedReadSelect }
}

function buildIssueCountChain() {
  // .select('id', { count: 'exact', head: true }).eq('feed_id', id).eq('status', 'approved')
  // 마지막 eq() 호출이 await 되므로 mockIssueEq2는 Promise를 반환해야 함
  mockIssueEq1.mockReturnValue({ eq: mockIssueEq2 })
  mockIssueSelect.mockReturnValue({ eq: mockIssueEq1 })
  return { select: mockIssueSelect }
}

function buildFeedUpdateChain() {
  // .update({...}).eq('id', id).eq('status', 'draft').select(...).maybeSingle()
  mockFeedUpdateSelect.mockReturnValue({ maybeSingle: mockFeedUpdateMaybeSingle })
  mockFeedUpdateEq2.mockReturnValue({ select: mockFeedUpdateSelect })
  mockFeedUpdateEq1.mockReturnValue({ eq: mockFeedUpdateEq2 })
  mockFeedUpdate.mockReturnValue({ eq: mockFeedUpdateEq1 })
  return { update: mockFeedUpdate }
}

// ── 테스트 데이터 ──────────────────────────────────────────────────────────

const DRAFT_FEED = { id: 'feed-1', date: '2026-03-17', status: 'draft' }
const PUBLISHED_RESULT = {
  date: '2026-03-17',
  status: 'published',
  published_at: '2026-03-17T14:00:00.000Z',
}

// ── 테스트 ────────────────────────────────────────────────────────────────

describe('publishFeed()', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    createAdminClientMock.mockReturnValue({ from: mockFrom })
  })

  it('happy path: draft 피드 + approved 이슈 존재 → published 전환', async () => {
    let feedCallCount = 0
    mockFrom.mockImplementation((table: string) => {
      if (table === 'feeds') {
        feedCallCount++
        return feedCallCount === 1 ? buildFeedReadChain() : buildFeedUpdateChain()
      }
      return buildIssueCountChain()
    })

    mockFeedReadMaybeSingle.mockResolvedValue({ data: DRAFT_FEED, error: null })
    mockIssueEq2.mockResolvedValue({ count: 3, error: null })
    mockFeedUpdateMaybeSingle.mockResolvedValue({ data: PUBLISHED_RESULT, error: null })

    const result = await publishFeed('2026-03-17')

    expect(result.date).toBe('2026-03-17')
    expect(result.status).toBe('published')
    expect(result.publishedAt).toBe('2026-03-17T14:00:00.000Z')
  })

  it('FeedNotFoundError: 해당 날짜 피드 없음', async () => {
    mockFrom.mockReturnValue(buildFeedReadChain())
    mockFeedReadMaybeSingle.mockResolvedValue({ data: null, error: null })

    await expect(publishFeed('2026-01-01')).rejects.toBeInstanceOf(FeedNotFoundError)
  })

  it('FeedAlreadyPublishedError: 이미 published 상태인 피드', async () => {
    mockFrom.mockReturnValue(buildFeedReadChain())
    mockFeedReadMaybeSingle.mockResolvedValue({
      data: { id: 'feed-1', date: '2026-03-17', status: 'published' },
      error: null,
    })

    await expect(publishFeed('2026-03-17')).rejects.toBeInstanceOf(FeedAlreadyPublishedError)
  })

  it('NoApprovedIssuesError: approved 이슈 0건', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'feeds') return buildFeedReadChain()
      return buildIssueCountChain()
    })

    mockFeedReadMaybeSingle.mockResolvedValue({ data: DRAFT_FEED, error: null })
    mockIssueEq2.mockResolvedValue({ count: 0, error: null })

    await expect(publishFeed('2026-03-17')).rejects.toBeInstanceOf(NoApprovedIssuesError)
  })
})
