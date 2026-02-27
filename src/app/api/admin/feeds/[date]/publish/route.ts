// TODO(#9): Admin 피드 발행 워크플로우 구현

import { NextResponse } from 'next/server'

type Params = Promise<{ date: string }>

export async function POST(_request: Request, { params }: { params: Params }) {
  const { date } = await params
  return NextResponse.json({ error: 'not_implemented', date }, { status: 501 })
}
