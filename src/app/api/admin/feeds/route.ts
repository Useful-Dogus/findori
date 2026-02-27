// TODO(#9): Admin 피드 목록 조회 구현

import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({ feeds: [] }, { status: 200 })
}
