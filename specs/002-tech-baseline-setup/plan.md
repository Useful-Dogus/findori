# Implementation Plan: 프로젝트 기술 베이스라인 셋업

**Branch**: `002-tech-baseline-setup` | **Date**: 2026-02-27 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `specs/002-tech-baseline-setup/spec.md`

---

## Summary

Next.js 15 (App Router + TypeScript) + Tailwind CSS v4 + Supabase + Vercel 기반의 Findori MVP 프로젝트를 초기화한다. 현재 레포는 문서와 spec만 존재하며 Next.js 앱이 없다. 본 플랜은 앱 골격 생성, 기술 통합 검증, CI 설정을 완료하는 것을 목표로 한다. 이후 모든 기능 이슈(#3~#32)의 전제 조건이 된다.

---

## Technical Context

**Language/Version**: TypeScript 5.4+, Node.js 20+
**Primary Dependencies**: Next.js 15 (App Router, Turbopack), React 19, Tailwind CSS v4, @supabase/supabase-js, @supabase/ssr
**Storage**: Supabase PostgreSQL (관리형)
**Testing**: Vitest + @testing-library/react + jsdom
**Target Platform**: Vercel (Hobby 티어), 브라우저 (모바일 360-430px, 데스크톱 최대 960px)
**Project Type**: Full-stack web application (SSR + API Routes + Admin UI)
**Performance Goals**: 피드 첫 화면 LCP 2.5초 이하, 공유 링크 TTFB 1초 이하 (Vercel Analytics 기준)
**Constraints**: Vercel Hobby 티어 — 함수 최대 실행 300초, Cron 1일 1회, 런타임 로그 1시간 보존
**Scale/Scope**: 초기 사용자 수십 명 이하. 단일 레포에 프론트엔드/API/파이프라인 통합.

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| 원칙 | 판정 | 근거 |
|------|------|------|
| I. 코드 품질 게이트 | ✅ PASS | ESLint flat config + Prettier + `npm run validate` CI 게이트 계획. |
| II. 테스트 정의 정확성 | ✅ PASS | Vitest 설정 포함. async RSC는 E2E(Playwright)로 보완 예정. |
| III. UX 일관성 | ✅ PASS | 베이스라인 단계 — 디자인 토큰(@theme)을 공통으로 정의해 이후 일관성 기반 마련. |
| IV. 성능 우선 | ✅ PASS | LCP/TTFB 목표 명시. Next.js 15 캐싱 기본값 역전(opt-in) 인지하고 설계. |
| V. 소규모, 검증 가능 | ✅ PASS | 베이스라인 자체가 작은 단위. 이후 기능 이슈들을 독립적으로 구현 가능한 골격 제공. |

**Phase 1 설계 후 재검토**: 복잡성 위반 없음. 단일 Next.js 앱 구조가 요구사항을 만족한다.

---

## Project Structure

### Documentation (this feature)

```text
specs/002-tech-baseline-setup/
├── plan.md              # 이 파일
├── research.md          # Phase 0 리서치 결과
├── data-model.md        # DB 엔티티 및 TypeScript 타입 전략
├── quickstart.md        # 로컬 개발 환경 구동 가이드
├── contracts/
│   └── api.md           # API 엔드포인트 계약
└── tasks.md             # Phase 2 산출물 (/speckit.tasks 명령)
```

### Source Code (repository root)

```text
findori/
├── src/
│   ├── app/
│   │   ├── (public)/                        # 공개 피드 라우트 그룹
│   │   │   ├── layout.tsx                   # 공개 레이아웃
│   │   │   ├── page.tsx                     # / → 최신 피드로 리다이렉트
│   │   │   └── feed/
│   │   │       └── [date]/
│   │   │           ├── page.tsx             # /feed/[date]
│   │   │           └── issue/
│   │   │               └── [id]/
│   │   │                   └── page.tsx     # /feed/[date]/issue/[id]
│   │   ├── (admin)/                         # Admin 라우트 그룹
│   │   │   ├── layout.tsx                   # Admin 레이아웃 (인증 가드)
│   │   │   └── admin/
│   │   │       ├── page.tsx                 # /admin
│   │   │       ├── login/
│   │   │       │   └── page.tsx             # /admin/login
│   │   │       ├── feed/
│   │   │       │   └── [date]/
│   │   │       │       └── page.tsx         # /admin/feed/[date]
│   │   │       └── sources/
│   │   │           └── page.tsx             # /admin/sources
│   │   ├── api/
│   │   │   ├── feeds/
│   │   │   │   ├── latest/route.ts          # GET /api/feeds/latest
│   │   │   │   └── [date]/route.ts          # GET /api/feeds/[date]
│   │   │   ├── issues/
│   │   │   │   └── [id]/route.ts            # GET /api/issues/[id]
│   │   │   ├── admin/
│   │   │   │   ├── auth/
│   │   │   │   │   ├── login/route.ts
│   │   │   │   │   └── logout/route.ts
│   │   │   │   ├── feeds/
│   │   │   │   │   ├── route.ts
│   │   │   │   │   └── [date]/
│   │   │   │   │       ├── route.ts
│   │   │   │   │       └── publish/route.ts
│   │   │   │   ├── issues/
│   │   │   │   │   └── [id]/route.ts
│   │   │   │   ├── sources/
│   │   │   │   │   ├── route.ts
│   │   │   │   │   └── [id]/route.ts
│   │   │   │   └── pipeline/
│   │   │   │       ├── run/route.ts
│   │   │   │       └── logs/route.ts
│   │   │   ├── cron/
│   │   │   │   └── pipeline/route.ts        # GET /api/cron/pipeline
│   │   │   └── og/
│   │   │       └── issue/[id]/route.ts      # GET /api/og/issue/[id]
│   │   ├── layout.tsx                       # 루트 레이아웃 (html, body)
│   │   ├── globals.css                      # @import "tailwindcss" + @theme {}
│   │   └── not-found.tsx
│   ├── components/
│   │   ├── ui/                              # 공통 UI 컴포넌트 (Button, Card 등)
│   │   └── features/
│   │       ├── feed/                        # 공개 피드 컴포넌트
│   │       └── admin/                       # Admin UI 컴포넌트
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts                    # 브라우저 클라이언트
│   │   │   ├── server.ts                    # 서버 클라이언트 (RSC, Route Handler)
│   │   │   ├── middleware.ts                # 세션 갱신 헬퍼
│   │   │   └── admin.ts                     # Service Role 클라이언트
│   │   └── utils.ts
│   ├── types/
│   │   ├── database.types.ts               # supabase CLI 자동 생성
│   │   └── cards.ts                         # cards[] 스키마 수동 타입 정의
│   └── middleware.ts                        # Next.js Middleware (Admin 인증 게이트)
├── tests/
│   ├── unit/
│   │   ├── components/
│   │   └── lib/
│   └── integration/
│       └── api/
├── public/
│   └── og-default.png                       # 기본 OG 이미지 (정적)
├── .env.example                             # 환경 변수 템플릿 (git 커밋)
├── .env.local                               # 실제 값 (gitignore)
├── .gitignore
├── eslint.config.mjs                        # ESLint flat config
├── .prettierrc
├── .prettierignore
├── next.config.ts                           # typedRoutes: true
├── postcss.config.mjs                       # @tailwindcss/postcss
├── tsconfig.json                            # strict, bundler 해상도
├── vercel.json                              # Cron 설정만
├── vitest.config.mts
├── vitest.setup.ts
└── package.json
```

**Structure Decision**: 단일 Next.js App Router 프로젝트. `src/` 내에 라우트 그룹으로 public/admin 분리. 백엔드 로직은 `src/lib/`에 순수 함수로 추출하여 단위 테스트 가능하게 구조화.

---

## Implementation Phases

### Phase A: 프로젝트 초기화

**목표**: Next.js 15 앱 골격 생성 및 기본 설정 완료

1. `npx create-next-app@latest`으로 Next.js 15 초기화 (src/ 디렉토리, App Router, TypeScript, Tailwind 제외 — 수동 설정)
2. `tsconfig.json` 설정: `"moduleResolution": "bundler"`, `"strict": true`, `"paths": { "@/*": ["./src/*"] }`
3. `next.config.ts` 작성: `typedRoutes: true`
4. `package.json` 스크립트 추가: `validate`, `type-check`, `db:types`

### Phase B: Tailwind CSS v4 설정

**목표**: Tailwind v4 CSS-first 설정 완료 및 기본 디자인 토큰 정의

1. `npm install tailwindcss @tailwindcss/postcss` 설치
2. `postcss.config.mjs` 작성 (`"@tailwindcss/postcss"` 플러그인)
3. `src/app/globals.css` 작성: `@import "tailwindcss"` + `@theme {}` 블록 (SRS 카드 스키마의 hex 색상 기반 다크 테마 토큰)
4. 다크 모드 전략 설정 (`@custom-variant dark`)
5. Prettier Tailwind 플러그인 설정 (`prettier-plugin-tailwindcss`)

### Phase C: Supabase 연동

**목표**: Supabase 4가지 클라이언트 설정 및 DB 타입 연동

1. `npm install @supabase/supabase-js @supabase/ssr` 설치
2. `src/lib/supabase/` 아래 4개 파일 작성 (client.ts, server.ts, middleware.ts, admin.ts)
3. `.env.example` 작성 (5개 환경 변수 템플릿)
4. `src/middleware.ts` 작성 (세션 갱신 + Admin 경로 보호)
5. `npm run db:types` 실행하여 `src/types/database.types.ts` 생성
6. `src/types/cards.ts` 작성 (SRS § 4.2 기준 수동 타입 정의)

### Phase D: ESLint + Prettier + Vitest 설정

**목표**: 코드 품질 도구 및 테스트 인프라 완료

1. `npm install -D eslint eslint-config-next eslint-config-prettier prettier prettier-plugin-tailwindcss` 설치
2. `eslint.config.mjs` 작성 (flat config)
3. `.prettierrc`, `.prettierignore` 작성
4. `npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/dom vite-tsconfig-paths @testing-library/jest-dom` 설치
5. `vitest.config.mts`, `vitest.setup.ts` 작성
6. 스모크 테스트 1개 작성 (utils 함수) — CI 파이프라인 통과 확인용

### Phase E: 라우팅 골격 + Vercel 설정

**목표**: 앱 라우트 구조 생성 및 Vercel 배포 설정 완료

1. `src/app/` 라우트 그룹 및 빈 page.tsx 파일 생성 (위 프로젝트 구조 기준)
2. `src/app/layout.tsx` (루트 레이아웃), `src/app/(public)/layout.tsx`, `src/app/(admin)/layout.tsx` 작성
3. `vercel.json` 작성 (Cron 설정: `/api/cron/pipeline`, `0 13 * * *`)
4. `.gitignore` 업데이트 (`.env.local`, `.next/`, `node_modules/` 등)
5. Vercel에 레포 연결 + 환경 변수 설정 (Production 스코프)
6. `main` 브랜치 push → 자동 배포 확인

### Phase F: 검증

**목표**: 베이스라인 완료 기준(DoD) 검증

1. `npm run validate` 통과 확인 (type-check + lint + format:check)
2. `npm run test` 통과 확인
3. `npm run build` 성공 확인
4. 로컬에서 `npm run dev` 실행 후 브라우저 확인
5. 프로덕션 URL 접속 확인 (Vercel 배포)
6. Supabase 연결 확인 (임시 테스트 쿼리 또는 Supabase 대시보드)
7. Cron 엔드포인트 수동 호출 테스트

---

## Complexity Tracking

Constitution 위반 없음. 단일 프로젝트 구조, 최소한의 추상화.
