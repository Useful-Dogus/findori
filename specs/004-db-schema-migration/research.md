# Research: DB 스키마 마이그레이션 구축

**Feature**: 004-db-schema-migration
**Date**: 2026-02-27

---

## 1. Migration Management Approach

**Decision**: Supabase CLI 로컬 마이그레이션 (`supabase init` + SQL 파일 + `supabase db push`)

**Rationale**:
- `package.json`의 `db:types` 스크립트가 Supabase CLI를 이미 사용 중 (`supabase gen types typescript --project-id cwpfvqhgjtrzogwqepxp`)
- 로컬 `supabase/migrations/` 디렉토리 방식은 git으로 스키마 이력 관리 가능 → Constitution V (Small, Verifiable, Reversible Delivery) 준수
- `supabase db push`로 원격 DB에 멱등 적용 가능 (`IF NOT EXISTS` + `IF NOT EXISTS` 패턴)
- 현재 `supabase/` 디렉토리 없음 → `supabase init`으로 초기화 필요

**Alternatives considered**:
- Supabase 대시보드 SQL 에디터 직접 실행 → 재현 불가, git 이력 없음, 거부
- Prisma migrate → 추가 의존성, Supabase 네이티브 타입과 충돌 가능, 거부

---

## 2. Primary Key & UUID Strategy

**Decision**: `gen_random_uuid()` (PostgreSQL 내장 함수, pgcrypto 불필요)

**Rationale**:
- Supabase PostgreSQL 14+에서 `gen_random_uuid()`는 `pgcrypto` 확장 없이 내장 지원
- `uuid_generate_v4()`는 `uuid-ossp` 확장 필요 → 불필요한 확장 의존 회피

---

## 3. Index Strategy

**Decision**: 다음 컬럼에 인덱스 추가

| 테이블 | 컬럼 | 이유 |
|--------|------|------|
| `feeds` | `date` | UNIQUE 제약 → 자동 인덱스, 날짜별 단건 조회 |
| `feeds` | `status` | 공개 피드 API: `WHERE status = 'published'` 필터 |
| `issues` | `feed_id` | FK 조인 — Admin/공개 피드 전체 이슈 목록 조회 |
| `issues` | `status` | Admin UI: `WHERE status = 'draft'` 검토 목록 |
| `issues` | `order` | 피드 내 순서 정렬 `ORDER BY order` |
| `issue_tags` | `(issue_id, tag_id)` | PK로 설정 → 자동 유니크 인덱스, 중복 연결 방지 |
| `issue_tags` | `tag_id` | 태그별 이슈 조회 역방향 |

**Rationale**: Constitution IV (Performance First-Class) — 향후 피드 API와 Admin UI의 주요 쿼리 패턴을 반영한 최소 인덱스 세트

---

## 4. `issue_tags` Primary Key 설계

**Decision**: `(issue_id, tag_id)` 복합 PK

**Rationale**:
- 별도 UUID PK 불필요 — 조인 테이블의 자연 키가 충분히 유일
- 복합 PK = 중복 연결 자동 방지 + 인덱스 포함

---

## 5. `issues.order` 컬럼명 충돌

**Decision**: `display_order`로 명명

**Rationale**:
- PostgreSQL에서 `order`는 예약어 → 쿼리 시 항상 큰따옴표 필요
- `display_order`로 변경하면 예약어 충돌 없음
- SRS의 의도("피드 내 노출 순서")를 더 명확히 표현

---

## 6. RLS (Row Level Security)

**Decision**: MVP에서 RLS 비활성화, 별도 이슈(#6)에서 처리

**Rationale**:
- Admin 인증 이슈(#6)에서 RLS 정책 설계 예정
- 서비스 롤 키(`SUPABASE_SERVICE_ROLE_KEY`)로만 쓰기 접근 → 당장은 RLS 없이 안전
- 미리 빈 RLS 정책을 달면 #6 구현 시 충돌 가능 → 이 이슈에서는 테이블 생성에만 집중

---

## 7. `media_sources.rss_url` UNIQUE 제약

**Decision**: `rss_url`에 UNIQUE 제약 추가

**Rationale**:
- 같은 RSS URL을 중복 등록하면 파이프라인이 동일 매체를 두 번 수집
- SRS에 명시는 없지만 운영 데이터 무결성 관점에서 필수

---

## 8. TypeScript 타입 재생성

**Decision**: 마이그레이션 적용 후 `npm run db:types` 실행 → `src/types/database.types.ts` 갱신

**Rationale**:
- 현재 `database.types.ts`는 빈 스캐폴드 (테이블 없음)
- `supabase gen types typescript --project-id cwpfvqhgjtrzogwqepxp`가 원격 스키마를 읽어 TypeScript 타입 자동 생성
- `npm run validate` (type-check + lint)로 타입 정합성 검증
