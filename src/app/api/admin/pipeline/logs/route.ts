// TODO(#14): 파이프라인 실행 로그 조회 구현

import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({ logs: [] }, { status: 200 })
}
