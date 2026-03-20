import { NextResponse } from 'next/server'

import type { FeedEventPayload } from '@/lib/analytics'

function isValidEvent(payload: unknown): payload is FeedEventPayload {
  if (!payload || typeof payload !== 'object') {
    return false
  }

  const event = (payload as { event?: unknown }).event
  return (
    event === 'feed_opened' ||
    event === 'card_swiped' ||
    event === 'share_clicked' ||
    event === 'source_clicked'
  )
}

export async function POST(request: Request) {
  let payload: unknown

  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }

  if (!isValidEvent(payload)) {
    return NextResponse.json({ error: 'invalid_event' }, { status: 400 })
  }

  console.info('[feed-event]', payload)

  return NextResponse.json({ ok: true })
}
