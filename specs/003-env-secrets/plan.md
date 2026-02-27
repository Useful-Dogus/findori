# Implementation Plan: 환경변수/시크릿 체계 구축

**Branch**: `003-env-secrets` | **Date**: 2026-02-27 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/003-env-secrets/spec.md`

## Summary

MVP 운영에 필요한 7개 환경변수(Supabase 3개, Admin 2개, Anthropic 1개, Cron 1개)를
Zod 기반으로 빌드 시 검증하고, `.env.example` 및 운영자 설정 가이드를 제공한다.
신규 의존성: `zod` 패키지 추가.

## Technical Context

**Language/Version**: TypeScript 5.4+, Node.js 20+
**Primary Dependencies**: Next.js 15 (App Router, Turbopack), Zod (신규 추가)
**Storage**: N/A (환경변수는 파일 시스템 및 Vercel 대시보드에서 관리)
**Testing**: Vitest (기존 설정)
**Target Platform**: Vercel (Production), macOS/Linux (로컬 개발)
**Project Type**: Web application (Next.js)
**Performance Goals**: 빌드 시 1회 실행 — 퍼포먼스 영향 없음
**Constraints**: Zod 외 추가 패키지 없음, `next.config.ts` 수정 최소화
**Scale/Scope**: 변수 7개, 파일 4개 변경/생성

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Gate | Status | Notes |
|------|--------|-------|
| I. Code Quality | ✅ Pass | Zod 스키마로 명시적 계약 정의, `env.ts` 단일 책임 |
| II. Tests Define Correctness | ✅ Pass | 검증 함수 unit test 포함 예정 |
| III. UX Consistency | ✅ N/A | 사용자 UI 변경 없음 |
| IV. Performance | ✅ Pass | 빌드 시 1회 실행, 런타임 영향 없음 |
| V. Small & Reversible | ✅ Pass | 4개 파일 변경, 즉시 롤백 가능 |

**Complexity Tracking**: 위반 없음.

## Project Structure

### Documentation (this feature)

```text
specs/003-env-secrets/
├── plan.md          ← This file
├── research.md      ← Phase 0 output
├── data-model.md    ← Phase 1 output
├── quickstart.md    ← Phase 1 output
└── tasks.md         ← Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
.env.example                  ← 업데이트 (7개 변수, 생성 명령 포함)
src/
└── lib/
    └── env.ts                ← 신규 (Zod 스키마 + validateEnv + 타입)
next.config.ts                ← 수정 (validateEnv() 호출 추가)
docs/
└── env-setup.md              ← 신규 (운영자용 Vercel 설정 가이드)
tests/
└── unit/
    └── lib/
        └── env.test.ts       ← 신규 (validateEnv 단위 테스트)
```

**Structure Decision**: 기존 `src/lib/` 패턴(supabase 모듈)과 일치하는 위치에 `env.ts` 배치.
docs 디렉터리는 기존 `docs/mvp/` 패턴과 동일 계층에 추가.

## Implementation Steps

### Step 1: 의존성 추가

- `zod` 패키지를 프로젝트 의존성에 추가
- 버전: latest stable (5.x 이상)

### Step 2: `.env.example` 업데이트

기존 5개 변수에 누락된 2개 추가 및 주석 보강:

```
# ── Supabase (DB 접근) ───────────────────────────────────────────
# Supabase Dashboard > Settings > API 에서 확인
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# 서버 전용 (절대 NEXT_PUBLIC_ 붙이지 말 것, RLS 우회)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# ── Admin 인증 ────────────────────────────────────────────────────
# 최소 16자 이상 권장
# 생성: openssl rand -hex 10
ADMIN_PASSWORD=your-admin-password-min-16-chars

# 세션 쿠키 서명 키 (최소 32자 필수)
# 생성: openssl rand -hex 32
ADMIN_SESSION_SECRET=your-session-secret-min-32-chars

# ── Anthropic (AI) ────────────────────────────────────────────────
# Anthropic Console > API Keys 에서 발급
ANTHROPIC_API_KEY=sk-ant-your-key-here

# ── Cron 보안 ─────────────────────────────────────────────────────
# Vercel이 Authorization: Bearer <값> 헤더로 전송
# 생성: openssl rand -hex 16
CRON_SECRET=your-random-cron-secret-min-16-chars
```

### Step 3: `src/lib/env.ts` 생성

- Zod 스키마로 서버 전용 변수 + 클라이언트 공개 변수를 분리 정의
- `validateEnv()` 함수: Zod parse 실패 시 누락 변수 목록을 명시하고 `process.exit(1)`
- 검증된 env 객체 export (사용처에서 `process.env.VAR` 대신 `env.VAR` 사용 권장)
- 서버 전용 변수 접근 시 빌드 중 클라이언트 번들에 포함되지 않도록 주의

### Step 4: `next.config.ts` 수정

- `validateEnv()` import 후 config 정의 전에 호출
- `next build` 및 `next dev` 실행 시 자동으로 검증 실행됨

### Step 5: `docs/env-setup.md` 생성

- 운영자용 Vercel 설정 가이드 (quickstart.md를 기반으로 확장)
- 각 변수별 발급처 URL 포함
- `NEXT_PUBLIC_` 변수가 빌드 시 고정된다는 주의사항 포함

### Step 6: `tests/unit/lib/env.test.ts` 작성

- `validateEnv()` 함수 단위 테스트
- 시나리오:
  1. 모든 변수 정상 → 오류 없이 통과
  2. 필수 변수 누락 → 에러 throw (또는 process.exit 호출)
  3. 형식 불일치 (URL 오류, 길이 미달) → 에러 throw
  4. `ANTHROPIC_API_KEY`가 `sk-ant-` 미시작 → 에러 throw

## Contracts

해당 기능은 외부 API를 노출하지 않으므로 별도 contracts 파일 불필요.
`src/lib/env.ts`의 export 타입이 내부 계약 역할을 한다.

## Constitution Re-check (Post Design)

| Gate | Status | Notes |
|------|--------|-------|
| I. Code Quality | ✅ Pass | 단일 파일, 명확한 스키마, 중복 없음 |
| II. Tests | ✅ Pass | 4가지 시나리오 단위 테스트 계획 |
| III. UX | ✅ N/A | — |
| IV. Performance | ✅ Pass | 빌드 시 1회 실행만 |
| V. Reversible | ✅ Pass | `env.ts` 삭제 + `next.config.ts` 원복으로 즉시 롤백 |
