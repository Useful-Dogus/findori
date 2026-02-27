# 환경변수 설정 가이드

findori 운영에 필요한 7개 환경변수 설정 방법을 안내합니다.

---

## 로컬 개발 환경 (5분 설정)

```bash
# 1. 예시 파일 복사
cp .env.example .env.local

# 2. .env.local을 열어 아래 "변수별 발급 방법" 참조하여 값 입력

# 3. 개발 서버 기동 — 환경변수 누락 시 오류 출력 후 종료됨
npm run dev
```

---

## Vercel Production 배포

**경로**: Vercel Dashboard → 프로젝트 선택 → Settings → Environment Variables

아래 **7개 변수를 모두 Production 범위**에 등록합니다.

| 변수명 | Production 필수 | 범위 |
|--------|-----------------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ 필수 | 클라이언트+서버 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ 필수 | 클라이언트+서버 |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ 필수 | 서버 전용 |
| `ADMIN_PASSWORD` | ✅ 필수 | 서버 전용 |
| `ADMIN_SESSION_SECRET` | ✅ 필수 | 서버 전용 |
| `ANTHROPIC_API_KEY` | ✅ 필수 | 서버 전용 |
| `CRON_SECRET` | ✅ 필수 | 서버 전용 |

> ⚠️ **주의**: `NEXT_PUBLIC_` 접두사 변수는 **빌드 시 JS 번들에 인라인**됩니다.
> 값을 변경하면 Vercel에서 **재배포**가 필요합니다.

---

## 변수별 발급 방법

### Supabase 변수 (3개)

1. [Supabase Dashboard](https://supabase.com/dashboard) → 프로젝트 선택
2. Settings → API

| 변수명 | Dashboard 위치 |
|--------|----------------|
| `NEXT_PUBLIC_SUPABASE_URL` | **Project URL** |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | **Project API keys → anon / public** |
| `SUPABASE_SERVICE_ROLE_KEY` | **Project API keys → service_role** ⚠️ 절대 클라이언트 노출 금지 |

### Admin 인증 변수 (2개)

직접 생성합니다. 터미널에서 실행:

```bash
# ADMIN_PASSWORD (최소 16자)
openssl rand -hex 10    # → 20자 hex 문자열

# ADMIN_SESSION_SECRET (최소 32자 필수)
openssl rand -hex 32    # → 64자 hex 문자열
```

### Anthropic API 키

1. [Anthropic Console](https://console.anthropic.com/settings/keys) → API Keys
2. **Create Key** → 생성된 `sk-ant-...` 키 복사

### Cron 보안 토큰

```bash
# CRON_SECRET (최소 16자)
openssl rand -hex 16    # → 32자 hex 문자열
```

Vercel Cron이 파이프라인 엔드포인트를 호출할 때 `Authorization: Bearer <CRON_SECRET>` 헤더를 사용합니다.

---

## 보안 정책 요약

- 모든 시크릿은 코드베이스에 **하드코딩 금지** (Vercel 환경변수로만 관리)
- `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET`, `ANTHROPIC_API_KEY`, `CRON_SECRET`은 **서버 전용** — `NEXT_PUBLIC_` 접두사 절대 불가
- `.env.local`은 `.gitignore`에 포함되어 git 추적 제외됨 (`git check-ignore -v .env.local`로 확인)
- `.env.example`은 플레이스홀더만 포함하며 git에 추적됨 (실제 값 절대 포함 금지)
