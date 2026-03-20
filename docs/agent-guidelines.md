# findori Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-02-27

## Active Technologies
- Markdown, Bash, Codex CLI, repo-local Speckit prompts under `.codex/prompts/`, repo-local skills under `.codex/skills/` (036-unified-agent-context)
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
- TypeScript 5.4+ / Node.js 20+ + `rss-parser` (기존 설치), `@supabase/supabase-js` ^2.0, `zod` ^4.3 (012-news-collector)
- Supabase PostgreSQL — `pipeline_logs`(컬럼 추가), `media_sources`(읽기 전용) (012-news-collector)
- TypeScript 5.4+, Node.js 20+ + `@anthropic-ai/sdk` (기존), `zod` (기존), Vitest (기존) (053-card-gen-quality)
- N/A (텍스트 함수 수정만) (053-card-gen-quality)
- TypeScript 5.4+ / Node.js 20+ + Next.js 15 (App Router Route Handlers), `@supabase/supabase-js` ^2.0, `@supabase/ssr` ^0.5, `zod` ^4.3 (날짜 파라미터 검증용) (015-public-feed-api)
- Supabase PostgreSQL — `feeds`, `issues`, `issue_tags`, `tags` 테이블 (읽기 전용) (015-public-feed-api)
- TypeScript 5.4+ / Node.js 20+ + Next.js 15 (App Router, Route Handlers), React 19, `@supabase/supabase-js` ^2.0, `@supabase/ssr` ^0.5, Zod (입력 검증 불필요 — path param만 사용) (009-admin-feed-publish)
- Supabase PostgreSQL — `feeds` 테이블 (status, published_at 업데이트), `issues` 테이블 (approved count 조회) (009-admin-feed-publish)
- TypeScript 5.4+ / Node.js 20+ + Next.js 15 (App Router, Server Components, generateMetadata), React 19, Tailwind CSS v4, `@supabase/supabase-js` ^2.0, `@supabase/ssr` ^0.5 (016-public-routing-ssr)

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

## Codex Workflow

- Codex는 질의응답 도구가 아니라 저장소 내장형 실행 에이전트로 사용한다.
- 큰 작업은 가능한 한 `spec -> plan -> tasks -> implement` 흐름으로 진행한다.
- 각 단계 산출물은 `specs/NNN-<short-name>/` 아래에 `spec.md`, `plan.md`, `tasks.md`로 남긴다.
- `/speckit.implement` 성격의 실행에서는 분석만 하고 멈추지 말고, 범위 내 품질 게이트를 통과시키거나 저장소 상태만으로 해결 불가능한 구체적 blocker를 남길 때까지 진행한다.
- 저장소에 있는 `.codex/prompts/*.md`가 Speckit 워크플로의 단일 기준이다. repo-local skill은 이 프롬프트의 얇은 진입점으로만 유지한다.
- repo-local skills 설치가 필요하면 `scripts/install-codex-speckit-skills.sh`를 사용한다.
- 사용자가 "다음 작업"을 요청하면 최근 커밋, `specs/`, 열린 GitHub 이슈/PR, 검증 상태를 함께 보고 준비된 작업만 제안한다.

## Recent Changes
- 016-public-routing-ssr: Added TypeScript 5.4+ / Node.js 20+ + Next.js 15 (App Router, Server Components, generateMetadata), React 19, Tailwind CSS v4, `@supabase/supabase-js` ^2.0, `@supabase/ssr` ^0.5
- 009-admin-feed-publish: Added TypeScript 5.4+ / Node.js 20+ + Next.js 15 (App Router, Route Handlers), React 19, `@supabase/supabase-js` ^2.0, `@supabase/ssr` ^0.5, Zod (입력 검증 불필요 — path param만 사용)
- 053-card-gen-quality: Added TypeScript 5.4+, Node.js 20+ + `@anthropic-ai/sdk` (기존), `zod` (기존), Vitest (기존)

<!-- MANUAL ADDITIONS START -->
## Workflow Rules (Permanent)

- **Commit policy**: 이슈 브랜치에 직접 커밋. AI 도구명 기반 `Co-Authored-By` 라인이나 특정 에이전트 협업자 표기 같은 자동 서명 라인 절대 금지.
- **After implement**: 품질 게이트(`npm run validate` + `npm run test` + 필요 시 `npm run build`) 통과 후 이슈 브랜치에 커밋 → GitHub PR 생성 후 URL 보고.
- **Feature branch/spec numbering**: `/speckit.specify` 또는 브랜치/스펙 생성 시 **반드시 GitHub 이슈 번호를 사용**한다. 이슈 제목이나 설명에 `#N` 형식으로 이슈 번호가 명시된 경우 해당 번호를 3자리 0-패딩으로 변환하여 사용한다 (예: `#8` → `008`, `#42` → `042`). `create-new-feature.sh`의 `--number` 인자에는 이 이슈 번호를 전달한다. 도구 내부의 자동 증분 번호(001, 002…)를 절대 사용하지 않는다.
- **Worktree discipline**: 사용자가 특정 worktree 경로를 지정하면 모든 조회·수정·검증·커밋·PR 작업은 반드시 그 worktree 루트에서 수행한다. 저장소 루트나 다른 worktree에서 임시 구현 후 옮기는 방식은 금지한다.
- **PR title format**: PR 제목은 반드시 `[Issue #N] <설명>` 형식을 사용한다. `Issue` 단수형을 사용하고, `Issues`, `#NNN`, 자유 형식 제목을 사용하지 않는다.
- **PR body format**: PR 본문은 반드시 `## Summary`, `## Test plan`, `Closes #N`을 포함한다. 웹 애플리케이션 코드 변경에서는 `npm run validate`, `npm run test`, `npm run build` 실행 결과를 각각 명시하고, 실패 시에도 실제 실행 결과와 실패 사유를 그대로 적는다.
- **PR writing quality**: PR 본문은 단순 변경 요약이 아니라 개발자 문서처럼 작성한다. 왜 바뀌었는지, 어떤 이슈/스펙/규칙을 구현했는지, 어떤 경계가 바뀌었는지, 어떤 리스크와 non-goal이 남았는지를 설명한다.
- **GitHub writing language**: 이 저장소에서 Codex가 작성하는 GitHub 이슈/PR 제목과 본문은 기본적으로 한국어를 사용한다. 코드 식별자, 경로, 명령어, 타입명은 원문을 유지한다.

## Next-Task Suggestion Workflow (Permanent)

"다음 작업 제안해줘" 또는 유사한 요청을 받으면 아래 파이프라인을 순서대로 수행한다.

### 1. main 브랜치 최신화
```bash
git -C <repo-root> fetch origin
git -C <repo-root> checkout main
git -C <repo-root> pull --ff-only origin main
```

### 2. 현황 파악 (병렬 수행)
- **코드베이스**: 최근 커밋 로그(`git log --oneline -20`), 현재 브랜치 목록, `specs/` 디렉터리 구조를 확인한다.
- **GitHub 이슈**: `gh issue list --state open --limit 30` 으로 열린 이슈를 조회한다. 필요 시 `gh issue view <N>` 으로 상세 내용을 확인한다.
- **최근 PR**: `gh pr list --state merged --limit 10` 으로 최근 병합된 PR을 확인해 완료된 작업을 파악한다.

### 3. 다음 작업 제안
수집한 정보를 바탕으로 다음 기준으로 우선순위를 평가하여 **3개 이하**의 후보를 제안한다:
1. 이미 열려 있는 이슈 중 블로킹이 없고 의존성이 충족된 것
2. 기존 스펙/계획이 있어 즉시 구현에 착수할 수 있는 것
3. 비즈니스 가치(사용자 가치 > 내부 개선 > 기술 부채 순)

제안 형식:
```
## 다음 작업 후보

### 1순위: [Issue #N] <이슈 제목>
- 이유: <한두 줄 근거>
- 선행 조건: <없음 or 구체적 조건>

### 2순위: ...
```

### 4. 작업 시작 절차 (사용자가 승인 후)
```bash
# main에서 이슈 브랜치 생성
git -C <repo-root> checkout -b issue/<N>-<slug> main

# 구현 → 품질 게이트 통과
npm run validate && npm run test

# 커밋 후 PR 생성
gh pr create --title "[Issue #N] <설명>" --body "..."
```
- 브랜치 네이밍: `issue/<N>-<short-slug>` (예: `issue/61-public-search-api`)
- PR은 반드시 `main` 을 base 브랜치로 사용한다.
- PR 본문 형식은 **PR body format** 규칙을 따른다.

> **주의**: 3단계 제안 이후 사용자의 명시적 승인 없이 브랜치를 생성하거나 코드를 변경하지 않는다.

## Security Rules For Public Repo (Permanent)

- **No hardcoded infra refs**: Supabase project ref/ID, API URL, 키를 문서/스크립트/코드에 하드코딩하지 말고 `.env.local` 기반으로 주입.
- **`db:types` 실행 규칙**: `SUPABASE_PROJECT_ID`가 설정되지 않으면 실행 실패해야 하며, 기본값 fallback을 두지 않는다.
- **Never commit secrets**: `SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`, `ADMIN_SESSION_SECRET`, `ADMIN_PASSWORD`, `CRON_SECRET`는 어떤 형태로도 커밋 금지.
- **Public key handling**: `NEXT_PUBLIC_*` 값은 공개될 수 있다고 가정하고 권한 최소화(RLS + 정책) 전제 하에만 사용.
- **RLS gate**: RLS/권한 정책 없이 실제 데이터(또는 PII)를 운영 DB에 적재하지 않는다.
- **Pre-commit check**: 커밋 전 `git diff --cached | grep -E 'sk-ant-|service_role|ADMIN_SESSION_SECRET|CRON_SECRET|SUPABASE_SERVICE_ROLE_KEY'`를 실행해 의심 패턴을 차단.
<!-- MANUAL ADDITIONS END -->
