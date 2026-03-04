import { NextResponse } from 'next/server'

import { requireAdminSession } from '@/lib/admin/session'
import { runPipeline } from '@/lib/pipeline'

export async function POST(request: Request) {
  const session = await requireAdminSession(request)
  if (!session.valid) {
    return session.response
  }

  try {
    const result = await runPipeline({ triggeredBy: 'admin' })

    if (result.kind === 'duplicate') {
      return NextResponse.json(
        {
          error: 'pipeline_already_running',
          started_at: result.log.started_at,
        },
        { status: 409 },
      )
    }

    return NextResponse.json(
      {
        ok: true,
        log_id: result.summary.log_id,
        date: result.summary.date,
        status: result.summary.status,
        articles_collected: result.summary.articles_collected,
        issues_created: result.summary.issues_created,
        errors: result.summary.errors,
        message: '파이프라인 실행이 시작되었습니다.',
      },
      { status: 202 },
    )
  } catch (error) {
    return NextResponse.json(
      {
        error: 'pipeline_failed',
        message: error instanceof Error ? error.message : 'unknown_error',
      },
      { status: 500 },
    )
  }
}
