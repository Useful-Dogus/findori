# findori Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-02-27

## Active Technologies
- Markdown, Bash + Claude Code (@-import 런타임 지원), Codex CLI (파일 임포트 없음 — 스크립트 동기화 필요) (036-unified-agent-context)
- TypeScript 5.4+, Node.js 20+ + Next.js 15 (App Router, Turbopack), React 19, Tailwind CSS v4, @supabase/supabase-js, @supabase/ssr (002-tech-baseline-setup)
- Zod (003-env-secrets)

## Project Structure

```text
src/
├── app/
│   ├── (public)/        # 공개 피드 라우트 그룹
│   ├── (admin)/         # Admin 라우트 그룹
│   └── api/             # Route Handlers
├── components/
│   ├── ui/              # 공통 UI 컴포넌트
│   └── features/        # 기능별 컴포넌트
├── lib/
│   └── supabase/        # client.ts, server.ts, middleware.ts, admin.ts
└── types/               # database.types.ts, cards.ts
tests/
├── unit/
└── integration/
```

## Commands

```bash
npm run dev          # 개발 서버 (Turbopack)
npm run build        # 프로덕션 빌드
npm run validate     # type-check + lint + format:check
npm run test         # Vitest (CI용)
npm run db:types     # Supabase DB 타입 재생성
```

## Code Style

- TypeScript strict 모드 (`"moduleResolution": "bundler"`)
- ESLint flat config (`eslint.config.mjs`)
- Prettier + `prettier-plugin-tailwindcss`
- Tailwind CSS v4: `@import "tailwindcss"` + `@theme {}` (tailwind.config.js 없음)
- Supabase: `@supabase/ssr` 패키지 사용, `await cookies()` 필수 (Next.js 15)
- `getUser()` 사용, `getSession()` 금지

## Recent Changes
- 003-env-secrets: Added Zod for environment variable validation
- 036-unified-agent-context: Added Markdown, Bash + Claude Code (@-import 런타임 지원), Codex CLI (파일 임포트 없음 — 스크립트 동기화 필요)

<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
