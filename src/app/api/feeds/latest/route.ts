// TODO(#15): 실제 DB 조회로 교체

import { NextResponse } from 'next/server'

export async function GET() {
  // Stub: latest published feed date
  return NextResponse.json({ date: null }, { status: 200 })
}
