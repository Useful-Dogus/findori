import { z, ZodError } from 'zod'

const envSchema = z.object({
  // ── Supabase: 클라이언트+서버 공개 변수 ──────────────────────────
  NEXT_PUBLIC_SUPABASE_URL: z.string().url({ message: 'URL 형식이어야 합니다 (예: https://...)' }),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(20),

  // ── Supabase: 서버 전용 (RLS 우회 — 절대 클라이언트 노출 금지) ──
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(20),

  // ── Admin 인증 ────────────────────────────────────────────────────
  ADMIN_PASSWORD: z.string().min(16, { message: '최소 16자 이상이어야 합니다' }),
  ADMIN_SESSION_SECRET: z
    .string()
    .min(32, { message: '세션 서명 키는 최소 32자 이상이어야 합니다' }),

  // ── Anthropic (AI) ───────────────────────────────────────────────
  ANTHROPIC_API_KEY: z.string().startsWith('sk-ant-', { message: "'sk-ant-'로 시작해야 합니다" }),

  // ── Cron 보안 ─────────────────────────────────────────────────────
  CRON_SECRET: z.string().min(16, { message: '최소 16자 이상이어야 합니다' }),
})

export type Env = z.infer<typeof envSchema>

/**
 * 필수 환경변수를 검증합니다.
 * 누락되거나 형식이 잘못된 변수가 있으면 오류를 throw합니다.
 * next.config.ts에서 호출하여 빌드/시작 시 즉시 감지할 수 있습니다.
 */
export function validateEnv(): Env {
  try {
    return envSchema.parse(process.env)
  } catch (error) {
    if (error instanceof ZodError) {
      const messages = error.issues.map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
      throw new Error(`환경변수 검증 실패:\n${messages.join('\n')}`)
    }
    throw error
  }
}
