// TODO(#10): 매체 활성/비활성 구현

import { NextResponse } from 'next/server'

type Params = Promise<{ id: string }>

export async function PATCH(_request: Request, { params }: { params: Params }) {
  const { id } = await params
  return NextResponse.json({ error: 'not_implemented', id }, { status: 501 })
}
