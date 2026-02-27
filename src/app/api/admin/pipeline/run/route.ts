// TODO(#14): 파이프라인 수동 재실행 구현

import { NextResponse } from 'next/server'

export async function POST() {
  return NextResponse.json({ error: 'not_implemented' }, { status: 501 })
}
