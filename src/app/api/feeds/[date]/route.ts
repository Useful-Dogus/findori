// TODO(#15): 실제 DB 조회로 교체

import { NextResponse } from 'next/server'

type Params = Promise<{ date: string }>

export async function GET(_request: Request, { params }: { params: Params }) {
  const { date } = await params

  // Stub: feed by date
  return NextResponse.json({ date, status: 'published', issues: [] }, { status: 200 })
}
