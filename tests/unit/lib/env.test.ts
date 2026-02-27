import { describe, it, expect, beforeEach, afterEach } from 'vitest'

// validateEnv reads process.env at call time, so static import is safe
import { validateEnv } from '@/lib/env'

describe('validateEnv', () => {
  const VALID_ENV: Record<string, string> = {
    NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.anon',
    SUPABASE_SERVICE_ROLE_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.role',
    ADMIN_PASSWORD: 'test-password-min16!',
    ADMIN_SESSION_SECRET: 'test-session-secret-that-is-at-least-32ch!!', // 43자
    ANTHROPIC_API_KEY: 'sk-ant-test-key-here',
    CRON_SECRET: 'test-cron-secret-16!',
  }

  let savedEnv: Record<string, string | undefined>

  beforeEach(() => {
    // Save relevant keys
    savedEnv = {}
    for (const key of Object.keys(VALID_ENV)) {
      savedEnv[key] = process.env[key]
    }
  })

  afterEach(() => {
    // Restore saved keys
    for (const [key, value] of Object.entries(savedEnv)) {
      if (value === undefined) {
        delete process.env[key]
      } else {
        process.env[key] = value
      }
    }
  })

  function applyEnv(overrides: Record<string, string | undefined> = {}) {
    const merged = { ...VALID_ENV, ...overrides }
    for (const [key, value] of Object.entries(merged)) {
      if (value === undefined) {
        delete process.env[key]
      } else {
        process.env[key] = value
      }
    }
  }

  it('모든 변수가 올바를 때 오류 없이 통과한다', () => {
    applyEnv()
    expect(() => validateEnv()).not.toThrow()
  })

  it('ADMIN_PASSWORD 누락 시 ADMIN_PASSWORD를 언급하는 오류를 throw한다', () => {
    applyEnv({ ADMIN_PASSWORD: undefined })
    expect(() => validateEnv()).toThrow(/ADMIN_PASSWORD/)
  })

  it('ADMIN_SESSION_SECRET이 32자 미만이면 ADMIN_SESSION_SECRET을 언급하는 오류를 throw한다', () => {
    applyEnv({ ADMIN_SESSION_SECRET: 'too-short-under-32chars!!' }) // 25자
    expect(() => validateEnv()).toThrow(/ADMIN_SESSION_SECRET/)
  })

  it('ANTHROPIC_API_KEY가 sk-ant- 로 시작하지 않으면 ANTHROPIC_API_KEY를 언급하는 오류를 throw한다', () => {
    applyEnv({ ANTHROPIC_API_KEY: 'invalid-key-format' })
    expect(() => validateEnv()).toThrow(/ANTHROPIC_API_KEY/)
  })
})
