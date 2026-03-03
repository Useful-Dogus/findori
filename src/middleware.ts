import { type NextRequest, NextResponse } from 'next/server'

import {
  clearAdminSessionCookie,
  readAdminSessionFromRequest,
  sanitizeAdminRedirectPath,
} from '@/lib/admin/session'
import { updateSession } from '@/lib/supabase/middleware'

function copyResponseCookies(source: NextResponse, target: NextResponse) {
  for (const cookie of source.cookies.getAll()) {
    target.cookies.set(cookie)
  }
}

export async function middleware(request: NextRequest) {
  const { supabaseResponse } = await updateSession(request)
  const pathname = request.nextUrl.pathname

  const isAdminLoginPath = pathname === '/admin/login'
  const isProtectedAdminPath = pathname.startsWith('/admin') && !isAdminLoginPath

  if (!pathname.startsWith('/admin')) {
    return supabaseResponse
  }

  const adminSession = await readAdminSessionFromRequest(request)
  const requestedPath = sanitizeAdminRedirectPath(`${pathname}${request.nextUrl.search}`, '/admin')

  if (isAdminLoginPath) {
    if (adminSession.valid) {
      const redirectUrl = new URL(
        sanitizeAdminRedirectPath(request.nextUrl.searchParams.get('next')),
        request.url,
      )
      const response = NextResponse.redirect(redirectUrl)

      copyResponseCookies(supabaseResponse, response)

      return response
    }

    if (adminSession.reason !== 'missing') {
      clearAdminSessionCookie(supabaseResponse)
    }

    return supabaseResponse
  }

  if (isProtectedAdminPath && !adminSession.valid) {
    const loginUrl = new URL('/admin/login', request.url)
    loginUrl.searchParams.set('next', requestedPath)

    if (adminSession.reason === 'expired') {
      loginUrl.searchParams.set('reason', 'expired')
    }

    const response = NextResponse.redirect(loginUrl)

    copyResponseCookies(supabaseResponse, response)

    if (adminSession.reason !== 'missing') {
      clearAdminSessionCookie(response)
    }

    return response
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * 다음 경로를 제외한 모든 요청 처리:
     * - _next/static (정적 파일)
     * - _next/image (이미지 최적화)
     * - favicon.ico
     * - 이미지, SVG 등 정적 파일
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
