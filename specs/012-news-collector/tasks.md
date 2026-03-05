# Tasks: 뉴스 수집 모듈 (012-news-collector)

**Input**: Design documents from `/specs/012-news-collector/`
**Feature**: #12 뉴스 수집 모듈 구현 (화이트리스트 기반, URL dedup)

## 현황 요약

> **핵심**: `collect.ts`와 기존 테스트는 #11 구현 시 이미 완성되었다. 이번 구현 범위는 **FR-007 단 하나** — 매체별 수집 건수(`source_stats`)와 dedup 이전 총 건수(`articles_raw`)를 `pipeline_logs`에 기록하는 것이다.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 병렬 실행 가능 (다른 파일, 의존성 없음)
- **[Story]**: 해당 User Story 레이블 (US1/US2/US3)

---

## Phase 1: Foundational — DB 스키마 확장

**Purpose**: `source_stats`, `articles_raw` 컬럼을 `pipeline_logs`에 추가. 이후 모든 타입/로직 변경의 전제 조건.

**⚠️ CRITICAL**: 이 단계 완료 전에는 타입 수정 및 로직 구현 불가.

- [ ] T001 `pipeline_logs` 테이블에 컬럼 추가하는 migration 파일 생성 (`supabase/migrations/YYYYMMDDHHMMSS_add_pipeline_source_stats.sql`) — `source_stats JSONB NOT NULL DEFAULT '[]'`, `articles_raw INT NOT NULL DEFAULT 0`, 각 컬럼 COMMENT 포함
- [ ] T002 `src/types/database.types.ts` 수동 업데이트 — `pipeline_logs` Row/Insert/Update에 `source_stats: Json`, `articles_raw: number` 컬럼 추가

**Checkpoint**: DB 타입이 새 컬럼을 인식하면 Phase 2로 진행 가능

---

## Phase 2: User Story 1 — 파이프라인이 당일 기사를 수집하고 통계를 기록한다 (Priority: P1) 🎯 MVP

**Goal**: `collectArticles`가 `sourceStats`/`articlesRaw`를 반환하고, 파이프라인 실행 완료 시 `pipeline_logs`에 저장된다.

**Independent Test**: `npm run test tests/unit/lib/pipeline-collect.test.ts` 전체 통과 + `pipeline_logs`에 `source_stats`/`articles_raw` 값이 기록됨을 `finishPipelineRun` 단위 테스트로 확인.

### 구현 (US1)

- [ ] T003 [US1] `src/types/pipeline.ts`에 `PipelineSourceStat = { source: string; count: number }` 타입 추가, `collectArticles` 반환 타입을 `{ articles, errors, sourceStats: PipelineSourceStat[], articlesRaw: number }`로 정의
- [ ] T004 [US1] `src/lib/pipeline/collect.ts` — `perSourceResults` 집계 후 `sourceStats` 계산 (성공 매체만, 당일 필터 이후 dedup 이전 건수), `articlesRaw` 계산, 반환값에 두 필드 추가
- [ ] T005 [US1] `src/lib/pipeline/log.ts` — `finishPipelineRun` 파라미터에 `articlesRaw: number`, `sourceStats: PipelineSourceStat[]` 추가; UPDATE 쿼리에 `articles_raw`, `source_stats` 포함
- [ ] T006 [US1] `src/lib/pipeline/index.ts` — `collectArticles` 반환값에서 `sourceStats`, `articlesRaw`를 꺼내 `finishPipelineRun` 호출 시 전달; `PipelineExecutionSummary` 타입에 `articles_raw: number`, `source_stats: PipelineSourceStat[]` 추가

### 테스트 (US1)

- [ ] T007 [P] [US1] `tests/unit/lib/pipeline-collect.test.ts`에 케이스 추가 — 정상 수집 시 `sourceStats` 정확도 검증(매체별 count), `articlesRaw === sourceStats의 count 합계`, dedup 케이스에서 `articles.length < articlesRaw` 확인
- [ ] T008 [P] [US1] `tests/unit/lib/pipeline-log.test.ts` 존재 시 `finishPipelineRun` 신규 파라미터 테스트 추가 (없으면 신규 파일 생성 없이 생략 가능)

**Checkpoint**: `npm run test` 전체 통과, TypeScript 오류 없음 → US1 완료

---

## Phase 3: User Story 2 — 개별 매체 실패가 sourceStats에서 제외된다 (Priority: P2)

**Goal**: 실패한 매체는 `errors` 배열에만 기록되고 `sourceStats`에는 포함되지 않는다.

**Independent Test**: `npm run test tests/unit/lib/pipeline-collect.test.ts` — 1개 매체 실패 시 `sourceStats`에 실패 매체가 없고 `errors`에 기록되는 케이스 통과.

### 테스트 (US2)

- [ ] T009 [US2] `tests/unit/lib/pipeline-collect.test.ts`에 케이스 추가 — 1개 매체 fetch 실패 시 `sourceStats`에 해당 매체가 없는지 검증, 성공 매체의 `sourceStats.count`는 정확한지 검증, `articlesRaw`가 성공 매체 기사 수의 합계인지 검증

### 구현 (US2)

- [ ] T010 [US2] `src/lib/pipeline/collect.ts` — `sourceStats` 계산 로직에서 `errors`에 포함된 매체를 필터링하여 실패 매체 제외 확인 (T004에서 구현 시 이미 반영되어 있으면 검증만)

**Checkpoint**: 실패 격리 케이스 테스트 통과 → US2 완료

---

## Phase 4: User Story 3 — 운영자가 로그에서 통계를 확인할 수 있다 (Priority: P3)

**Goal**: `/api/admin/pipeline/logs` 응답에 `source_stats`, `articles_raw` 필드가 포함되어 Admin 화면에서 확인 가능.

**Independent Test**: `GET /api/admin/pipeline/logs` 응답의 각 로그 항목에 `source_stats` 배열과 `articles_raw` 숫자가 포함되어 있음을 API 단위 테스트 또는 직접 호출로 확인.

### 구현 (US3)

- [ ] T011 [US3] `src/app/api/admin/pipeline/logs/route.ts` — `PipelineLogRow` 타입이 이미 DB 타입에서 파생되므로 신규 컬럼이 자동 포함되는지 확인; 별도 변환 로직이 있으면 `source_stats`, `articles_raw` 포함하도록 수정
- [ ] T012 [P] [US3] `tests/unit/api/admin-pipeline-logs-route.test.ts` — 응답 JSON에 `source_stats`와 `articles_raw`가 포함되는지 검증하는 케이스 추가

**Checkpoint**: 로그 API 응답에 신규 필드 포함 → US3 완료

---

## Phase 5: Polish & 품질 게이트

- [ ] T013 [P] 전체 타입 일관성 검사 — `PipelineExecutionSummary`의 `source_stats`/`articles_raw` 필드가 응답 직렬화 경로 전체에서 누락 없이 흐르는지 확인 (`src/app/api/cron/pipeline/route.ts` 응답 포함)
- [ ] T014 `npm run validate` 통과 (type-check + lint + format:check)
- [ ] T015 `npm run test` 전체 통과 (회귀 없음 + 신규 케이스 포함)
- [ ] T016 `npm run build` 통과 (프로덕션 빌드 타입 오류 없음)

---

## Dependencies & Execution Order

### Phase 의존성

```
Phase 1 (DB 스키마)
  → Phase 2 (US1: 타입 + 로직 + 테스트)
      → Phase 3 (US2: 실패 격리 테스트) [병렬 가능]
      → Phase 4 (US3: 로그 API)         [병렬 가능]
          → Phase 5 (품질 게이트)
```

### 태스크 내 의존성

```
T001 (migration) → T002 (DB 타입)
T002 → T003 (pipeline 타입) → T004 (collect.ts) → T005 (log.ts) → T006 (index.ts)
T004 완료 후 → T007, T009, T010 (병렬)
T006 완료 후 → T011, T012 (병렬)
T007+T009+T010+T012 완료 후 → T013 → T014 → T015 → T016
```

### Parallel Opportunities

```bash
# Phase 2 테스트 병렬 실행:
Task: T007 — pipeline-collect.test.ts 신규 케이스
Task: T008 — pipeline-log.test.ts 신규 케이스

# Phase 3+4 병렬 실행 (T006 완료 후):
Task: T009+T010 — US2 실패 격리
Task: T011+T012 — US3 로그 API
```

---

## Implementation Strategy

### MVP (US1만)

1. Phase 1: T001 → T002
2. Phase 2: T003 → T004 → T005 → T006 → T007
3. `npm run validate && npm run test`
4. **STOP**: `source_stats`/`articles_raw`가 DB에 저장되면 FR-007 충족

### Full Delivery

1. Phase 1 → Phase 2 (MVP)
2. Phase 3 (US2: 실패 격리 테스트 보강)
3. Phase 4 (US3: 로그 API 검증)
4. Phase 5 (품질 게이트)

---

## Notes

- 기존 `collect.ts` 로직(RSS fetch, KST 필터, URL dedup, 오류 격리)은 **변경하지 않는다**. 반환 타입 확장과 sourceStats 계산 추가만 수행.
- `database.types.ts`는 `npm run db:types`로 재생성하지 않고 **수동 수정**한다 (환경변수 `SUPABASE_PROJECT_ID` 미설정 시 실패 정책).
- migration 파일명의 타임스탬프는 실제 작성 시점 기준으로 결정한다 (예: `20260305120000_add_pipeline_source_stats.sql`).
