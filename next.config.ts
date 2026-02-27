import type { NextConfig } from 'next'
import { validateEnv } from './src/lib/env'

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
