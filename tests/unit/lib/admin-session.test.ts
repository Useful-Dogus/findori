/* @vitest-environment node */

import { webcrypto } from 'node:crypto'

import { describe, expect, it, beforeEach, afterEach } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'

import { middleware } from '@/middleware'
import {
  ADMIN_SESSION_COOKIE_NAME,
  ADMIN_SESSION_TTL_SECONDS,
  clearAdminSessionCookie,
  createAdminSessionToken,
  getAdminLoginStatusMessage,
  readAdminSessionFromRequest,
  requireAdminSession,
  sanitizeAdminRedirectPath,
  setAdminSessionCookie,
  verifyAdminSessionToken,
} from '@/lib/admin/session'
import { POST as loginPost } from '@/app/api/admin/auth/login/route'
import { POST as logoutPost } from '@/app/api/admin/auth/logout/route'

if (!globalThis.crypto) {
  Object.defineProperty(globalThis, 'crypto', {
    value: webcrypto,
    configurable: true,
  })
}

describe('admin session', () => {
  const VALID_ENV: Record<string, string> = {
    ADMIN_PASSWORD: 'test-password-min16!',
    ADMIN_SESSION_SECRET: 'test-session-secret-that-is-at-least-32ch!!',
  }

  let savedEnv: Record<string, string | undefined>

  beforeEach(() => {
    savedEnv = {}
    for (const key of Object.keys(VALID_ENV)) {
      savedEnv[key] = process.env[key]
      process.env[key] = VALID_ENV[key]
    }

    delete process.env.NEXT_PUBLIC_SUPABASE_URL
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  })

  afterEach(() => {
    for (const [key, value] of Object.entries(savedEnv)) {
      if (value === undefined) {
        delete process.env[key]
      } else {
        process.env[key] = value
      }
    }
  })

  it('valid token verifies successfully', async () => {
    const token = await createAdminSessionToken(1_700_000_000)

    const result = await verifyAdminSessionToken(token, 1_700_000_100)

    expect(result.valid).toBe(true)
    if (result.valid) {
      expect(result.payload.sub).toBe('admin')
      expect(result.payload.exp).toBe(1_700_000_000 + ADMIN_SESSION_TTL_SECONDS)
    }
  })

  it('expired token is rejected', async () => {
    const token = await createAdminSessionToken(1_700_000_000)

    const result = await verifyAdminSessionToken(
      token,
      1_700_000_000 + ADMIN_SESSION_TTL_SECONDS + 1,
    )

    expect(result).toEqual({ valid: false, reason: 'expired' })
  })

  it('tampered token is rejected', async () => {
    const token = await createAdminSessionToken(1_700_000_000)
    const tamperedToken = `${token.slice(0, -1)}x`

    const result = await verifyAdminSessionToken(tamperedToken, 1_700_000_010)

    expect(result).toEqual({ valid: false, reason: 'invalid' })
  })

  it('redirect path sanitization only allows internal paths', () => {
    expect(sanitizeAdminRedirectPath('/admin/feed/2026-02-26')).toBe('/admin/feed/2026-02-26')
    expect(sanitizeAdminRedirectPath('https://example.com')).toBe('/admin')
    expect(sanitizeAdminRedirectPath('//evil.test')).toBe('/admin')
    expect(sanitizeAdminRedirectPath(undefined, '/admin/login')).toBe('/admin/login')
  })

  it('cookie helpers set and clear secure session cookies', async () => {
    const token = await createAdminSessionToken(1_700_000_000)
    const nextResponse = NextResponse.json({ ok: true }, { status: 200 })

    setAdminSessionCookie(nextResponse, token)
    const setCookie = nextResponse.headers.get('set-cookie') ?? ''

    expect(setCookie).toContain(`${ADMIN_SESSION_COOKIE_NAME}=`)
    expect(setCookie).toContain('HttpOnly')
    expect(setCookie).toContain('Secure')
    expect(setCookie).toContain('SameSite=strict')
    expect(setCookie).toContain(`Max-Age=${ADMIN_SESSION_TTL_SECONDS}`)

    clearAdminSessionCookie(nextResponse)
    const clearedCookie = nextResponse.headers.get('set-cookie') ?? ''
    expect(clearedCookie).toContain('Max-Age=0')
  })

  it('reads and validates session from request cookies', async () => {
    const token = await createAdminSessionToken()
    const request = new Request('http://localhost/admin', {
      headers: { cookie: `${ADMIN_SESSION_COOKIE_NAME}=${token}` },
    })

    const result = await readAdminSessionFromRequest(request)

    expect(result.valid).toBe(true)
  })

  it('login route returns cookie and redirect target on success', async () => {
    const request = new Request('http://localhost/api/admin/auth/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        password: VALID_ENV.ADMIN_PASSWORD,
        next: '/admin/feed/2026-02-26',
      }),
    })

    const response = await loginPost(request)
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body).toEqual({
      ok: true,
      redirect_to: '/admin/feed/2026-02-26',
    })
    expect(response.headers.get('set-cookie')).toContain(`${ADMIN_SESSION_COOKIE_NAME}=`)
  })

  it('login route returns invalid_request for malformed body', async () => {
    const request = new Request('http://localhost/api/admin/auth/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ next: '/admin' }),
    })

    const response = await loginPost(request)
    const body = await response.json()

    expect(response.status).toBe(400)
    expect(body).toEqual({ ok: false, error: 'invalid_request' })
    expect(response.headers.get('set-cookie')).toBeNull()
  })

  it('login route returns invalid_password without session issuance', async () => {
    const request = new Request('http://localhost/api/admin/auth/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ password: 'wrong-password-value' }),
    })

    const response = await loginPost(request)
    const body = await response.json()

    expect(response.status).toBe(401)
    expect(body).toEqual({ ok: false, error: 'invalid_password' })
    expect(response.headers.get('set-cookie')).toBeNull()
  })

  it('logout route always clears the session cookie', async () => {
    const response = await logoutPost()
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body).toEqual({ ok: true })
    expect(response.headers.get('set-cookie')).toContain('Max-Age=0')
  })

  it('middleware redirects unauthenticated admin access to login with next parameter', async () => {
    const request = new NextRequest('http://localhost/admin/feed/2026-02-26?tab=draft', {
      headers: new Headers(),
    })

    const response = await middleware(request)

    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe(
      'http://localhost/admin/login?next=%2Fadmin%2Ffeed%2F2026-02-26%3Ftab%3Ddraft',
    )
  })

  it('middleware allows authenticated admin access', async () => {
    const token = await createAdminSessionToken()
    const request = new NextRequest('http://localhost/admin/feed/2026-02-26', {
      headers: new Headers({ cookie: `${ADMIN_SESSION_COOKIE_NAME}=${token}` }),
    })

    const response = await middleware(request)

    expect(response.status).toBe(200)
    expect(response.headers.get('location')).toBeNull()
  })

  it('middleware redirects authenticated login page access back to admin', async () => {
    const token = await createAdminSessionToken()
    const request = new NextRequest('http://localhost/admin/login?next=/admin/sources', {
      headers: new Headers({ cookie: `${ADMIN_SESSION_COOKIE_NAME}=${token}` }),
    })

    const response = await middleware(request)

    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe('http://localhost/admin/sources')
  })

  it('protected admin api helper returns unauthorized response for missing session', async () => {
    const request = new Request('http://localhost/api/admin/feeds')

    const result = await requireAdminSession(request)

    expect(result.valid).toBe(false)
    if (!result.valid) {
      expect(result.response.status).toBe(401)
      await expect(result.response.json()).resolves.toEqual({ error: 'unauthorized' })
    }
  })

  it('public login status message maps known reasons only', () => {
    expect(getAdminLoginStatusMessage('expired')).toContain('세션이 만료')
    expect(getAdminLoginStatusMessage('logged_out')).toContain('로그아웃')
    expect(getAdminLoginStatusMessage('unknown')).toBeNull()
  })
})
