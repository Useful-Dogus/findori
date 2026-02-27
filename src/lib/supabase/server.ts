import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database.types'

// 서버 클라이언트 — Server Components, Route Handlers, Server Actions에서 사용
// Next.js 15: cookies()는 async, 반드시 await 필요
// 싱글턴 패턴 금지: 요청마다 새 인스턴스 생성 (쿠키가 요청마다 다름)
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            )
          } catch {
            // Server Components는 쿠키를 설정할 수 없음.
            // middleware.ts에서 세션 갱신이 처리되므로 이 오류는 무시 가능.
          }
        },
      },
    },
  )
}
