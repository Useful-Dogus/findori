// TODO(#10): 화이트리스트 매체 관리 구현

import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({ sources: [] }, { status: 200 })
}

export async function POST() {
  return NextResponse.json({ error: 'not_implemented' }, { status: 501 })
}
