# Quickstart: 프로젝트 기술 베이스라인 셋업

**Branch**: `002-tech-baseline-setup` | **Date**: 2026-02-27

이 가이드는 베이스라인 셋업 완료 후 로컬 개발 환경 구동 절차를 문서화한다.

---

## 전제 조건

- Node.js 20+ 설치
- Supabase 프로젝트 생성 (supabase.com)
- Vercel 계정 + 프로젝트 연결 (vercel.com)
- Supabase CLI 설치: `npm install -g supabase`

---

## 1. 의존성 설치

```bash
npm install
```

---

## 2. 환경 변수 설정

`.env.example`을 복사하고 값을 채운다:

```bash
cp .env.example .env.local
```

```bash
# .env.local

# Supabase (Supabase 대시보드 → Settings → API에서 확인)
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# 서버 전용 (절대 NEXT_PUBLIC_ 붙이지 말 것)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Admin 인증
ADMIN_PASSWORD=your-admin-password-min-16-chars

# Cron 보안 (랜덤 문자열, 최소 16자)
CRON_SECRET=your-random-cron-secret
```

Vercel을 사용 중이라면 CLI로 가져오는 방법도 있다:

```bash
vercel env pull .env.local
```

---

## 3. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 `http://localhost:3000` 열기.

---

## 4. DB 타입 생성

Supabase 스키마로부터 TypeScript 타입을 생성한다. DB 스키마 변경 후 재실행 필요.

```bash
supabase login
npm run db:types
```

---

## 5. 코드 품질 검사 (전체)

```bash
npm run validate
```

이 명령은 `type-check + lint + format:check`을 순차 실행한다. PR 전 반드시 통과 확인.

---

## 6. 테스트 실행

```bash
# 단일 실행 (CI용)
npm run test

# 감시 모드 (개발 중)
npm run test:watch
```

---

## 7. 프로덕션 빌드 확인

```bash
npm run build
npm run start
```

---

## 8. Cron 로컬 테스트

Vercel Cron은 로컬에서 자동 실행되지 않는다. 직접 호출로 테스트:

```bash
curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/pipeline
```

---

## 주요 npm 스크립트 요약

| 스크립트 | 설명 |
|----------|------|
| `npm run dev` | Turbopack 개발 서버 실행 |
| `npm run build` | 프로덕션 빌드 |
| `npm run start` | 프로덕션 서버 실행 |
| `npm run lint` | ESLint 검사 |
| `npm run lint:fix` | ESLint 자동 수정 |
| `npm run format` | Prettier 자동 포맷 |
| `npm run format:check` | Prettier 포맷 검사 |
| `npm run type-check` | TypeScript 타입 검사 |
| `npm run validate` | type-check + lint + format:check |
| `npm run test` | Vitest 단일 실행 (CI용) |
| `npm run test:watch` | Vitest 감시 모드 |
| `npm run db:types` | Supabase DB 타입 재생성 |

---

## 트러블슈팅

**`cookies()` 관련 타입 오류**
- Next.js 15에서 `cookies()`는 async. `await cookies()`로 변경.

**Tailwind 클래스가 적용 안 됨**
- `globals.css`에 `@import "tailwindcss"` 확인 (구 `@tailwind` 지시어 금지).
- `postcss.config.mjs`의 플러그인 키가 `"@tailwindcss/postcss"`인지 확인.

**Supabase 연결 오류**
- `.env.local`의 URL과 키 값을 확인.
- Supabase 프로젝트가 일시 정지 상태인지 확인 (Supabase 대시보드).

**빌드 타입 오류**
- `npm run type-check`로 구체적인 오류 위치 확인.
- `supabase gen types typescript` 재실행 후 타입이 최신인지 확인.
