// TODO(#6): 세션 쿠키 삭제 구현

import { NextResponse } from 'next/server'

export async function POST() {
  // TODO(#6): 세션 쿠키 삭제
  return NextResponse.json({ ok: true }, { status: 200 })
}
