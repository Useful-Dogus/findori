import { NextResponse } from 'next/server'

import {
  createAdminSessionToken,
  sanitizeAdminRedirectPath,
  setAdminSessionCookie,
} from '@/lib/admin/session'

export async function POST(request: Request) {
  let body: unknown

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid_request' }, { status: 400 })
  }

  if (!body || typeof body !== 'object') {
    return NextResponse.json({ ok: false, error: 'invalid_request' }, { status: 400 })
  }

  const { password, next } = body as { password?: unknown; next?: unknown }

  if (typeof password !== 'string' || password.length === 0) {
    return NextResponse.json({ ok: false, error: 'invalid_request' }, { status: 400 })
  }

  if (password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ ok: false, error: 'invalid_password' }, { status: 401 })
  }

  const redirectTo = sanitizeAdminRedirectPath(typeof next === 'string' ? next : undefined)
  const token = await createAdminSessionToken()
  const response = NextResponse.json({ ok: true, redirect_to: redirectTo }, { status: 200 })

  setAdminSessionCookie(response, token)

  return response
}
