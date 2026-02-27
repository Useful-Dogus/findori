# Quickstart: 환경변수/시크릿 체계 구축

**Feature**: 003-env-secrets
**Date**: 2026-02-27

---

## 개발 환경 설정 (5분)

```bash
# 1. 저장소 루트에서 예시 파일 복사
cp .env.example .env.local

# 2. .env.local을 열어 각 값 입력
#    (아래 "변수별 발급 방법" 참조)

# 3. 개발 서버 기동 — 환경변수 누락 시 오류 출력 후 종료
npm run dev
```

---

## 변수별 발급 방법

### Supabase
1. [Supabase Dashboard](https://supabase.com/dashboard) > 프로젝트 선택
2. Settings > API
3. **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
4. **anon / public** 키 → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. **service_role** 키 → `SUPABASE_SERVICE_ROLE_KEY` (절대 클라이언트에 노출 금지)

### Admin 인증
```bash
# ADMIN_PASSWORD: 임의 문자열 (최소 16자)
openssl rand -hex 10   # 20자 hex 문자열 생성

# ADMIN_SESSION_SECRET: 세션 서명 키 (최소 32자 필수)
openssl rand -hex 32   # 64자 hex 문자열 생성
```

### Anthropic
1. [Anthropic Console](https://console.anthropic.com/) > API Keys
2. Create Key → `ANTHROPIC_API_KEY`

### Cron 보안
```bash
# CRON_SECRET: 임의 문자열 (최소 16자)
openssl rand -hex 16   # 32자 hex 문자열 생성
```
- Vercel Cron 설정 시 동일한 값을 Vercel 환경변수에도 등록한다.

---

## Vercel 배포 시 (운영자)

1. Vercel Dashboard > 프로젝트 > Settings > Environment Variables
2. **Production** 범위에 아래 7개 변수를 모두 등록:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `ADMIN_PASSWORD`
   - `ADMIN_SESSION_SECRET`
   - `ANTHROPIC_API_KEY`
   - `CRON_SECRET`
3. 변경 후 재배포 필요 (`NEXT_PUBLIC_` 변수는 빌드 시 인라인되므로).

---

## 검증 확인

```bash
# 빌드 시 환경변수 검증 실행됨 (누락 시 빌드 실패)
npm run build

# 또는 개발 서버에서도 동일하게 실행
npm run dev
```

예상 오류 출력 (누락 시):
```
❌ 환경변수 검증 실패:
   - ADMIN_SESSION_SECRET: 값이 없거나 32자 미만입니다.
   - ANTHROPIC_API_KEY: 'sk-ant-'로 시작해야 합니다.
```
