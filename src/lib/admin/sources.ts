// Admin 매체(media_sources) 데이터 접근 함수
// Server Components와 API Route Handler 양쪽에서 재사용

import { createAdminClient } from '@/lib/supabase/admin'

// ── 애플리케이션 레이어 타입 ───────────────────────────────────────────────

export type AdminMediaSource = {
  id: string
  name: string
  rssUrl: string
  active: boolean
  createdAt: string
}

// ── 에러 클래스 ──────────────────────────────────────────────────────────

export class SourceNotFoundError extends Error {
  constructor(id: string) {
    super(`media source not found: ${id}`)
    this.name = 'SourceNotFoundError'
  }
}

export class SourceDuplicateError extends Error {
  constructor(rssUrl: string) {
    super(`media source already exists: ${rssUrl}`)
    this.name = 'SourceDuplicateError'
  }
}

// ── 데이터 접근 함수 ──────────────────────────────────────────────────────

/**
 * 매체 목록 조회 — 등록 순서 기준, 전체 반환
 */
export async function getAdminSources(): Promise<AdminMediaSource[]> {
  const client = createAdminClient()

  const { data, error } = await client
    .from('media_sources')
    .select('id, name, rss_url, active, created_at')
    .order('created_at', { ascending: true })

  if (error) {
    throw new Error(`media_sources 조회 실패: ${error.message}`)
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    rssUrl: row.rss_url,
    active: row.active,
    createdAt: row.created_at,
  }))
}

/**
 * 매체 등록
 * @throws SourceDuplicateError — 동일한 rss_url이 이미 존재할 때
 */
export async function createSource(params: {
  name: string
  rssUrl: string
}): Promise<AdminMediaSource> {
  const client = createAdminClient()

  // 중복 확인
  const { data: existing, error: checkError } = await client
    .from('media_sources')
    .select('id')
    .eq('rss_url', params.rssUrl)
    .maybeSingle()

  if (checkError) {
    throw new Error(`중복 확인 실패: ${checkError.message}`)
  }

  if (existing) {
    throw new SourceDuplicateError(params.rssUrl)
  }

  const { data, error } = await client
    .from('media_sources')
    .insert({ name: params.name, rss_url: params.rssUrl })
    .select('id, name, rss_url, active, created_at')
    .single()

  if (error) {
    throw new Error(`media_sources 등록 실패: ${error.message}`)
  }

  return {
    id: data.id,
    name: data.name,
    rssUrl: data.rss_url,
    active: data.active,
    createdAt: data.created_at,
  }
}

/**
 * 매체 활성/비활성 토글 (PATCH)
 * @throws SourceNotFoundError — 해당 id의 매체가 없을 때
 */
export async function toggleSourceActive(id: string, active: boolean): Promise<AdminMediaSource> {
  const client = createAdminClient()

  const { data, error } = await client
    .from('media_sources')
    .update({ active })
    .eq('id', id)
    .select('id, name, rss_url, active, created_at')
    .maybeSingle()

  if (error) {
    throw new Error(`media_sources 업데이트 실패: ${error.message}`)
  }

  if (!data) {
    throw new SourceNotFoundError(id)
  }

  return {
    id: data.id,
    name: data.name,
    rssUrl: data.rss_url,
    active: data.active,
    createdAt: data.created_at,
  }
}
