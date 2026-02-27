# Tasks: 프로젝트 기술 베이스라인 셋업

**Input**: Design documents from `/specs/002-tech-baseline-setup/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/api.md ✅, quickstart.md ✅

**Tests**: 기능 spec에 별도 TDD 요청 없음. Phase 2에서 CI 통과용 스모크 테스트 1개만 포함.

**Organization**: spec.md의 3개 User Story(US1/US2/US3)를 기준으로 구성.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 병렬 실행 가능 (다른 파일, 의존성 없음)
- **[US]**: 속하는 User Story (US1, US2, US3)
- 모든 태스크에 정확한 파일 경로 포함

---

## Phase 1: Setup (프로젝트 초기화)

**Purpose**: Next.js 15 앱 골격 생성 및 핵심 설정 완료

- [x] T001 `npx create-next-app@latest .` 실행 — src/, App Router, TypeScript 선택, Tailwind 제외 (수동 설정 예정)
- [x] T002 [P] `tsconfig.json` 수정 — `"moduleResolution": "bundler"`, `"strict": true`, `"paths": { "@/*": ["./src/*"] }` 추가
- [x] T003 [P] `next.config.ts` 작성 — `typedRoutes: true` 활성화 (`NextConfig` 타입 사용)
- [x] T004 `package.json` 스크립트 보완 — `validate` (`type-check && lint && format:check`), `type-check` (`tsc --noEmit`), `db:types` (`supabase gen types typescript --project-id <ID> > src/types/database.types.ts`) 추가
- [x] T005 [P] `.env.example` 작성 — `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_PASSWORD`, `CRON_SECRET` 5개 변수 플레이스홀더
- [x] T006 [P] `.gitignore` 확인 및 보완 — `.env.local`, `.next/`, `node_modules/`, `src/types/database.types.ts` 포함

**Checkpoint**: Next.js 프로젝트 초기화 완료 — Phase 2 진행 가능

---

## Phase 2: Foundational (코드 품질 도구 — 모든 User Story 전제 조건)

**Purpose**: ESLint, Prettier, Vitest CI 인프라 — 이 Phase 없이는 PR 게이트 통과 불가

**⚠️ CRITICAL**: User Story 구현 전 이 Phase 완료 필수

- [x] T007 ESLint 패키지 설치 — `npm install -D eslint eslint-config-next eslint-config-prettier`
- [x] T008 `eslint.config.mjs` 작성 — flat config (`core-web-vitals` + `typescript` + `prettier` + `globalIgnores(['.next/**', 'node_modules/**'])`)
- [x] T009 [P] Prettier 패키지 설치 — `npm install -D prettier prettier-plugin-tailwindcss`
- [x] T010 [P] `.prettierrc` 작성 — `{ "semi": false, "singleQuote": true, "trailingComma": "all", "printWidth": 100, "plugins": ["prettier-plugin-tailwindcss"] }` + `.prettierignore` 작성
- [x] T011 Vitest 패키지 설치 — `npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/dom vite-tsconfig-paths @testing-library/jest-dom`
- [x] T012 `vitest.config.mts` 작성 — `environment: 'jsdom'`, `globals: true`, `setupFiles: ['./vitest.setup.ts']`
- [x] T013 [P] `vitest.setup.ts` 작성 — `import '@testing-library/jest-dom'`
- [x] T014 스모크 테스트 작성 — `tests/unit/lib/utils.test.ts` (예: `cn()` 유틸 함수 또는 빈 단언) CI 통과 확인용
- [x] T015 `npm run validate` + `npm run test` 통과 확인

**Checkpoint**: 코드 품질 인프라 완료 — User Story 구현 병렬 시작 가능

---

## Phase 3: User Story 1 — 로컬 개발 환경 구동 (Priority: P1) 🎯 MVP

**Goal**: `npm install` + `npm run dev` 한 번으로 브라우저에서 초기 화면이 로드되고, 코드 변경 시 자동 갱신됨

**Independent Test**: `.env.local` 없이도 `npm run dev` 실행 시 브라우저에서 페이지가 표시되고, 파일 수정 후 HMR로 즉시 반영됨

### Tailwind CSS v4 설정

- [x] T016 [US1] Tailwind CSS v4 패키지 설치 — `npm install tailwindcss @tailwindcss/postcss`
- [x] T017 [US1] `postcss.config.mjs` 작성 — 플러그인 키 `"@tailwindcss/postcss"` (구 `"tailwindcss"` 사용 금지, `autoprefixer` 추가 금지)
- [x] T018 [US1] `src/app/globals.css` 작성 — `@import "tailwindcss"` + `@theme {}` 블록: 다크 배경 기반 색상 토큰(`--color-background: #0f172a` 등), `@custom-variant dark (&:where(.dark, .dark *))` 선언

### 앱 레이아웃 구조

- [x] T019 [US1] `src/app/layout.tsx` 작성 — 루트 레이아웃 (`<html lang="ko">`, `<body>`, `globals.css` import, `next/font` 폰트 설정)
- [x] T020 [P] [US1] `src/app/(public)/layout.tsx` 작성 — 공개 피드 레이아웃 (공개 네비게이션 위한 기본 래퍼, 향후 투자 자문 고지 위치 예약)
- [x] T021 [P] [US1] `src/app/(admin)/layout.tsx` 작성 — Admin 레이아웃 (Admin 전용 래퍼, `/admin/login` 예외 처리 주석)

### 라우팅 골격 (페이지)

- [x] T022 [P] [US1] `src/app/page.tsx` 작성 — 홈 (`/`): `redirect('/feed/latest')` 또는 최신 피드로 리다이렉트 플레이스홀더
- [x] T023 [P] [US1] `src/app/(public)/feed/[date]/page.tsx` 작성 — 날짜별 피드 골격 (params 타입: `Promise<{ date: string }>`, `await params` 필수)
- [x] T024 [P] [US1] `src/app/(public)/feed/[date]/issue/[id]/page.tsx` 작성 — 이슈 공유 링크 골격
- [x] T025 [P] [US1] `src/app/(admin)/admin/page.tsx` 작성 — Admin 홈 골격
- [x] T026 [P] [US1] `src/app/(admin)/admin/login/page.tsx` 작성 — Admin 로그인 골격
- [x] T027 [P] [US1] `src/app/(admin)/admin/feed/[date]/page.tsx` 작성 — 날짜별 이슈 검토 골격
- [x] T028 [P] [US1] `src/app/(admin)/admin/sources/page.tsx` 작성 — 화이트리스트 매체 관리 골격
- [x] T029 [P] [US1] `src/app/not-found.tsx` 작성 — 404 페이지 (홈으로 유도 CTA 텍스트 포함)

### 라우팅 골격 (API Route Handlers)

- [x] T030 [P] [US1] `src/app/api/feeds/latest/route.ts` 작성 — `GET` stub: `Response.json({ date: null })` 반환
- [x] T031 [P] [US1] `src/app/api/feeds/[date]/route.ts` 작성 — `GET` stub: `Response.json({ date, issues: [] })` 반환
- [x] T032 [P] [US1] `src/app/api/issues/[id]/route.ts` 작성 — `GET` stub: `Response.json({ error: 'not_implemented' }, { status: 501 })` 반환
- [x] T033 [P] [US1] `src/app/api/cron/pipeline/route.ts` 작성 — `GET`: `Authorization: Bearer <CRON_SECRET>` 헤더 검증 로직 완전 구현 (인증 실패 시 401), 파이프라인 본체는 stub
- [x] T034 [P] [US1] `src/app/api/og/issue/[id]/route.ts` 작성 — `GET` stub: 기본 OG 이미지 리다이렉트

### 검증

- [x] T035 [US1] `npm run dev` 실행 후 `http://localhost:3000` 브라우저 확인 — 오류 없이 페이지 로드
- [x] T036 [US1] `src/app/globals.css` 수정 후 브라우저에서 HMR 자동 반영 확인
- [x] T037 [US1] `npm run build` 성공 확인 (타입 오류 없음)

**Checkpoint**: `npm install && npm run dev` → 브라우저 초기 화면 로드 완료. User Story 1 독립 검증 가능.

---

## Phase 4: User Story 2 — 데이터베이스 연결 확인 (Priority: P2)

**Goal**: 로컬 환경에서 Supabase DB에 연결하고, 실제 테이블 조회가 오류 없이 반환됨

**Independent Test**: `.env.local`에 실제 Supabase 접속 정보 입력 후 `npm run dev` 실행 → 앱이 DB에서 데이터를 조회할 수 있음 (임시 테스트 쿼리 또는 Supabase 대시보드에서 Table Editor 확인)

### Supabase 클라이언트 설정

- [x] T038 [US2] Supabase 패키지 설치 — `npm install @supabase/supabase-js @supabase/ssr` (`@supabase/auth-helpers-nextjs` 사용 금지)
- [x] T039 [US2] `.env.local` 작성 — `.env.example` 기반, 실제 Supabase 프로젝트 접속 정보 입력
- [x] T040 [P] [US2] `src/lib/supabase/client.ts` 작성 — `createBrowserClient<Database>()` 패턴 (싱글턴 금지, 함수로 매 호출 생성)
- [x] T041 [P] [US2] `src/lib/supabase/server.ts` 작성 — `createServerClient<Database>()` 패턴, `await cookies()` 필수 (Next.js 15), `getAll`/`setAll` 쿠키 핸들러 포함
- [x] T042 [P] [US2] `src/lib/supabase/middleware.ts` 작성 — `updateSession()` 함수: `supabaseResponse` 객체 반드시 그대로 반환 (새 `NextResponse` 생성 금지)
- [x] T043 [P] [US2] `src/lib/supabase/admin.ts` 작성 — `createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)` Service Role 클라이언트 (서버 전용, `autoRefreshToken: false`)

### Next.js Middleware

- [x] T044 [US2] `src/middleware.ts` 작성 — `updateSession()` 호출 + `/admin` 경로 보호 (세션 쿠키 없으면 `/admin/login`으로 redirect), matcher 설정 (`_next/static`, `_next/image`, `favicon.ico` 제외)

### TypeScript 타입 연동

- [x] T045 [US2] `supabase login` + `npm run db:types` 실행 → `src/types/database.types.ts` 생성 (Supabase CLI 필요)
- [x] T046 [US2] `src/types/cards.ts` 작성 — `data-model.md`의 카드 스키마 기반 TypeScript 유니온 타입 (`CoverCard | ReasonCard | ... | SourceCard`)
- [x] T047 [US2] `src/lib/supabase/client.ts`, `server.ts`, `admin.ts`에 `Database` 제네릭 타입 주입 확인 (T040-T043 완료 후)

### 연결 검증

- [ ] T048 [US2] DB 연결 스모크 확인 — `src/lib/supabase/server.ts`의 클라이언트로 `supabase.from('feeds').select('count')` 임시 쿼리 실행 (또는 Supabase 대시보드 Table Editor에서 테이블 생성 전 연결 상태 확인)
- [ ] T049 [US2] 잘못된 환경 변수로 앱 실행 시 명확한 오류 메시지 출력 확인

**Checkpoint**: `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` 입력 후 DB 조회 성공. User Story 2 독립 검증 가능.

---

## Phase 5: User Story 3 — 자동 배포 파이프라인 (Priority: P3)

**Goal**: `main` 브랜치에 push하면 자동 빌드·배포가 완료되고, 공개 URL에서 최신 코드가 서비스됨

**Independent Test**: `git push origin main` 후 Vercel 대시보드에서 빌드 성공 확인 + 프로덕션 URL 접속 → 홈 페이지 로드

### Vercel 설정

- [x] T050 [US3] `vercel.json` 작성 — Cron Job 설정: `{ "crons": [{ "path": "/api/cron/pipeline", "schedule": "0 13 * * *" }] }` (UTC 13:00 = KST 22:00)
- [ ] T051 [US3] Vercel 프로젝트 생성 및 GitHub 레포 연결 (`vercel link` 또는 Vercel 대시보드)
- [ ] T052 [US3] Vercel 대시보드에서 환경 변수 설정 — Production 스코프: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_PASSWORD`, `CRON_SECRET`

### 배포 검증

- [ ] T053 [US3] `main` 브랜치에 push → Vercel 자동 빌드 시작 확인 (Vercel 대시보드 Deployments 탭)
- [ ] T054 [US3] 빌드 성공 후 프로덕션 URL 접속 확인 — 홈 페이지가 3초 이내 로드
- [ ] T055 [US3] 프로덕션에서 Cron 엔드포인트 수동 호출 — `curl -H "Authorization: Bearer $CRON_SECRET" https://<your-domain>/api/cron/pipeline` → `{ "ok": true }` 반환 확인
- [ ] T056 [US3] 의도적으로 잘못된 코드를 push한 후 빌드 실패 시 이전 버전 유지 확인 (옵션 — 빌드 실패 롤백 동작 검증)

**Checkpoint**: `git push` → 프로덕션 자동 배포 완료. User Story 3 독립 검증 가능.

---

## Phase 6: Polish & 최종 검증

**Purpose**: 모든 User Story 완료 후 베이스라인 품질 기준 최종 확인

- [x] T057 [P] `public/og-default.png` 추가 — 기본 OG 정적 이미지 (1200×630, Findori 브랜딩 또는 플레이스홀더)
- [x] T058 [P] `src/lib/utils.ts` 작성 — `cn()` 유틸리티 함수 (`tailwind-merge` + `clsx` 조합, 향후 컴포넌트에서 공통 사용)
- [x] T059 `npm run validate` 최종 통과 확인 (type-check + lint + format:check 모두 pass)
- [x] T060 [P] `npm run test` 최종 통과 확인 (스모크 테스트 포함)
- [ ] T061 `quickstart.md` 절차대로 처음부터 실행 확인 — 신규 환경에서 5분 이내 앱 구동 가능
- [x] T062 [P] CLAUDE.md 수동 추가 섹션 업데이트 — 프로젝트별 주의사항 기재 (`<!-- MANUAL ADDITIONS START -->` 블록)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: 의존성 없음 — 즉시 시작
- **Foundational (Phase 2)**: Phase 1 완료 필요 — 모든 User Story 차단
- **US1 (Phase 3)**: Phase 2 완료 후 시작 — US2, US3와 독립
- **US2 (Phase 4)**: Phase 2 완료 후 시작 — US1, US3와 독립
- **US3 (Phase 5)**: Phase 3, 4 완료 권장 (배포할 기능이 있어야 의미 있음)
- **Polish (Phase 6)**: 모든 User Story 완료 후

### User Story 의존성

| User Story | 선행 조건 | 다른 US 의존 |
|-----------|----------|------------|
| US1 (P1) 로컬 개발 환경 | Phase 1+2 완료 | 없음 |
| US2 (P2) DB 연결 | Phase 1+2 완료 | 없음 (US1과 독립) |
| US3 (P3) 자동 배포 | Phase 1+2+3 완료 권장 | US1 완료 후 의미 있음 |

### Task 내 실행 순서 (US1 예시)

```
T016 (패키지 설치)
    ↓
T017 (postcss 설정)  →  T018 (globals.css) 동시 가능
    ↓
T019 (루트 레이아웃)
    ↓
T020, T021 (공개/Admin 레이아웃 병렬)
    ↓
T022~T034 (페이지+API 골격 모두 병렬)
    ↓
T035, T036, T037 (검증)
```

---

## Parallel Opportunities

### Phase 1 병렬 실행

```
# 동시 실행 가능:
T002  tsconfig.json 수정
T003  next.config.ts 작성
T005  .env.example 작성
T006  .gitignore 확인
```

### Phase 2 병렬 실행

```
# T007 완료 후 T008 실행, T009 완료 후 T010 실행
# T007/T008 그룹과 T009/T010 그룹은 병렬 가능
# T011 완료 후 T012/T013 병렬:
T012  vitest.config.mts
T013  vitest.setup.ts
```

### Phase 3 (US1) 병렬 실행

```
# T016→T017→T018 순서 후:
T020  (public)/layout.tsx
T021  (admin)/layout.tsx
T022  page.tsx (홈)
T023  feed/[date]/page.tsx
T024  feed/[date]/issue/[id]/page.tsx
T025  admin/page.tsx
T026  admin/login/page.tsx
T027  admin/feed/[date]/page.tsx
T028  admin/sources/page.tsx
T029  not-found.tsx
# 위 9개 모두 병렬 실행 가능

T030~T034  API Route stubs 모두 병렬 실행 가능
```

### Phase 4 (US2) 병렬 실행

```
# T038(설치) → T039(.env.local) 후:
T040  supabase/client.ts
T041  supabase/server.ts
T042  supabase/middleware.ts
T043  supabase/admin.ts
# 위 4개 병렬 실행 가능
```

---

## Implementation Strategy

### MVP First (User Story 1만)

1. Phase 1: Setup 완료
2. Phase 2: Foundational 완료 (CI 게이트 확보)
3. Phase 3: US1 완료 → `npm run dev` 브라우저 확인
4. **STOP & VALIDATE**: `npm run build` + 브라우저 확인
5. 베이스라인 MVP 준수 → 이슈 #3 (환경 변수 체계) 진행 가능

### Incremental Delivery

1. Setup + Foundational → 코드 품질 인프라 완료
2. US1 완료 → 로컬 dev 환경 구동 확인 → 이슈 #3, #4, #5 병렬 시작 가능
3. US2 완료 → Supabase 연결 확인 → 이슈 #4 (DB 스키마)와 연동 준비
4. US3 완료 → 자동 배포 확인 → 이후 모든 이슈 merge 즉시 배포

---

## Notes

- **[P]** 표시 태스크 = 다른 파일, 선행 의존성 없음 — 병렬 실행 가능
- **Next.js 15 필수 규칙**: `cookies()`, `params`, `headers()` 모두 `await` 필요 — 누락 시 빌드 경고 또는 런타임 오류
- **Supabase 클라이언트 규칙**: `getUser()` 사용, `getSession()` 금지 / 서버 클라이언트는 싱글턴 패턴 금지
- **Tailwind v4 규칙**: `@import "tailwindcss"` 사용, `@tailwind base/components/utilities` 지시어 금지 / 플러그인 키 `"@tailwindcss/postcss"` 확인
- **Vercel Hobby 제약**: Cron 1일 1회, 함수 최대 300초 — 파이프라인 5분 초과 시 체인 호출 설계 필요
- 각 Phase Checkpoint에서 독립 검증 후 다음 Phase 진행
- `npm run validate` (type-check + lint + format:check)는 모든 구현 후 반드시 통과 확인
