import { NextResponse } from 'next/server'

import { getAdminFeedByDate, isValidDate } from '@/lib/admin/feeds'
import { requireAdminSession } from '@/lib/admin/session'

type Params = Promise<{ date: string }>

export async function GET(request: Request, { params }: { params: Params }) {
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
    const { feed, issues } = await getAdminFeedByDate(date)
    return NextResponse.json({ date, feed, issues }, { status: 200 })
  } catch {
    return NextResponse.json({ error: 'internal_error' }, { status: 500 })
  }
}
