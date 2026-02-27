import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  const { supabaseResponse } = await updateSession(request)

  // Admin 경로 보호: 세션 쿠키 없으면 /admin/login으로 리다이렉트
  // TODO(#6): 세션 쿠키 기반 인증으로 교체 (현재는 Supabase 세션 기반 플레이스홀더)
  const isAdminPath =
    request.nextUrl.pathname.startsWith('/admin') &&
    !request.nextUrl.pathname.startsWith('/admin/login')

  if (isAdminPath) {
    const adminSession = request.cookies.get('admin_session')
    if (!adminSession) {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
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
