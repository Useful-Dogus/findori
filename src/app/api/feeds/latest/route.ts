import { NextResponse } from 'next/server'

import { getLatestPublishedDate } from '@/lib/public/feeds'

export async function GET() {
  try {
    const date = await getLatestPublishedDate()
    return NextResponse.json({ date }, { status: 200 })
  } catch {
    return NextResponse.json({ error: 'internal_error' }, { status: 500 })
  }
}
