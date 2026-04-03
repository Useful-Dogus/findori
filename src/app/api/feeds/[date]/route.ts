import { NextResponse } from 'next/server'

import { getPublicFeedByDate, isValidDate } from '@/lib/public/feeds'

type Params = Promise<{ date: string }>

export async function GET(_request: Request, { params }: { params: Params }) {
  const { date } = await params

  if (!isValidDate(date)) {
    return NextResponse.json(
      { error: 'invalid_date', message: '날짜 형식은 YYYY-MM-DD여야 합니다' },
      { status: 400 },
    )
  }

  try {
    const result = await getPublicFeedByDate(date)

    if (result.feed === null) {
      return NextResponse.json(
        { error: 'not_found', message: '해당 날짜의 발행된 피드가 없습니다' },
        { status: 404 },
      )
    }

    // 과거 날짜 피드는 내용이 변경되지 않으므로 24시간 캐시
    const response = NextResponse.json(
      { date: result.feed.date, issues: result.issues },
      { status: 200 },
    )
    response.headers.set('Cache-Control', 's-maxage=86400, stale-while-revalidate=604800')
    return response
  } catch {
    return NextResponse.json({ error: 'internal_error' }, { status: 500 })
  }
}
