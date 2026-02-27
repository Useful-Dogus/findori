# Quickstart: DB 스키마 마이그레이션 구축

**Feature**: 004-db-schema-migration

## 전제 조건

- Supabase CLI 설치: `npm i -g supabase` (또는 `brew install supabase/tap/supabase`)
- 환경변수 설정 완료 (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`) — #3 완료 전제
- Supabase 프로젝트 ID: `<SUPABASE_PROJECT_ID>`

## 로컬 설정 (최초 1회)

```bash
# 1. Supabase CLI 로컬 초기화
supabase init

# 2. 원격 프로젝트와 연결 (로그인 필요)
supabase login
supabase link --project-ref <SUPABASE_PROJECT_ID>
```

## 마이그레이션 적용

```bash
# 3. SQL 마이그레이션 파일 원격 DB에 적용
supabase db push

# 4. TypeScript 타입 재생성
npm run db:types

# 5. 빌드 검증
npm run validate
```

## 검증

```bash
# Supabase 대시보드 Table Editor에서 5개 테이블 확인
# 또는 SQL 에디터에서:
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
# 기대 결과: feeds, issue_tags, issues, media_sources, tags
```

## 주의사항

- `supabase db push`는 멱등 — 이미 적용된 마이그레이션은 재실행하지 않음
- `npm run db:types` 실행 시 Supabase 로그인 세션 필요 (CI에서는 `SUPABASE_ACCESS_TOKEN` 환경변수)
- `display_order` 컬럼: SRS의 `order` 필드명을 PostgreSQL 예약어 충돌 방지를 위해 변경
