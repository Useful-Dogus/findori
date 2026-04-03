import { NextResponse } from 'next/server'

import { getLatestPublishedDate } from '@/lib/public/feeds'

export async function GET() {
  try {
    const date = await getLatestPublishedDate()
    const response = NextResponse.json({ date }, { status: 200 })
    response.headers.set('Cache-Control', 's-maxage=300, stale-while-revalidate=3600')
    return response
  } catch {
    return NextResponse.json({ error: 'internal_error' }, { status: 500 })
  }
}
