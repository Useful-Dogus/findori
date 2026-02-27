# Tasks: DB 스키마 마이그레이션 구축

**Input**: Design documents from `/specs/004-db-schema-migration/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, quickstart.md ✅

**Organization**: 마이그레이션 SQL을 유저 스토리 단위로 작성 → 1회 적용 → 타입 재생성 → 검증

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 병렬 실행 가능 (다른 파일, 의존성 없음)
- **[Story]**: 연관 유저 스토리 (US1~US4)
- 모든 SQL은 단일 마이그레이션 파일에 작성됨 — 파일 내 블록 작성은 순차 진행

---

## Phase 1: Setup (Supabase CLI 초기화)

**Purpose**: Supabase CLI 로컬 환경 설정. 원격 프로젝트 연결.

- [x] T001 Run `supabase init` in repo root to create `supabase/config.toml`
- [x] T002 Run `supabase link --project-ref <SUPABASE_PROJECT_ID>` to link remote project

**Checkpoint**: `supabase/config.toml` 생성 확인, 원격 연결 성공

---

## Phase 2: Foundational (마이그레이션 파일 생성)

**Purpose**: 5개 테이블 DDL을 담을 마이그레이션 파일 뼈대 생성. 모든 유저 스토리 작업이 이 파일에 블록 단위로 추가된다.

**⚠️ CRITICAL**: 이 파일 없이 어떤 테이블 DDL도 작성 불가

- [x] T003 Create `supabase/migrations/20260227000000_initial_schema.sql` with file-level comment block (feature, date, table list, notes on `display_order` naming)

**Checkpoint**: 파일 존재 확인 — 이후 모든 DDL 블록이 이 파일에 순차 추가됨

---

## Phase 3: User Story 1 — 파이프라인이 데이터를 저장할 수 있다 (Priority: P1) 🎯 MVP

**Goal**: `feeds`와 `issues` 테이블 생성. 파이프라인이 일별 피드와 이슈 카드 초안을 DB에 저장할 수 있는 기반 마련.

**Independent Test**: 마이그레이션 적용 후 Supabase SQL 에디터에서 `feeds`와 `issues`에 샘플 행 삽입·조회 성공, 동일 날짜 중복 삽입 시 UNIQUE 오류 확인.

### Implementation for User Story 1

- [x] T004 [US1] Write `feeds` table DDL block in `supabase/migrations/20260227000000_initial_schema.sql` — id (uuid PK), date (date UNIQUE NOT NULL), status CHECK('draft','published') DEFAULT 'draft', published_at (timestamptz nullable), created_at, idx_feeds_status index
- [x] T005 [US1] Write `issues` table DDL block in `supabase/migrations/20260227000000_initial_schema.sql` — id (uuid PK), feed_id FK→feeds CASCADE DELETE, channel DEFAULT 'v1', entity_type CHECK('stock','index','fx','theme'), entity_id, entity_name, title, change_value (nullable), status CHECK('draft','approved','rejected') DEFAULT 'draft', display_order int DEFAULT 0, cards_data jsonb DEFAULT '[]', created_at, indexes (feed_id, status, feed_id+display_order)

**Checkpoint**: T004-T005 완료 후 이 단계만으로 파이프라인 저장 기능 검증 가능

---

## Phase 4: User Story 2 — 운영자가 이슈를 검토하고 상태를 변경할 수 있다 (Priority: P2)

**Goal**: feeds/issues 테이블의 status CHECK 제약명이 명시적으로 지정되어 있고, 상태 전환 규칙이 data-model.md와 일치함을 확인·보완.

**Independent Test**: migration SQL에서 CHECK 제약명(`feeds_status_check`, `issues_status_check`, `issues_entity_type_check`) 확인. 적용 후 유효하지 않은 status 삽입 시 오류 발생.

### Implementation for User Story 2

- [x] T006 [US2] Verify and update named CHECK constraints in `supabase/migrations/20260227000000_initial_schema.sql` — confirm `CONSTRAINT feeds_status_check`, `CONSTRAINT issues_status_check`, `CONSTRAINT issues_entity_type_check` are present with correct value sets matching data-model.md state transition table

**Checkpoint**: SQL 리뷰 완료 — 이 시점에서 status 관리 요구사항(FR-003, FR-011) 충족 확인

---

## Phase 5: User Story 3 — 이슈에 태그를 붙이고 조회할 수 있다 (Priority: P3)

**Goal**: `tags`와 `issue_tags` 테이블 생성. 이슈-태그 다대다 관계와 CASCADE DELETE 동작.

**Independent Test**: 적용 후 태그 삽입 → issue_tags 연결 → 태그별 이슈 조회 JOIN 쿼리 성공. 이슈 삭제 시 issue_tags 행 자동 삭제 확인.

### Implementation for User Story 3

- [x] T007 [US3] Write `tags` table DDL block in `supabase/migrations/20260227000000_initial_schema.sql` — id (uuid PK), name (text UNIQUE NOT NULL), created_by CHECK('ai','operator') with `CONSTRAINT tags_created_by_check`, created_at
- [x] T008 [US3] Write `issue_tags` table DDL block in `supabase/migrations/20260227000000_initial_schema.sql` — issue_id FK→issues CASCADE DELETE, tag_id FK→tags CASCADE DELETE, PRIMARY KEY (issue_id, tag_id), idx_issue_tags_tag_id index

**Checkpoint**: T007-T008 완료 후 태그 시스템 독립 검증 가능

---

## Phase 6: User Story 4 — 화이트리스트 매체를 등록하고 관리할 수 있다 (Priority: P4)

**Goal**: `media_sources` 테이블 생성. 파이프라인이 active=true 매체만 필터링하여 수집할 수 있는 기반.

**Independent Test**: 적용 후 매체 삽입 → active=false 업데이트 → `WHERE active = true` 필터 쿼리 결과 확인.

### Implementation for User Story 4

- [x] T009 [US4] Write `media_sources` table DDL block in `supabase/migrations/20260227000000_initial_schema.sql` — id (uuid PK), name (text NOT NULL), rss_url (text UNIQUE NOT NULL), active (boolean NOT NULL DEFAULT true), created_at

**Checkpoint**: T009 완료 후 media_sources 독립 검증 가능. 이 시점에서 SQL 파일에 5개 테이블 DDL 모두 작성 완료

---

## Phase 7: Polish & 품질 게이트

**Purpose**: 마이그레이션 1회 적용 → TypeScript 타입 재생성 → 빌드 검증

- [x] T010 Run `supabase db push` to apply migration to remote Supabase project and confirm zero errors
- [x] T011 Verify 5 tables exist by running `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name` in Supabase SQL editor (expected: feeds, issue_tags, issues, media_sources, tags)
- [x] T012 Run `npm run db:types` to regenerate `src/types/database.types.ts` from live schema
- [x] T013 Confirm `src/types/database.types.ts` contains `Tables` entries for all 5 tables (feeds, issues, tags, issue_tags, media_sources)
- [x] T014 [P] Run `npm run validate` (type-check + lint + format:check) and confirm zero errors
- [x] T015 [P] Run `npm run test` and confirm all tests pass

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: 즉시 시작 가능
- **Foundational (Phase 2)**: Phase 1 완료 후 — **모든 DDL 작업 블로킹**
- **US1 Phase 3**: Phase 2 완료 후 — `feeds`, `issues` 테이블 작성
- **US2 Phase 4**: Phase 3 완료 후 — status CHECK 검증/보완
- **US3 Phase 5**: Phase 2 완료 후 독립 시작 가능 (`tags`, `issue_tags`는 feeds/issues와 파일 공유하지만 SQL 블록은 독립)
- **US4 Phase 6**: Phase 2 완료 후 독립 시작 가능
- **Polish (Phase 7)**: T010은 모든 DDL(T004~T009) 완료 후, T014/T015는 T013 완료 후 병렬 가능

### User Story Dependencies

- **US1 (P1)**: Phase 2 완료 후 시작 — 다른 스토리에 미의존
- **US2 (P2)**: US1 완료 후 (issues/feeds DDL 기반) — 단일 검토 태스크
- **US3 (P3)**: Phase 2 완료 후 독립 시작 가능 — feeds/issues와 무관한 테이블
- **US4 (P4)**: Phase 2 완료 후 독립 시작 가능 — 다른 테이블과 FK 없음

### Within Each User Story

- 파일 내 DDL 블록은 순차 작성 (같은 파일 편집)
- T010 (`supabase db push`): T004~T009 모두 완료 후 1회 실행
- T014, T015: T013 완료 후 병렬 실행 가능

---

## Parallel Opportunities

```bash
# Phase 1: 순차 실행 (T002는 T001 supabase init 이후)
T001 → T002

# Phase 3~6: US3, US4 DDL 작성은 US1 작성과 동시 진행 가능
# (단, 같은 파일 편집 → 실제로는 순차 권장)
T004, T005  →  T007, T008 (US3, US1 완료 후)
              T009       (US4, 독립)

# Polish: T014, T015 병렬 실행
T013 → T014 [P]
     → T015 [P]
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1: Setup (T001~T002)
2. Phase 2: Foundational (T003)
3. Phase 3: US1 — feeds + issues 테이블 (T004~T005)
4. T010: `supabase db push`
5. T012~T014: 타입 재생성 + 검증
6. **STOP and VALIDATE**: feeds/issues 테이블 동작 확인 → 파이프라인 이슈(#11) 착수 가능

### Incremental Delivery

1. Setup + Foundational → 마이그레이션 파일 준비
2. US1 완료 → feeds/issues 검증 → **MVP 달성** (파이프라인 저장 가능)
3. US2 검증 → status 제약 확인
4. US3 완료 → tags/issue_tags 검증
5. US4 완료 → media_sources 검증
6. Polish → 타입 재생성 + 전체 빌드 통과

---

## Notes

- **단일 마이그레이션 파일**: 5개 테이블 DDL이 `20260227000000_initial_schema.sql` 1개 파일에 작성됨 — `supabase db push`는 1회만 실행
- **`display_order` 컬럼명**: PostgreSQL 예약어 `order` 충돌 방지 (research.md § 5)
- **멱등성**: 모든 DDL에 `IF NOT EXISTS` 사용 → 재실행 시 오류 없음
- **RLS 비포함**: 이 이슈 범위 외, #6 Admin 인증 이슈에서 처리
- **타입 재생성**: `npm run db:types`는 원격 Supabase 로그인 세션 필요 (`supabase login` 선행)
