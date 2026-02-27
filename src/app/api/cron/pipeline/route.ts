// Cron 파이프라인 엔드포인트 — Vercel Cron이 매일 KST 22:00 (UTC 13:00)에 호출
// TODO(#11): 실제 파이프라인 로직 구현

import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

export const maxDuration = 300 // Vercel Hobby 티어 최대 300초

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')

  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const startedAt = Date.now()

  // TODO(#11-#14): 실제 파이프라인 실행
  // 1. 화이트리스트 매체에서 기사 수집 (#12)
  // 2. Claude API로 cards[] 생성 (#13)
  // 3. Supabase에 draft 상태로 저장 (#11)

  const durationMs = Date.now() - startedAt

  return NextResponse.json(
    {
      ok: true,
      issues_created: 0,
      duration_ms: durationMs,
    },
    { status: 200 },
  )
}
