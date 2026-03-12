import fs from 'fs'
import path from 'path'
import type { NextConfig } from 'next'
import { validateEnv } from './src/lib/env'

// Claude Code 등 일부 환경에서 ANTHROPIC_API_KEY='' (빈 문자열)을 child process에 주입한다.
// Next.js의 @next/env는 빈 문자열도 "이미 정의됨"으로 간주해 .env.local 값을 스킵하므로,
// validateEnv() 호출 전에 빈 문자열 env var를 .env.local 값으로 복원한다.
const envLocalPath = path.join(process.cwd(), '.env.local')
if (fs.existsSync(envLocalPath)) {
  const lines = fs.readFileSync(envLocalPath, 'utf-8').split('\n')
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIdx = trimmed.indexOf('=')
    if (eqIdx === -1) continue
    const key = trimmed.slice(0, eqIdx).trim()
    const raw = trimmed.slice(eqIdx + 1).trim()
    const value = raw.startsWith('"') && raw.endsWith('"') ? raw.slice(1, -1) : raw
    if (process.env[key] === '') {
      process.env[key] = value
    }
  }
}

// 빌드/시작 시 환경변수 검증 — 누락 시 명확한 오류로 즉시 종료
try {
  validateEnv()
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error))
  process.exit(1)
}

const nextConfig: NextConfig = {
  typedRoutes: true,
}

export default nextConfig
