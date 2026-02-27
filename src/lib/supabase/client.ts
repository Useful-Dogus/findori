import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database.types'

// 브라우저 클라이언트 — Client Components('use client')에서만 사용
// 싱글턴 패턴 금지: 매 호출마다 새 인스턴스 생성
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}
