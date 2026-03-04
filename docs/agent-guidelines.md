# findori Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-02-27

## Active Technologies
- Markdown, Bash + Claude Code (@-import 런타임 지원), Codex CLI (파일 언급으로 임포트 동작) (036-unified-agent-context)
- TypeScript 5.4+, Node.js 20+ + Next.js 15 (App Router, Turbopack), React 19, Tailwind CSS v4, @supabase/supabase-js, @supabase/ssr (002-tech-baseline-setup)
- Zod (003-env-secrets)
- TypeScript 5.4+ / Node.js 20+ (타입 재생성) + Supabase CLI, `@supabase/supabase-js` ^2.0, `@supabase/ssr` ^0.5 (004-db-schema-migration)
- Supabase PostgreSQL (프로젝트 ref는 환경변수로 주입) (004-db-schema-migration)
- TypeScript 5.4+ / Node.js 20+ + Zod ^3 (기존 설치), Vitest (기존 테스트 환경) (005-cards-schema-types)
- N/A — 이 이슈는 읽기/검증 전용. DB 쓰기 없음. (005-cards-schema-types)
- TypeScript 5.4+, Node.js 20+ + Next.js 15 (App Router, Route Handlers, Middleware), React 19, Zod 4, Vites (006-admin-auth-session)
- 브라우저 쿠키 기반 세션 상태, 환경변수 기반 운영 비밀값 (`ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET`) (006-admin-auth-session)
- TypeScript 5.4+ / Node.js 20+ + Next.js 15 (App Router, Server Components, Route Handlers), React 19, Tailwind CSS v4, @supabase/supabase-js, @supabase/ssr, Zod v3 (007-admin-feed-review)
- Supabase PostgreSQL (`feeds`, `issues` 테이블 — 읽기 전용) (007-admin-feed-review)
- TypeScript 5.4+ / Node.js 20+ + `@anthropic-ai/sdk` (신규 추가), `rss-parser` (신규 추가), `@supabase/supabase-js` ^2.0, `zod` ^4.3 (011-cron-pipeline)
- Supabase PostgreSQL — `pipeline_logs`(신규), `feeds`, `issues`, `media_sources` (기존) (011-cron-pipeline)
- TypeScript 5.4+, Node.js 20+ + Next.js 15 (App Router, Route Handlers), React 19, Tailwind CSS v4, @supabase/supabase-js ^2.0, @supabase/ssr ^0.5, Zod v3 (008-admin-issue-review)
- Supabase PostgreSQL — `issues` 테이블 (`status`, `cards_data` 컬럼 업데이트) (008-admin-issue-review)

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

## Artifact Conventions

산출물 작성 규칙(스펙·이슈·커밋·PR 형식, 번호 정렬 체계, 코드 품질 기준, hotfix 예외 흐름)은
`docs/artifact-conventions.md`를 참조한다.

## Recent Changes
- 008-admin-issue-review: Added TypeScript 5.4+, Node.js 20+ + Next.js 15 (App Router, Route Handlers), React 19, Tailwind CSS v4, @supabase/supabase-js ^2.0, @supabase/ssr ^0.5, Zod v3
- 007-admin-feed-review: Added TypeScript 5.4+ / Node.js 20+ + Next.js 15 (App Router, Server Components, Route Handlers), React 19, Tailwind CSS v4, @supabase/supabase-js, @supabase/ssr, Zod v3
- 011-cron-pipeline: Added TypeScript 5.4+ / Node.js 20+ + `@anthropic-ai/sdk` (신규 추가), `rss-parser` (신규 추가), `@supabase/supabase-js` ^2.0, `zod` ^4.3

<!-- MANUAL ADDITIONS START -->
## Workflow Rules (Permanent)

- **Commit policy**: 이슈 브랜치에 직접 커밋. `Co-Authored-By: Claude` 또는 "클로드코드 협업자" 라인 절대 금지.
- **After implement**: 품질 게이트(`npm run validate` + `npm run test` + 필요 시 `npm run build`) 통과 후 이슈 브랜치에 커밋 → GitHub PR 생성 후 URL 보고.
- **Feature branch/spec numbering**: `/speckit.specify` 또는 브랜치/스펙 생성 시 **반드시 GitHub 이슈 번호를 사용**한다. 이슈 제목이나 설명에 `#N` 형식으로 이슈 번호가 명시된 경우 해당 번호를 3자리 0-패딩으로 변환하여 사용한다 (예: `#8` → `008`, `#42` → `042`). `create-new-feature.sh`의 `--number` 인자에는 이 이슈 번호를 전달한다. 도구 내부의 자동 증분 번호(001, 002…)를 절대 사용하지 않는다.
- **Worktree discipline**: 사용자가 특정 worktree 경로를 지정하면 모든 조회·수정·검증·커밋·PR 작업은 반드시 그 worktree 루트에서 수행한다. 저장소 루트나 다른 worktree에서 임시 구현 후 옮기는 방식은 금지한다.
- **PR title format**: PR 제목은 반드시 `[Issue #N] <설명>` 형식을 사용한다. `Issue` 단수형을 사용하고, `Issues`, `#NNN`, 자유 형식 제목을 사용하지 않는다.
- **PR body format**: PR 본문은 반드시 `## Summary`, `## Test plan`, `Closes #N`을 포함한다. 웹 애플리케이션 코드 변경에서는 `npm run validate`, `npm run test`, `npm run build` 실행 결과를 각각 명시하고, 실패 시에도 실제 실행 결과와 실패 사유를 그대로 적는다.

## Security Rules For Public Repo (Permanent)

- **No hardcoded infra refs**: Supabase project ref/ID, API URL, 키를 문서/스크립트/코드에 하드코딩하지 말고 `.env.local` 기반으로 주입.
- **`db:types` 실행 규칙**: `SUPABASE_PROJECT_ID`가 설정되지 않으면 실행 실패해야 하며, 기본값 fallback을 두지 않는다.
- **Never commit secrets**: `SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`, `ADMIN_SESSION_SECRET`, `ADMIN_PASSWORD`, `CRON_SECRET`는 어떤 형태로도 커밋 금지.
- **Public key handling**: `NEXT_PUBLIC_*` 값은 공개될 수 있다고 가정하고 권한 최소화(RLS + 정책) 전제 하에만 사용.
- **RLS gate**: RLS/권한 정책 없이 실제 데이터(또는 PII)를 운영 DB에 적재하지 않는다.
- **Pre-commit check**: 커밋 전 `git diff --cached | grep -E 'sk-ant-|service_role|ADMIN_SESSION_SECRET|CRON_SECRET|SUPABASE_SERVICE_ROLE_KEY'`를 실행해 의심 패턴을 차단.
<!-- MANUAL ADDITIONS END -->
