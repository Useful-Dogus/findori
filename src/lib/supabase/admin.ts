import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'

// Service Role 클라이언트 — RLS 우회, 서버 전용
// NEVER 이 클라이언트를 클라이언트 컴포넌트나 브라우저에 노출하지 말 것
// 파이프라인, Admin 전용 서버 작업에서만 사용
export function createAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  )
}
