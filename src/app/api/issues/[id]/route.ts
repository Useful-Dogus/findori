// TODO(#15): 실제 DB 조회로 교체

import { NextResponse } from 'next/server'

type Params = Promise<{ id: string }>

export async function GET(_request: Request, { params }: { params: Params }) {
  const { id } = await params

  // Stub: issue by id
  return NextResponse.json({ error: 'not_implemented', id }, { status: 501 })
}
