import { NextResponse } from 'next/server'
import { z } from 'zod'

import { requireAdminSession } from '@/lib/admin/session'
import { toggleSourceActive, SourceNotFoundError } from '@/lib/admin/sources'

const PatchSourceSchema = z.object({
  active: z.boolean(),
})

type Params = Promise<{ id: string }>

export async function PATCH(request: Request, { params }: { params: Params }) {
  const session = await requireAdminSession(request)
  if (!session.valid) {
    return session.response
  }

  const { id } = await params

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }

  const parsed = PatchSourceSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'validation_error', details: parsed.error.flatten() },
      { status: 400 },
    )
  }

  try {
    const source = await toggleSourceActive(id, parsed.data.active)
    return NextResponse.json({ source }, { status: 200 })
  } catch (err) {
    if (err instanceof SourceNotFoundError) {
      return NextResponse.json({ error: 'not_found' }, { status: 404 })
    }
    return NextResponse.json({ error: 'internal_error' }, { status: 500 })
  }
}
