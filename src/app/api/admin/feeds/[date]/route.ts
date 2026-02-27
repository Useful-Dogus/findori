// TODO(#7): Admin 날짜별 이슈 목록 조회 구현

import { NextResponse } from 'next/server'

type Params = Promise<{ date: string }>

export async function GET(_request: Request, { params }: { params: Params }) {
  const { date } = await params
  return NextResponse.json({ date, issues: [] }, { status: 200 })
}
