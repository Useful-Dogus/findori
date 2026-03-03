import { NextResponse } from 'next/server'

import { requireAdminSession } from '@/lib/admin/session'

export async function GET(request: Request) {
  const session = await requireAdminSession(request)
  if (!session.valid) {
    return session.response
  }

  return NextResponse.json({ feeds: [] }, { status: 200 })
}
