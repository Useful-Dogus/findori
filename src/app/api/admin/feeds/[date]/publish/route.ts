import { NextResponse } from 'next/server'

import {
  FeedAlreadyPublishedError,
  FeedNotFoundError,
  NoApprovedIssuesError,
  isValidDate,
  publishFeed,
} from '@/lib/admin/feeds'
import { requireAdminSession } from '@/lib/admin/session'

type Params = Promise<{ date: string }>

export async function POST(request: Request, { params }: { params: Params }) {
  const session = await requireAdminSession(request)
  if (!session.valid) {
    return session.response
  }

  const { date } = await params

  if (!isValidDate(date)) {
    return NextResponse.json(
      { error: 'invalid_date', message: '날짜 형식은 YYYY-MM-DD여야 합니다' },
      { status: 400 },
    )
  }

  try {
    const result = await publishFeed(date)
    return NextResponse.json(result, { status: 200 })
  } catch (error) {
    if (error instanceof FeedNotFoundError) {
      return NextResponse.json({ error: 'not_found' }, { status: 404 })
    }
    if (error instanceof FeedAlreadyPublishedError) {
      return NextResponse.json({ error: 'already_published' }, { status: 409 })
    }
    if (error instanceof NoApprovedIssuesError) {
      return NextResponse.json({ error: 'no_approved_issues' }, { status: 422 })
    }
    return NextResponse.json({ error: 'internal_error' }, { status: 500 })
  }
}
