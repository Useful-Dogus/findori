# Research: 환경변수/시크릿 체계 구축

**Feature**: 003-env-secrets
**Date**: 2026-02-27

---

## Decision 1: 환경변수 검증 방식

**Decision**: Zod 스키마를 `src/lib/env.ts`에 정의하고, `next.config.ts`에서 빌드 시 호출

**Rationale**:
- `next.config.ts`에서 호출 시 `next build` 단계에 검증이 실행되어 배포 전에 오류를 잡는다.
- Zod는 TypeScript strict 프로젝트에서 관용적으로 사용하며, 타입 추론과 IDE 자동완성이 제공된다.
- `instrumentation.ts` 방식은 Next.js 15에서 `next build` 중 실행되지 않아 신뢰성 문제가 있다.

**Alternatives considered**:
- `@t3-oss/env-nextjs`: 더 강력하나 외부 패키지 추가 필요. 이 프로젝트 규모에서는 Zod 직접 사용이 충분하다.
- Custom function (Zod 없음): 타입 안전성 없음. 이미 TypeScript strict 프로젝트이므로 적절하지 않다.
- `instrumentation.ts`: `next build`에서 실행되지 않고 `next start` 중 실패해도 서버가 기동되는 문제가 있다.

---

## Decision 2: 신규 의존성

**Decision**: `zod` 패키지 추가

**Rationale**:
- 현재 프로젝트에 Zod가 없으며, 환경변수 검증을 위해 최소한의 라이브러리를 추가한다.
- Zod는 향후 API 입력 검증(#11 Cron 엔드포인트, #13 Claude output 등)에도 재사용 가능하다.
- 번들 크기: 서버 전용 검증 코드이므로 클라이언트 번들에 포함되지 않는다.

**Alternatives considered**:
- Zod 없이 커스텀 함수: 간단하지만 타입 추론 불가, strict 프로젝트 방침에 맞지 않음.

---

## Decision 3: 환경변수 목록 (최종 확정)

현재 코드베이스에서 참조되는 변수 (grep 기반):

| 변수명 | 참조 위치 | 노출 범위 | 현재 .env.example |
|--------|-----------|-----------|-------------------|
| `NEXT_PUBLIC_SUPABASE_URL` | `client.ts`, `server.ts`, `admin.ts`, `middleware.ts` | 클라이언트+서버 | ✅ 있음 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `client.ts`, `server.ts`, `admin.ts`, `middleware.ts` | 클라이언트+서버 | ✅ 있음 |
| `SUPABASE_SERVICE_ROLE_KEY` | `admin.ts` | 서버 전용 | ✅ 있음 |
| `ADMIN_PASSWORD` | `api/admin/auth/login/route.ts` | 서버 전용 | ✅ 있음 |
| `CRON_SECRET` | `api/cron/pipeline/route.ts` | 서버 전용 | ✅ 있음 |

SRS에 명시되어 있으나 아직 코드 미참조 (선행 등록 필요):

| 변수명 | 예정 사용 이슈 | 노출 범위 | 현재 .env.example |
|--------|----------------|-----------|-------------------|
| `ADMIN_SESSION_SECRET` | #6 Admin 인증 | 서버 전용 | ❌ 없음 |
| `ANTHROPIC_API_KEY` | #13 Claude structured output | 서버 전용 | ❌ 없음 |

**Rationale**: 향후 이슈에서 변수를 사용할 때 `.env.example`과 검증 스키마가 이미 준비되어 있어야 개발자가 누락 없이 설정할 수 있다.

---

## Decision 4: 파일 배치

**Decision**:

```
src/lib/env.ts          ← Zod 스키마 + 검증 함수 + 타입 export
next.config.ts          ← validateEnv() 호출 추가 (빌드 시 실행)
.env.example            ← 업데이트 (누락 변수 2개 추가, 생성 명령 보강)
docs/env-setup.md       ← 운영자용 Vercel 설정 가이드
```

**Rationale**:
- `src/lib/env.ts`는 기존 `src/lib/supabase/` 패턴과 일관성 있는 위치다.
- `docs/env-setup.md`는 운영자가 Vercel 대시보드에서 참조하는 별도 문서로 분리한다 (README에 포함 시 너무 길어짐).

---

## Decision 5: NEXT_PUBLIC_ 변수 보안 정책

**Decision**: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`만 클라이언트 노출 허용. 나머지 모두 서버 전용.

**Rationale**:
- `NEXT_PUBLIC_` 변수는 빌드 시 JS 번들에 인라인된다 (변경 불가, 브라우저에서 노출).
- Supabase anon key는 Row Level Security(RLS)로 보호되므로 클라이언트 노출이 설계상 허용된다.
- `SUPABASE_SERVICE_ROLE_KEY`는 RLS를 우회하므로 절대 `NEXT_PUBLIC_` 접두사 불가.
- Admin, Cron 관련 시크릿은 서버 전용 처리 필수.

---

## Decision 6: 검증 스키마 세부 규칙

| 변수명 | Zod 규칙 | 최소 길이 기준 |
|--------|----------|---------------|
| `NEXT_PUBLIC_SUPABASE_URL` | `z.string().url()` | URL 형식 필수 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `z.string().min(20)` | JWT 형식 |
| `SUPABASE_SERVICE_ROLE_KEY` | `z.string().min(20)` | JWT 형식 |
| `ADMIN_PASSWORD` | `z.string().min(16)` | SRS: 16자 이상 권장 |
| `ADMIN_SESSION_SECRET` | `z.string().min(32)` | 세션 서명 키: 32자 이상 필수 |
| `CRON_SECRET` | `z.string().min(16)` | SRS: 16자 이상 권장 |
| `ANTHROPIC_API_KEY` | `z.string().startsWith('sk-ant-')` | Anthropic 키 형식 |
