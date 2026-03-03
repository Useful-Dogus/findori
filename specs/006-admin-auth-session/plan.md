# Implementation Plan: Admin 인증/세션/미들웨어 구현

**Branch**: `006-admin-auth-session` | **Date**: 2026-03-03 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/Users/chanheepark/dev/laboratory/findori/specs/006-admin-auth-session/spec.md`

## Summary

운영자 전용 `/admin` 경로와 Admin API를 보호하기 위해 환경변수 기반 단일 비밀번호 인증과 서명된 세션 쿠키를 도입한다. 구현은 로그인 화면, 로그인/로그아웃 Route Handler, 세션 서명/검증 유틸리티, `/admin` 보호 미들웨어, 관련 단위 테스트 및 최소 통합 검증으로 구성한다.

## Technical Context

**Language/Version**: TypeScript 5.4+, Node.js 20+  
**Primary Dependencies**: Next.js 15 (App Router, Route Handlers, Middleware), React 19, Zod 4, Vitest  
**Storage**: 브라우저 쿠키 기반 세션 상태, 환경변수 기반 운영 비밀값 (`ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET`)  
**Testing**: Vitest 단위 테스트 + Route Handler/세션 유틸리티 중심 검증  
**Target Platform**: Vercel 배포 환경 + 로컬 Next.js 개발 서버  
**Project Type**: Web application (Next.js 단일 앱)  
**Performance Goals**: Admin 인증 검증은 요청당 상수 시간으로 처리되고, 보호 경로 진입 시 추가 지연이 체감되지 않아야 함  
**Constraints**: 신규 외부 인증 서비스 및 신규 런타임 의존성 추가 없음, 공개 라우트 동작 변경 금지, 쿠키 만료 7일 고정, 보안 속성 `httpOnly`/`Secure`/`SameSite=Strict` 준수  
**Scale/Scope**: 운영자 1인, 보호 대상 화면 3개(`/admin`, `/admin/feed/[date]`, `/admin/sources`)와 Admin API 인증 경계 전반

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Gate | Status | Notes |
|------|--------|-------|
| I. Code Quality Is a Release Gate | ✅ Pass | 세션 로직을 공용 유틸리티로 분리해 Route Handler와 middleware의 중복을 방지한다. |
| II. Tests Define Correctness | ✅ Pass | 세션 서명/검증, 로그인/로그아웃, 보호 경로 차단 시나리오를 테스트 계획에 포함한다. |
| III. User Experience Consistency Over Local Preference | ✅ Pass | 로그인 실패/만료/로그아웃 상태를 일관된 copy와 이동 흐름으로 정리한다. |
| IV. Performance Is a First-Class Requirement | ✅ Pass | DB나 외부 저장소 조회 없이 쿠키 검증만 수행해 보호 경로 진입 비용을 최소화한다. |
| V. Small, Verifiable, and Reversible Delivery | ✅ Pass | 인증 범위를 Admin 경계로 한정하고, 추가 파일 몇 개와 기존 TODO 대체 수준으로 롤백 가능하다. |

**Complexity Tracking**: 위반 없음.

## Project Structure

### Documentation (this feature)

```text
specs/006-admin-auth-session/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/
│   └── admin-auth-api.md
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
src/
├── app/
│   ├── (admin)/
│   │   └── admin/
│   │       └── login/
│   │           └── page.tsx                  # 로그인 화면 및 실패 상태 표시
│   └── api/
│       └── admin/
│           └── auth/
│               ├── login/
│               │   └── route.ts              # 비밀번호 검증 + 세션 발급
│               └── logout/
│                   └── route.ts              # 세션 제거
├── lib/
│   ├── admin/
│   │   └── session.ts                        # 신규: 세션 payload, sign/verify, cookie helpers
│   └── env.ts                                # 기존: 비밀값 검증 사용
└── middleware.ts                             # /admin 경계 보호 + 유효 세션 검증

tests/
└── unit/
    └── lib/
        └── admin-session.test.ts             # 신규: 세션 유틸리티 및 인증 경계 테스트
```

**Structure Decision**: 인증과 세션 로직은 `src/lib/admin/session.ts`로 집중시키고, UI/Route Handler/middleware는 이를 소비하는 얇은 경계로 유지한다. 이 구조가 이후 `#7~#10`에서 동일 인증 유틸리티를 재사용하기 가장 쉽다.

## Phase 0: Research

**상태**: 완료 — [research.md](./research.md) 참조

핵심 결정:

- 세션은 서버 저장소 없이 서명된 stateless 쿠키로 관리
- 로그인과 middleware가 동일한 세션 검증 로직을 사용
- 잘못된 비밀번호는 `401`, 잘못된 요청 본문은 `400`, 인증 없는 Admin API는 `401`, 보호 화면은 로그인으로 redirect
- 로그인 후 직접 진입한 보호 경로로 복귀할 수 있도록 `next` 파라미터를 허용하되, 외부 URL로의 open redirect는 금지

## Phase 1: Design & Contracts

**상태**: 완료

- [data-model.md](./data-model.md) — 세션 payload, 인증 요청/응답, 라우트 보호 상태 모델
- [quickstart.md](./quickstart.md) — 구현 및 검증 절차
- [admin-auth-api.md](./contracts/admin-auth-api.md) — 로그인/로그아웃 API 계약

## Implementation Design

### 1. 세션 유틸리티 (`src/lib/admin/session.ts`)

단일 모듈에 아래 책임을 모은다.

- 쿠키 이름, 만료 시간(7일), 쿠키 속성 상수화
- 세션 payload 타입 정의
- `ADMIN_SESSION_SECRET` 기반 서명 토큰 생성
- 수신 쿠키의 서명/만료 검증
- 유효하지 않은 세션의 실패 이유 분류
- `NextResponse`에 세션 쿠키를 설정/삭제하는 헬퍼 제공

예상 export:

```text
ADMIN_SESSION_COOKIE_NAME
ADMIN_SESSION_TTL_SECONDS
type AdminSessionPayload
type AdminSessionVerificationResult
createAdminSessionToken()
verifyAdminSessionToken()
setAdminSessionCookie()
clearAdminSessionCookie()
readAdminSessionFromRequest()
sanitizeAdminRedirectPath()
```

### 2. 로그인 화면 (`src/app/(admin)/admin/login/page.tsx`)

- 비밀번호 입력 폼과 제출 버튼 제공
- 실패 상태를 query string 또는 서버 응답 기반으로 표시
- 이미 로그인된 세션이 있으면 `/admin` 또는 유효한 `next` 경로로 이동
- 접근성 기준에 맞는 label, focus 상태, 최소 터치 영역 보장

### 3. 로그인 Route Handler (`POST /api/admin/auth/login`)

- 요청 본문 파싱 및 `password` 검증
- 필드 누락/형식 오류는 `400`
- 비밀번호 불일치는 `401`
- 성공 시 서명된 세션 쿠키를 설정하고 성공 응답 반환
- 클라이언트가 후속 이동에 사용할 `redirect_to` 값을 포함

### 4. 로그아웃 Route Handler (`POST /api/admin/auth/logout`)

- 세션 유무와 관계없이 항상 성공적으로 세션 제거 처리
- 세션 쿠키를 즉시 만료시키고 `{ ok: true }` 반환

### 5. 미들웨어 경계 보호 (`src/middleware.ts`)

- 기존 Supabase 세션 갱신 흐름은 유지
- `/admin/login`을 제외한 `/admin` 경로에서 Admin 세션 검증 수행
- 세션 없거나 검증 실패 시 로그인 화면으로 redirect
- redirect 시 원래 요청한 내부 경로를 `next` 파라미터로 유지
- 이미 로그인된 사용자가 `/admin/login`에 접근한 경우 `/admin` 또는 유효한 `next`로 우회
- 공개 라우트와 정적 자원은 기존 matcher 정책대로 그대로 통과

### 6. 테스트 전략

`tests/unit/lib/admin-session.test.ts`에서 다음을 검증한다.

- 유효한 payload로 생성한 토큰이 정상 검증됨
- 만료된 토큰은 거부됨
- 서명이 변조된 토큰은 거부됨
- 외부 URL이나 비정상 경로는 안전한 내부 경로로 정규화됨
- 쿠키 설정 헬퍼가 만료 시간과 보안 속성을 올바르게 부여함

필요 시 동일 파일 또는 별도 테스트에서 Route Handler를 직접 호출해 검증한다.

- 로그인 성공 시 `Set-Cookie` 포함 응답
- 잘못된 비밀번호 시 `401`
- 로그아웃 시 세션 제거 쿠키 설정

## Contracts

외부 노출 계약이 존재하므로 [admin-auth-api.md](./contracts/admin-auth-api.md)로 분리한다.

- `POST /api/admin/auth/login`
- `POST /api/admin/auth/logout`

## Rollout / Reversal

- 변경 범위는 Admin 인증 경계로 국한되므로 문제 발생 시 세션 유틸리티와 middleware/auth route 변경분만 롤백하면 된다.
- 공개 피드 라우트와 공개 API는 영향을 받지 않아야 하며, 검증 항목에 반드시 포함한다.

## Constitution Re-check (Post Design)

| Gate | Status | Notes |
|------|--------|-------|
| I. Code Quality Is a Release Gate | ✅ Pass | 인증 책임이 `session.ts`, route handlers, middleware로 명확히 분리됨 |
| II. Tests Define Correctness | ✅ Pass | 세션 위변조, 만료, 로그인 성공/실패, 로그아웃을 자동 테스트로 커버 |
| III. User Experience Consistency Over Local Preference | ✅ Pass | 로그인 실패/세션 만료/재진입 흐름을 단일 경로로 정리 |
| IV. Performance Is a First-Class Requirement | ✅ Pass | 서명 검증만 수행하는 stateless cookie로 per-request overhead 최소화 |
| V. Small, Verifiable, and Reversible Delivery | ✅ Pass | Admin 영역만 영향, 공개 기능 회귀 여부를 별도 검증 가능 |
