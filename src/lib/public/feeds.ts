// 공개 피드 데이터 접근 함수
// 인증 없이 published 피드 + approved 이슈만 노출

import type { Card } from '@/types/cards'
import { parseCards } from '@/lib/cards'
import { createClient } from '@/lib/supabase/server'

// ── 날짜 유효성 검증 ──────────────────────────────────────────────────────

export function isValidDate(dateStr: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false
  const d = new Date(dateStr)
  return !isNaN(d.getTime()) && d.toISOString().startsWith(dateStr)
}

// ── 애플리케이션 레이어 타입 ───────────────────────────────────────────────

export type PublicIssueSummary = {
  id: string
  entityType: 'stock' | 'index' | 'fx' | 'theme'
  entityId: string
  entityName: string
  title: string
  changeValue: string | null
  channel: string
  displayOrder: number
  cardsData: Card[] | null
  tags: string[]
}

export type PublicIssueDetail = {
  id: string
  feedDate: string // YYYY-MM-DD
  entityType: 'stock' | 'index' | 'fx' | 'theme'
  entityId: string
  entityName: string
  title: string
  changeValue: string | null
  channel: string
  cardsData: Card[] | null
  tags: string[]
}

// ── 내부 DB 행 타입 ───────────────────────────────────────────────────────

type IssueRow = {
  id: string
  entity_type: 'stock' | 'index' | 'fx' | 'theme'
  entity_id: string
  entity_name: string
  title: string
  change_value: string | null
  channel: string
  display_order: number
  cards_data: unknown
}

type IssueTagRow = {
  issue_id: string
  tag_id: string
  tags: { name: string } | null
}

// ── 태그 배치 조회 헬퍼 ───────────────────────────────────────────────────

async function fetchTagsForIssues(
  supabase: Awaited<ReturnType<typeof createClient>>,
  issueIds: string[],
): Promise<Map<string, string[]>> {
  if (issueIds.length === 0) return new Map()

  const { data, error } = await supabase
    .from('issue_tags')
    .select('issue_id, tag_id, tags(name)')
    .in('issue_id', issueIds)

  if (error) {
    throw new Error(`tags 조회 실패: ${error.message}`)
  }

  const tagMap = new Map<string, string[]>()
  const rows = (data ?? []) as IssueTagRow[]

  for (const row of rows) {
    const tagName = row.tags?.name
    if (!tagName) continue
    const existing = tagMap.get(row.issue_id) ?? []
    existing.push(tagName)
    tagMap.set(row.issue_id, existing)
  }

  return tagMap
}

// ── 데이터 접근 함수 ──────────────────────────────────────────────────────

/**
 * 가장 최근 published 피드의 날짜 반환.
 * published 피드가 없으면 null 반환.
 */
export async function getLatestPublishedDate(): Promise<string | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('feeds')
    .select('date')
    .eq('status', 'published')
    .order('date', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    throw new Error(`feeds 조회 실패: ${error.message}`)
  }

  return (data as { date: string } | null)?.date ?? null
}

export async function getPreviousPublishedDate(date: string): Promise<string | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('feeds')
    .select('date')
    .eq('status', 'published')
    .lt('date', date)
    .order('date', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    throw new Error(`이전 feed 조회 실패: ${error.message}`)
  }

  return (data as { date: string } | null)?.date ?? null
}

/**
 * 날짜별 published 피드 + approved 이슈 목록 조회.
 * @param date 'YYYY-MM-DD' (호출 전 isValidDate로 검증 필수)
 * @returns feed가 없으면 null 반환
 */
export async function getPublicFeedByDate(date: string): Promise<{
  feed: { date: string } | null
  issues: PublicIssueSummary[]
}> {
  const supabase = await createClient()

  // Step 1: published 피드 조회
  const { data: feedData, error: feedError } = await supabase
    .from('feeds')
    .select('id, date')
    .eq('date', date)
    .eq('status', 'published')
    .maybeSingle()

  if (feedError) {
    throw new Error(`feed 조회 실패: ${feedError.message}`)
  }

  const feed = feedData as { id: string; date: string } | null

  if (!feed) {
    return { feed: null, issues: [] }
  }

  // Step 2: approved 이슈 조회
  const { data: issuesData, error: issuesError } = await supabase
    .from('issues')
    .select(
      'id, entity_type, entity_id, entity_name, title, change_value, channel, display_order, cards_data',
    )
    .eq('feed_id', feed.id)
    .eq('status', 'approved')
    .order('display_order', { ascending: true })

  if (issuesError) {
    throw new Error(`issues 조회 실패: ${issuesError.message}`)
  }

  const issueRows = (issuesData ?? []) as IssueRow[]

  // Step 3: 태그 배치 조회
  const tagMap = await fetchTagsForIssues(
    supabase,
    issueRows.map((r) => r.id),
  )

  const issues: PublicIssueSummary[] = issueRows.map((row) => {
    const parseResult = parseCards(row.cards_data)
    return {
      id: row.id,
      entityType: row.entity_type,
      entityId: row.entity_id,
      entityName: row.entity_name,
      title: row.title,
      changeValue: row.change_value,
      channel: row.channel,
      displayOrder: row.display_order,
      cardsData: parseResult.success ? parseResult.data : null,
      tags: tagMap.get(row.id) ?? [],
    }
  })

  return { feed: { date: feed.date }, issues }
}

/**
 * 단일 이슈 상세 조회 (공유 링크 진입용).
 * published 피드 + approved 이슈인 경우만 반환. 그 외 null.
 */
export async function getPublicIssueById(id: string): Promise<PublicIssueDetail | null> {
  const supabase = await createClient()

  // Step 1: approved 이슈 + 피드 날짜 조회
  const { data: issueData, error: issueError } = await supabase
    .from('issues')
    .select(
      'id, entity_type, entity_id, entity_name, title, change_value, channel, cards_data, feeds(date, status)',
    )
    .eq('id', id)
    .eq('status', 'approved')
    .maybeSingle()

  if (issueError) {
    throw new Error(`issue 조회 실패: ${issueError.message}`)
  }

  if (!issueData) return null

  type IssueWithFeed = IssueRow & {
    feeds: { date: string; status: string } | null
  }

  const row = issueData as IssueWithFeed

  // Step 2: 피드가 published 상태인지 확인
  if (!row.feeds || row.feeds.status !== 'published') return null

  const feedDate = row.feeds.date

  // Step 3: 태그 배치 조회
  const tagMap = await fetchTagsForIssues(supabase, [row.id])

  const parseResult = parseCards(row.cards_data)

  return {
    id: row.id,
    feedDate,
    entityType: row.entity_type,
    entityId: row.entity_id,
    entityName: row.entity_name,
    title: row.title,
    changeValue: row.change_value,
    channel: row.channel,
    cardsData: parseResult.success ? parseResult.data : null,
    tags: tagMap.get(row.id) ?? [],
  }
}
