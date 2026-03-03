import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { runPipeline } from '@/lib/pipeline'

export const maxDuration = 300 // Vercel Hobby 티어 최대 300초

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  try {
    const result = await runPipeline({ triggeredBy: 'cron' })

    if (result.kind === 'duplicate') {
      return NextResponse.json(
        {
          error: 'pipeline_already_running',
          started_at: result.log.started_at,
        },
        { status: 409 },
      )
    }

    return NextResponse.json(result.summary, { status: 200 })
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
