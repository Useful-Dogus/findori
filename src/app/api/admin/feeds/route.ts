import { NextResponse } from 'next/server'

import { getAdminFeeds } from '@/lib/admin/feeds'
import { requireAdminSession } from '@/lib/admin/session'

export async function GET(request: Request) {
  const session = await requireAdminSession(request)
  if (!session.valid) {
    return session.response
  }

  try {
    const feeds = await getAdminFeeds()
    return NextResponse.json({ feeds }, { status: 200 })
  } catch {
    return NextResponse.json({ error: 'internal_error' }, { status: 500 })
  }
}
