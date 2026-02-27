// TODO(#8): Admin 이슈 편집/상태변경 구현

import { NextResponse } from 'next/server'

type Params = Promise<{ id: string }>

export async function PATCH(_request: Request, { params }: { params: Params }) {
  const { id } = await params
  return NextResponse.json({ error: 'not_implemented', id }, { status: 501 })
}

export async function PUT(_request: Request, { params }: { params: Params }) {
  const { id } = await params
  return NextResponse.json({ error: 'not_implemented', id }, { status: 501 })
}
