import { NextResponse } from 'next/server'

export const ADMIN_SESSION_COOKIE_NAME = 'admin_session'
export const ADMIN_SESSION_TTL_SECONDS = 60 * 60 * 24 * 7
const ADMIN_SESSION_SUBJECT = 'admin'
const SESSION_REASON_MESSAGES = new Set([
  'expired',
  'invalid',
  'missing',
  'unauthorized',
  'logged_out',
])

export type AdminSessionPayload = {
  sub: 'admin'
  iat: number
  exp: number
}

export type AdminSessionVerificationResult =
  | { valid: true; payload: AdminSessionPayload }
  | { valid: false; reason: 'missing' | 'malformed' | 'invalid' | 'expired' }

function getSessionSecret(): string {
  const secret = process.env.ADMIN_SESSION_SECRET

  if (!secret) {
    throw new Error('ADMIN_SESSION_SECRET is required')
  }

  return secret
}

function encodeBase64Url(bytes: Uint8Array): string {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(bytes)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/g, '')
  }

  let binary = ''
  for (const byte of bytes) {
    binary += String.fromCharCode(byte)
  }

  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

function decodeBase64Url(value: string): Uint8Array {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/')
  const padding = normalized.length % 4 === 0 ? '' : '='.repeat(4 - (normalized.length % 4))
  const base64 = `${normalized}${padding}`

  if (typeof Buffer !== 'undefined') {
    return Uint8Array.from(Buffer.from(base64, 'base64'))
  }

  const binary = atob(base64)
  return Uint8Array.from(binary, (char) => char.charCodeAt(0))
}

function decodeUtf8(bytes: Uint8Array): string {
  return new TextDecoder().decode(bytes)
}

function encodeUtf8(value: string): Uint8Array {
  return new TextEncoder().encode(value)
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer
}

async function importSigningKey() {
  return crypto.subtle.importKey(
    'raw',
    toArrayBuffer(encodeUtf8(getSessionSecret())),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
}

async function signSessionPayload(payload: string): Promise<string> {
  const key = await importSigningKey()
  const signature = await crypto.subtle.sign('HMAC', key, toArrayBuffer(encodeUtf8(payload)))
  return encodeBase64Url(new Uint8Array(signature))
}

function constantTimeEquals(left: Uint8Array, right: Uint8Array): boolean {
  if (left.length !== right.length) {
    return false
  }

  let diff = 0
  for (let index = 0; index < left.length; index += 1) {
    diff |= left[index] ^ right[index]
  }

  return diff === 0
}

function extractCookieValue(request: Request, name: string): string | null {
  const cookieHeader = request.headers.get('cookie')

  if (!cookieHeader) {
    return null
  }

  const cookies = cookieHeader.split(';')

  for (const cookie of cookies) {
    const trimmedCookie = cookie.trim()
    const separatorIndex = trimmedCookie.indexOf('=')

    if (separatorIndex === -1) {
      continue
    }

    const cookieName = trimmedCookie.slice(0, separatorIndex)
    if (cookieName !== name) {
      continue
    }

    return trimmedCookie.slice(separatorIndex + 1)
  }

  return null
}

export function sanitizeAdminRedirectPath(
  value: string | null | undefined,
  fallback = '/admin',
): string {
  if (!value) {
    return fallback
  }

  if (!value.startsWith('/')) {
    return fallback
  }

  if (value.startsWith('//')) {
    return fallback
  }

  return value
}

export async function createAdminSessionToken(
  nowSeconds = Math.floor(Date.now() / 1000),
): Promise<string> {
  const payload: AdminSessionPayload = {
    sub: ADMIN_SESSION_SUBJECT,
    iat: nowSeconds,
    exp: nowSeconds + ADMIN_SESSION_TTL_SECONDS,
  }

  const payloadString = JSON.stringify(payload)
  const encodedPayload = encodeBase64Url(encodeUtf8(payloadString))
  const signature = await signSessionPayload(payloadString)

  return `${encodedPayload}.${signature}`
}

export async function verifyAdminSessionToken(
  token: string | null | undefined,
  nowSeconds = Math.floor(Date.now() / 1000),
): Promise<AdminSessionVerificationResult> {
  if (!token) {
    return { valid: false, reason: 'missing' }
  }

  const separatorIndex = token.indexOf('.')
  if (separatorIndex === -1) {
    return { valid: false, reason: 'malformed' }
  }

  const encodedPayload = token.slice(0, separatorIndex)
  const signature = token.slice(separatorIndex + 1)

  if (!encodedPayload || !signature) {
    return { valid: false, reason: 'malformed' }
  }

  try {
    const payloadString = decodeUtf8(decodeBase64Url(encodedPayload))
    const expectedSignature = await signSessionPayload(payloadString)
    const signaturesMatch = constantTimeEquals(
      decodeBase64Url(signature),
      decodeBase64Url(expectedSignature),
    )

    if (!signaturesMatch) {
      return { valid: false, reason: 'invalid' }
    }

    const parsedPayload = JSON.parse(payloadString) as Partial<AdminSessionPayload>
    if (
      parsedPayload.sub !== ADMIN_SESSION_SUBJECT ||
      typeof parsedPayload.iat !== 'number' ||
      typeof parsedPayload.exp !== 'number'
    ) {
      return { valid: false, reason: 'invalid' }
    }

    if (parsedPayload.exp <= nowSeconds) {
      return { valid: false, reason: 'expired' }
    }

    return {
      valid: true,
      payload: {
        sub: ADMIN_SESSION_SUBJECT,
        iat: parsedPayload.iat,
        exp: parsedPayload.exp,
      },
    }
  } catch {
    return { valid: false, reason: 'invalid' }
  }
}

export async function readAdminSessionFromRequest(
  request: Request,
): Promise<AdminSessionVerificationResult> {
  const token = extractCookieValue(request, ADMIN_SESSION_COOKIE_NAME)
  return verifyAdminSessionToken(token)
}

export function setAdminSessionCookie(response: NextResponse, token: string) {
  response.cookies.set({
    name: ADMIN_SESSION_COOKIE_NAME,
    value: token,
    httpOnly: true,
    maxAge: ADMIN_SESSION_TTL_SECONDS,
    path: '/',
    sameSite: 'strict',
    secure: true,
  })
}

export function clearAdminSessionCookie(response: NextResponse) {
  response.cookies.set({
    name: ADMIN_SESSION_COOKIE_NAME,
    value: '',
    expires: new Date(0),
    httpOnly: true,
    maxAge: 0,
    path: '/',
    sameSite: 'strict',
    secure: true,
  })
}

export function createUnauthorizedAdminResponse() {
  return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
}

export async function requireAdminSession(request: Request) {
  const session = await readAdminSessionFromRequest(request)

  if (session.valid) {
    return session
  }

  const response = createUnauthorizedAdminResponse()
  if (session.reason !== 'missing') {
    clearAdminSessionCookie(response)
  }

  return { valid: false as const, reason: session.reason, response }
}

export function getAdminLoginStatusMessage(reason: string | null | undefined): string | null {
  if (!reason || !SESSION_REASON_MESSAGES.has(reason)) {
    return null
  }

  switch (reason) {
    case 'expired':
      return '세션이 만료되어 다시 로그인해야 합니다.'
    case 'logged_out':
      return '로그아웃되었습니다.'
    case 'invalid':
    case 'unauthorized':
      return '인증이 필요합니다.'
    default:
      return null
  }
}
