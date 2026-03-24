import { NextResponse } from 'next/server'
import { z } from 'zod'

import { requireAdminSession } from '@/lib/admin/session'
import { createSource, getAdminSources, SourceDuplicateError } from '@/lib/admin/sources'

const CreateSourceSchema = z.object({
  name: z.string().min(1).max(100),
  rssUrl: z.string().url(),
})

export async function GET(request: Request) {
  const session = await requireAdminSession(request)
  if (!session.valid) {
    return session.response
  }

  try {
    const sources = await getAdminSources()
    return NextResponse.json({ sources }, { status: 200 })
  } catch {
    return NextResponse.json({ error: 'internal_error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const session = await requireAdminSession(request)
  if (!session.valid) {
    return session.response
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }

  const parsed = CreateSourceSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'validation_error', details: parsed.error.flatten() },
      { status: 400 },
    )
  }

  try {
    const source = await createSource(parsed.data)
    return NextResponse.json({ source }, { status: 201 })
  } catch (err) {
    if (err instanceof SourceDuplicateError) {
      return NextResponse.json({ error: 'duplicate_rss_url' }, { status: 409 })
    }
    return NextResponse.json({ error: 'internal_error' }, { status: 500 })
  }
}
