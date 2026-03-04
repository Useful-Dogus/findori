import { NextResponse } from 'next/server'

import { requireAdminSession } from '@/lib/admin/session'
import { listPipelineLogs } from '@/lib/pipeline'
import { createAdminClient } from '@/lib/supabase/admin'

function parsePositiveInteger(value: string | null, fallback: number) {
  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed < 1) {
    return fallback
  }

  return parsed
}

export async function GET(request: Request) {
  const session = await requireAdminSession(request)
  if (!session.valid) {
    return session.response
  }

  try {
    const url = new URL(request.url)
    const limit = Math.min(parsePositiveInteger(url.searchParams.get('limit'), 20), 100)
    const page = parsePositiveInteger(url.searchParams.get('page'), 1)

    const client = createAdminClient()
    const result = await listPipelineLogs(client, { page, limit })

    return NextResponse.json(
      {
        logs: result.logs,
        total: result.total,
        page,
        limit,
      },
      { status: 200 },
    )
  } catch (error) {
    return NextResponse.json(
      {
        error: 'pipeline_logs_failed',
        message: error instanceof Error ? error.message : 'unknown_error',
      },
      { status: 500 },
    )
  }
}
