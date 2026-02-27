# Research: 프로젝트 기술 베이스라인 셋업

**Branch**: `002-tech-baseline-setup` | **Date**: 2026-02-27

---

## 1. Next.js 15 + TypeScript 설정

### Decision: `src/` 디렉토리 + 라우트 그룹

- **What**: 모든 앱 코드를 `src/` 아래 배치. `(public)` + `(admin)` 라우트 그룹으로 두 개의 독립적인 루트 레이아웃 사용.
- **Rationale**: Admin UI와 공개 피드는 네비게이션, 인증, 스타일이 완전히 다르다. 라우트 그룹은 URL prefix 없이 별도 `layout.tsx`를 제공한다.
- **Alternatives considered**: Monorepo(apps/web, apps/admin) — 1인 개발자에게 과도한 복잡성.

### Decision: TypeScript strict 모드 + `"moduleResolution": "bundler"`

- **What**: `tsconfig.json`에서 `"strict": true`, `"moduleResolution": "bundler"`, `"typedRoutes": true` 활성화.
- **Rationale**: `"bundler"` 해상도는 Turbopack/Vite 기반 Next.js 15의 정확한 설정이다. `"node16"`은 import 경로에 `.js` 확장자를 강제한다. `typedRoutes: true`는 `<Link href>` 타입 오류를 컴파일 타임에 감지한다.
- **Alternatives considered**: `"node"` 해상도 — Next.js 15에서 잘못된 타입 오류 발생.

### Decision: ESLint flat config (`eslint.config.mjs`) + Prettier

- **What**: ESLint 9의 flat config 형식. `eslint-config-next/core-web-vitals` + `eslint-config-next/typescript` + `eslint-config-prettier` 조합.
- **Rationale**: Next.js 15는 ESLint 9를 기본으로 사용. 구 `.eslintrc.*` 형식은 `ESLINT_USE_FLAT_CONFIG=false` 플래그가 필요하다. `prettier-plugin-tailwindcss`로 Tailwind 클래스 정렬 자동화.
- **Alternatives considered**: `.eslintrc.json` — 레거시 형식, 추후 마이그레이션 필요.

### Decision: Next.js 15 주요 Breaking Changes 처리

- `cookies()`, `headers()`, `params`는 모두 **async** — 반드시 `await` 필요.
- `fetch()`는 기본적으로 캐시 안 함(v14에서 뒤집힘) — 캐싱 필요 시 명시적으로 `{ cache: 'force-cache' }` 지정.
- `useFormState` → `useActionState` (React 19).
- `next dev` 기본 번들러가 Turbopack.

---

## 2. Tailwind CSS v4 설정

### Decision: CSS-first 설정 방식

- **What**: `tailwind.config.js` 없음. `globals.css`에서 `@import "tailwindcss"` + `@theme {}` 블록으로 모든 설정.
- **Rationale**: v4의 Oxide 엔진은 파일을 자동으로 탐지하므로 `content` 배열 불필요. 모든 `@theme` 값은 CSS 변수(`--color-*` 등)와 Tailwind 유틸리티를 동시에 생성.
- **Alternatives considered**: v3 유지 — v4는 성능 개선(~5x 빠른 빌드)과 디자인 토큰-CSS 변수 직접 연동 제공.

### Decision: PostCSS 플러그인 키 변경

- **What**: `postcss.config.mjs`에서 플러그인 키를 `"@tailwindcss/postcss"`로 사용.
- **Rationale**: v4에서 `"tailwindcss"` 키는 인식되지 않음. `autoprefixer`도 불필요 (v4 내장 처리).
- **주의**: v3 튜토리얼의 설정을 복사하면 무음 실패.

### Decision: 다크 모드 — class 전략

- **What**: `@custom-variant dark (&:where(.dark, .dark *))` 선언.
- **Rationale**: 핀도리는 어두운 배경 중심 디자인(SRS의 카드 스키마 예시에서 `#0f172a` 베이스). 사용자 OS 설정 무시, 앱이 항상 다크 모드로 고정 운영 예정.

---

## 3. Supabase + Next.js 15 SSR 설정

### Decision: `@supabase/ssr` 패키지 사용

- **What**: `@supabase/supabase-js` + `@supabase/ssr` 패키지. `@supabase/auth-helpers-nextjs`는 사용 금지.
- **Rationale**: `@supabase/auth-helpers-nextjs`는 공식 deprecated. `@supabase/ssr`이 Next.js 15의 async cookies API를 지원하는 공식 패키지.
- **Alternatives considered**: 자체 쿠키 핸들러 — 불필요한 복잡성.

### Decision: 4가지 클라이언트 패턴

- **What**: `lib/supabase/client.ts` (브라우저), `lib/supabase/server.ts` (서버 컴포넌트/Route Handler), `lib/supabase/middleware.ts` (세션 갱신), `lib/supabase/admin.ts` (Service Role, 서버 전용).
- **Rationale**: 각 컨텍스트마다 다른 쿠키 접근 방식이 필요. 서버 클라이언트는 싱글턴 금지 — 요청마다 새 인스턴스 생성.
- **Critical**: `getUser()` 사용, `getSession()` 금지 — `getSession()`은 서버 검증 없이 쿠키만 읽음.

### Decision: 환경 변수 구성

| 변수명 | 범위 | 용도 |
|--------|------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | 전체 | Supabase 프로젝트 URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 전체 | 공개 익명 키 (RLS로 제한) |
| `SUPABASE_SERVICE_ROLE_KEY` | 서버 전용 | RLS 우회 (Admin 전용 작업) |
| `ADMIN_PASSWORD` | 서버 전용 | Admin 로그인 비밀번호 |
| `CRON_SECRET` | 서버 전용 | Cron 엔드포인트 보안 |

### Decision: TypeScript 타입 자동 생성

- **What**: `supabase gen types typescript --project-id <id>` CLI로 `types/database.types.ts` 생성. 모든 클라이언트에 `Database` 제네릭 주입.
- **Rationale**: DB 스키마 변경을 컴파일 타임에 감지. SRS에 정의된 테이블(feeds, issues, tags, issue_tags, media_sources)을 완전히 타입화.

---

## 4. Vercel 배포 설정

### Decision: `vercel.json` — Cron 전용

- **What**: 프레임워크 감지는 자동. `vercel.json`은 Cron Job 설정만 포함.
- **Rationale**: Next.js는 Vercel에서 자동으로 최적 설정됨. 불필요한 `vercel.json` 설정은 자동 최적화를 방해.

```json
{
  "crons": [
    {
      "path": "/api/cron/pipeline",
      "schedule": "0 13 * * *"
    }
  ]
}
```

(KST 22:00 = UTC 13:00)

### Decision: Hobby 티어 제약 인지

- **Cron 정밀도**: 1일 1회 한정, 지정 시간 내 ±59분 오차 허용.
- **함수 최대 실행 시간**: 300초 (5분). 파이프라인이 초과 시 체인 호출 또는 Pro 전환 필요.
- **런타임 로그 보존**: 1시간. Cron 실행 직후 확인 필요.
- **Rationale**: 수십 명 규모에서는 Hobby 티어로 충분. 파이프라인은 5분 이내 완료 가능하도록 설계.

### Decision: 환경 변수 관리 — Vercel 대시보드 스코프

- Production, Preview, Development 스코프 분리.
- `vercel env pull .env.local`로 로컬 개발 환경 동기화.
- `.env.example`을 git에 커밋하여 온보딩 문서화.

---

## 5. 테스팅 설정

### Decision: Vitest (Jest 대신)

- **What**: `vitest` + `@vitejs/plugin-react` + `@testing-library/react` + `jsdom`.
- **Rationale**: 신규 프로젝트에서 Vitest가 더 빠르고 설정이 단순하다. 네이티브 ESM, `next/jest` 래퍼 불필요, TypeScript 퍼스트.
- **Alternatives considered**: Jest — 친숙하지만 `next/jest` 설정, Babel/SWC 변환 오버헤드, ESM 문제.

### Decision: async RSC는 단위 테스트 제외

- **What**: async Server Component는 Vitest/Jest로 단위 테스트 불가 (Next.js 공식 문서 명시). Playwright E2E 또는 수동 검증.
- **Rationale**: `비즈니스 로직 → 순수 함수 분리 → 단위 테스트` 패턴으로 RSC 의존성 최소화.

### Decision: CI 파이프라인 — GitHub Actions

- **What**: `npm run validate` (type-check + lint + format:check) + `vitest run` + `next build`.
- **Rationale**: `next build`가 타입 검사 게이트 역할도 수행. 1인 개발자에게는 이 수준으로 충분.
