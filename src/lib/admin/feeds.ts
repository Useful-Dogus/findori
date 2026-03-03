// Admin 피드/이슈 데이터 접근 함수
// Server Components와 API Route Handler 양쪽에서 재사용

import type { Card } from '@/types/cards'
import { parseCards } from '@/lib/cards'
import { createClient } from '@/lib/supabase/server'

type FeedListRow = {
  id: string
  date: string
  status: 'draft' | 'published'
  published_at: string | null
  issues: Array<{ count: number }> | null
}

type FeedRow = {
  id: string
  date: string
  status: 'draft' | 'published'
  published_at: string | null
}

type IssueRow = {
  id: string
  title: string
  entity_name: string
  entity_type: 'stock' | 'index' | 'fx' | 'theme'
  status: 'draft' | 'approved' | 'rejected'
  display_order: number
  cards_data: unknown
}

// ── 애플리케이션 레이어 타입 ───────────────────────────────────────────────

export type AdminFeedSummary = {
  id: string
  date: string // 'YYYY-MM-DD'
  status: 'draft' | 'published'
  publishedAt: string | null // ISO 8601
  issueCount: number
}

export type AdminIssueSummary = {
  id: string
  title: string
  entityName: string
  entityType: 'stock' | 'index' | 'fx' | 'theme'
  status: 'draft' | 'approved' | 'rejected'
  displayOrder: number
  cardCount: number
  cardsData: Card[] | null // parseCards 성공 시 Card[], 실패 또는 null이면 null
  cardsParseError: boolean // cards_data가 있으나 파싱 실패 시 true
}

// ── 날짜 유효성 검증 ──────────────────────────────────────────────────────

export function isValidDate(dateStr: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false
  const d = new Date(dateStr)
  return !isNaN(d.getTime()) && d.toISOString().startsWith(dateStr)
}

// ── 데이터 접근 함수 ──────────────────────────────────────────────────────

/**
 * 피드 목록 조회 — 최신 날짜 우선, limit 30
 * issues(count) 집계로 N+1 방지
 */
export async function getAdminFeeds(): Promise<AdminFeedSummary[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('feeds')
    .select(
      `
      id,
      date,
      status,
      published_at,
      issues(count)
    `,
    )
    .order('date', { ascending: false })
    .limit(30)

  if (error) {
    throw new Error(`feeds 조회 실패: ${error.message}`)
  }

  const rows = (data ?? []) as FeedListRow[]

  if (rows.length === 0) {
    return []
  }

  return rows.map((row) => {
    // Supabase 집계: issues(count) → [{ count: N }] 형태
    const countRow = row.issues?.[0]
    const issueCount = countRow?.count ?? 0

    return {
      id: row.id,
      date: row.date,
      status: row.status,
      publishedAt: row.published_at,
      issueCount,
    }
  })
}

/**
 * 날짜별 피드 + 이슈 목록 조회
 * @param date 'YYYY-MM-DD' 형식 (호출 전 isValidDate로 검증 필수)
 */
export async function getAdminFeedByDate(date: string): Promise<{
  feed: AdminFeedSummary | null
  issues: AdminIssueSummary[]
}> {
  const supabase = await createClient()

  // Step 1: 피드 조회
  const { data: feedData, error: feedError } = await supabase
    .from('feeds')
    .select('id, date, status, published_at')
    .eq('date', date)
    .maybeSingle()

  if (feedError) {
    throw new Error(`feed 조회 실패: ${feedError.message}`)
  }

  const feedRow = feedData as FeedRow | null

  if (!feedRow) {
    return { feed: null, issues: [] }
  }

  // Step 2: 이슈 조회 (feed.id 사용)
  const { data: issuesData, error: issuesError } = await supabase
    .from('issues')
    .select('id, title, entity_name, entity_type, status, display_order, cards_data')
    .eq('feed_id', feedRow.id)
    .order('display_order', { ascending: true })

  if (issuesError) {
    throw new Error(`issues 조회 실패: ${issuesError.message}`)
  }

  // Step 3: 피드의 이슈 수 계산
  const issueRows = (issuesData ?? []) as IssueRow[]
  const issueCount = issueRows.length

  const feed: AdminFeedSummary = {
    id: feedRow.id,
    date: feedRow.date,
    status: feedRow.status,
    publishedAt: feedRow.published_at,
    issueCount,
  }

  const issues: AdminIssueSummary[] = issueRows.map((row) => {
    const parseResult = parseCards(row.cards_data)

    let cardsData: Card[] | null = null
    let cardsParseError = false

    if (parseResult.success) {
      cardsData = parseResult.data
    } else {
      // cards_data가 있으나 파싱 실패
      cardsParseError = row.cards_data !== null
    }

    return {
      id: row.id,
      title: row.title,
      entityName: row.entity_name,
      entityType: row.entity_type,
      status: row.status,
      displayOrder: row.display_order,
      cardCount: Array.isArray(cardsData) ? cardsData.length : 0,
      cardsData,
      cardsParseError,
    }
  })

  return { feed, issues }
}
