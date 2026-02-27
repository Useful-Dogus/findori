# Data Model: 환경변수/시크릿 체계 구축

**Feature**: 003-env-secrets
**Date**: 2026-02-27

이 기능은 DB 스키마 변경 없이 파일 시스템과 환경변수 설정 체계를 다룬다.
데이터 모델은 환경변수 분류 체계를 정의한다.

---

## 환경변수 분류

### 그룹 1: Supabase (DB 접근)

| 변수명 | 노출 범위 | 형식 | 최솟값 | 발급처 |
|--------|-----------|------|--------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | 클라이언트+서버 | URL (`https://`) | — | Supabase Dashboard > Settings > API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 클라이언트+서버 | JWT 문자열 | 20자 | Supabase Dashboard > Settings > API |
| `SUPABASE_SERVICE_ROLE_KEY` | 서버 전용 | JWT 문자열 | 20자 | Supabase Dashboard > Settings > API |

### 그룹 2: Admin 인증

| 변수명 | 노출 범위 | 형식 | 최솟값 | 발급처 |
|--------|-----------|------|--------|--------|
| `ADMIN_PASSWORD` | 서버 전용 | 임의 문자열 | 16자 | 직접 생성 |
| `ADMIN_SESSION_SECRET` | 서버 전용 | 임의 문자열 | 32자 | 직접 생성 (`openssl rand -hex 32`) |

### 그룹 3: Anthropic (AI)

| 변수명 | 노출 범위 | 형식 | 최솟값 | 발급처 |
|--------|-----------|------|--------|--------|
| `ANTHROPIC_API_KEY` | 서버 전용 | `sk-ant-...` | — | Anthropic Console > API Keys |

### 그룹 4: Cron 보안

| 변수명 | 노출 범위 | 형식 | 최솟값 | 발급처 |
|--------|-----------|------|--------|--------|
| `CRON_SECRET` | 서버 전용 | 임의 문자열 | 16자 | 직접 생성 (`openssl rand -hex 16`) |

---

## 검증 규칙

```
EnvironmentSchema:
  NEXT_PUBLIC_SUPABASE_URL  : URL 형식 필수
  NEXT_PUBLIC_SUPABASE_ANON_KEY : string, minLength=20
  SUPABASE_SERVICE_ROLE_KEY : string, minLength=20
  ADMIN_PASSWORD            : string, minLength=16
  ADMIN_SESSION_SECRET      : string, minLength=32
  ANTHROPIC_API_KEY         : string, startsWith("sk-ant-")
  CRON_SECRET               : string, minLength=16
```

---

## 파일 구조 (생성/변경 대상)

```
.env.example              ← 업데이트 (누락 변수 추가, 주석 보강)
src/
└── lib/
    └── env.ts            ← 신규 (Zod 스키마 + 검증 함수 + 타입 export)
next.config.ts            ← 수정 (validateEnv() 호출 추가)
docs/
└── env-setup.md          ← 신규 (운영자용 Vercel 설정 가이드)
```

---

## 상태 전이 (검증 흐름)

```
next build / next dev 실행
  → next.config.ts에서 validateEnv() 호출
  → EnvironmentSchema.parse(process.env)
  → 성공: 빌드 계속
  → 실패: 누락/불량 변수명 목록 출력 후 process.exit(1)
```
