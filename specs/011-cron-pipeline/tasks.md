# Tasks: Cron 파이프라인 엔드포인트

**Input**: Design documents from `/specs/011-cron-pipeline/`
**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/api-endpoints.md`

**Tests**: 파이프라인 오케스트레이션과 핵심 모듈은 Vitest로 검증한다. 각 사용자 스토리별 독립 검증이 가능하도록 필요한 단위/통합 테스트를 포함한다.

**Organization**: 작업은 사용자 스토리별로 그룹화되어 있으며, 각 스토리는 독립적으로 구현·검증 가능해야 한다.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 서로 다른 파일이라 병렬 진행 가능
- **[Story]**: 사용자 스토리 식별자 (`US1`, `US2`, `US3`, `US4`)
- 모든 작업 설명에는 실제 파일 경로를 포함한다.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: 파이프라인 구현에 필요한 의존성과 기본 타입 구조를 준비한다.

- [ ] T001 Update dependencies in `/Users/chanheepark/dev/laboratory/findori/.claude/worktrees/wonderful-blackburn/package.json` and lockfile to add `@anthropic-ai/sdk` and `rss-parser`
- [ ] T002 Create pipeline domain types in `/Users/chanheepark/dev/laboratory/findori/.claude/worktrees/wonderful-blackburn/src/types/pipeline.ts` for articles, generated issues, pipeline errors, and execution summaries

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: 모든 사용자 스토리가 공통으로 의존하는 실행 로그, 중복 실행 방지, 저장소 기반을 마련한다.

**⚠️ CRITICAL**: 이 단계가 끝나기 전에는 어떤 사용자 스토리도 구현하지 않는다.

- [ ] T003 Create `pipeline_logs` migration in `/Users/chanheepark/dev/laboratory/findori/.claude/worktrees/wonderful-blackburn/supabase/migrations/20260303000000_add_pipeline_logs.sql`
- [ ] T004 Update Supabase generated types in `/Users/chanheepark/dev/laboratory/findori/.claude/worktrees/wonderful-blackburn/src/types/database.types.ts` to include `pipeline_logs`
- [ ] T005 [P] Implement pipeline log repository helpers in `/Users/chanheepark/dev/laboratory/findori/.claude/worktrees/wonderful-blackburn/src/lib/pipeline/log.ts` for start, finish, list, and duplicate-run detection
- [ ] T006 [P] Create pipeline persistence helpers in `/Users/chanheepark/dev/laboratory/findori/.claude/worktrees/wonderful-blackburn/src/lib/pipeline/store.ts` for feed upsert and draft issue inserts
- [ ] T007 Create pipeline module barrel and orchestration interface in `/Users/chanheepark/dev/laboratory/findori/.claude/worktrees/wonderful-blackburn/src/lib/pipeline/index.ts`

**Checkpoint**: 실행 로그와 저장 기반이 준비되어 사용자 스토리 작업을 시작할 수 있다.

---

## Phase 3: User Story 1 - 일일 자동 콘텐츠 수집·생성 (Priority: P1) 🎯 MVP

**Goal**: 활성 RSS 매체에서 당일 기사를 수집하고 AI 카드 초안을 생성해 DB에 `draft`로 저장한다.

**Independent Test**: 유효한 인증으로 크론 엔드포인트를 호출했을 때 기사 수집, 카드 생성, 저장, 실행 요약 응답이 완료된다.

### Tests for User Story 1

- [ ] T008 [P] [US1] Add RSS collection unit tests in `/Users/chanheepark/dev/laboratory/findori/.claude/worktrees/wonderful-blackburn/tests/unit/lib/pipeline-collect.test.ts`
- [ ] T009 [P] [US1] Add Claude card generation unit tests in `/Users/chanheepark/dev/laboratory/findori/.claude/worktrees/wonderful-blackburn/tests/unit/lib/pipeline-generate.test.ts`
- [ ] T010 [P] [US1] Add persistence/orchestration integration tests in `/Users/chanheepark/dev/laboratory/findori/.claude/worktrees/wonderful-blackburn/tests/integration/pipeline-run.test.ts`

### Implementation for User Story 1

- [ ] T011 [P] [US1] Implement RSS article collection in `/Users/chanheepark/dev/laboratory/findori/.claude/worktrees/wonderful-blackburn/src/lib/pipeline/collect.ts`
- [ ] T012 [P] [US1] Implement Claude `tool_use` issue generation in `/Users/chanheepark/dev/laboratory/findori/.claude/worktrees/wonderful-blackburn/src/lib/pipeline/generate.ts`
- [ ] T013 [US1] Complete feed upsert and draft issue insert flow in `/Users/chanheepark/dev/laboratory/findori/.claude/worktrees/wonderful-blackburn/src/lib/pipeline/store.ts`
- [ ] T014 [US1] Implement pipeline orchestrator in `/Users/chanheepark/dev/laboratory/findori/.claude/worktrees/wonderful-blackburn/src/lib/pipeline/index.ts` to coordinate collect, generate, store, and execution summary
- [ ] T015 [US1] Replace the placeholder cron handler in `/Users/chanheepark/dev/laboratory/findori/.claude/worktrees/wonderful-blackburn/src/app/api/cron/pipeline/route.ts` with the real pipeline execution response

**Checkpoint**: 크론 호출만으로 당일 초안 생성까지 동작해야 한다.

---

## Phase 4: User Story 2 - 인증되지 않은 호출 차단 (Priority: P1)

**Goal**: 크론과 Admin 수동 실행 엔드포인트가 인증 실패 시 즉시 차단되고, 유효한 요청만 파이프라인을 시작할 수 있다.

**Independent Test**: 잘못된 Bearer 토큰 또는 Admin 세션 없는 요청은 401로 종료되고 로그/저장이 발생하지 않는다.

### Tests for User Story 2

- [ ] T016 [P] [US2] Add cron auth route tests in `/Users/chanheepark/dev/laboratory/findori/.claude/worktrees/wonderful-blackburn/tests/unit/api/cron-pipeline-route.test.ts`
- [ ] T017 [P] [US2] Add admin pipeline run auth tests in `/Users/chanheepark/dev/laboratory/findori/.claude/worktrees/wonderful-blackburn/tests/unit/api/admin-pipeline-run-route.test.ts`

### Implementation for User Story 2

- [ ] T018 [US2] Harden Bearer token validation and response contract in `/Users/chanheepark/dev/laboratory/findori/.claude/worktrees/wonderful-blackburn/src/app/api/cron/pipeline/route.ts`
- [ ] T019 [US2] Implement authenticated admin-trigger route in `/Users/chanheepark/dev/laboratory/findori/.claude/worktrees/wonderful-blackburn/src/app/api/admin/pipeline/run/route.ts`

**Checkpoint**: 인증 요구사항이 자동 실행과 수동 실행 모두에 적용된다.

---

## Phase 5: User Story 3 - 부분 실패 허용 처리 (Priority: P2)

**Goal**: 일부 매체 수집 또는 일부 AI 생성이 실패해도 성공한 항목은 계속 저장되고, 실행 상태는 `partial` 또는 `failed`로 기록된다.

**Independent Test**: 하나 이상의 RSS/AI 실패를 주입했을 때 성공 항목은 저장되고 응답 및 실행 로그에 오류 목록이 포함된다.

### Tests for User Story 3

- [ ] T020 [P] [US3] Add partial-failure collection tests in `/Users/chanheepark/dev/laboratory/findori/.claude/worktrees/wonderful-blackburn/tests/unit/lib/pipeline-collect.test.ts`
- [ ] T021 [P] [US3] Add partial-failure generation/orchestrator tests in `/Users/chanheepark/dev/laboratory/findori/.claude/worktrees/wonderful-blackburn/tests/unit/lib/pipeline-generate.test.ts`
- [ ] T022 [P] [US3] Add duplicate-run and partial-result integration tests in `/Users/chanheepark/dev/laboratory/findori/.claude/worktrees/wonderful-blackburn/tests/integration/pipeline-run.test.ts`

### Implementation for User Story 3

- [ ] T023 [US3] Add per-source timeout and error isolation in `/Users/chanheepark/dev/laboratory/findori/.claude/worktrees/wonderful-blackburn/src/lib/pipeline/collect.ts`
- [ ] T024 [US3] Add per-issue generation failure handling and cards validation fallback in `/Users/chanheepark/dev/laboratory/findori/.claude/worktrees/wonderful-blackburn/src/lib/pipeline/generate.ts`
- [ ] T025 [US3] Extend execution log state transitions and stale-running detection in `/Users/chanheepark/dev/laboratory/findori/.claude/worktrees/wonderful-blackburn/src/lib/pipeline/log.ts`
- [ ] T026 [US3] Update `/Users/chanheepark/dev/laboratory/findori/.claude/worktrees/wonderful-blackburn/src/lib/pipeline/index.ts` and `/Users/chanheepark/dev/laboratory/findori/.claude/worktrees/wonderful-blackburn/src/app/api/cron/pipeline/route.ts` to return `partial` summaries and `409 pipeline_already_running`

**Checkpoint**: 부분 실패와 중복 실행 방지까지 포함한 운영 안정성이 확보된다.

---

## Phase 6: User Story 4 - 파이프라인 실행 로그 조회 (Priority: P3)

**Goal**: Admin이 파이프라인 실행 이력과 오류 내용을 페이지네이션으로 조회할 수 있다.

**Independent Test**: Admin 세션으로 로그 조회 API를 호출하면 상태, 처리 건수, 오류 목록이 포함된 목록 응답이 반환된다.

### Tests for User Story 4

- [ ] T027 [P] [US4] Add admin pipeline logs route tests in `/Users/chanheepark/dev/laboratory/findori/.claude/worktrees/wonderful-blackburn/tests/unit/api/admin-pipeline-logs-route.test.ts`

### Implementation for User Story 4

- [ ] T028 [US4] Implement paginated pipeline log listing in `/Users/chanheepark/dev/laboratory/findori/.claude/worktrees/wonderful-blackburn/src/app/api/admin/pipeline/logs/route.ts`
- [ ] T029 [US4] Add list query support and response mapping in `/Users/chanheepark/dev/laboratory/findori/.claude/worktrees/wonderful-blackburn/src/lib/pipeline/log.ts`

**Checkpoint**: 운영자가 과거 실행 상태와 오류를 API로 확인할 수 있다.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: 운영 배포와 품질 게이트를 마무리한다.

- [ ] T030 [P] Update cron schedule or pipeline deployment config in `/Users/chanheepark/dev/laboratory/findori/.claude/worktrees/wonderful-blackburn/vercel.json` if the final endpoint contract requires adjustment
- [ ] T031 [P] Run and fix `npm run validate` and `npm run test` for `/Users/chanheepark/dev/laboratory/findori/.claude/worktrees/wonderful-blackburn`
- [ ] T032 [P] Update feature documentation in `/Users/chanheepark/dev/laboratory/findori/.claude/worktrees/wonderful-blackburn/specs/011-cron-pipeline/plan.md` or adjacent spec docs if implementation deviations occur

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: 즉시 시작 가능
- **Phase 2 (Foundational)**: Phase 1 완료 후 시작, 모든 사용자 스토리를 차단
- **Phase 3 (US1)**: Phase 2 완료 후 시작 가능
- **Phase 4 (US2)**: Phase 2 완료 후 시작 가능, `route.ts` 변경은 US1 구현과 조율 필요
- **Phase 5 (US3)**: US1 기본 오케스트레이션 완료 후 시작
- **Phase 6 (US4)**: Phase 2 완료 후 시작 가능, `log.ts` 기본 구현에 의존
- **Phase 7 (Polish)**: 원하는 사용자 스토리 완료 후 진행

### User Story Dependencies

- **US1 (P1)**: 독립 MVP, 다른 사용자 스토리에 의존하지 않음
- **US2 (P1)**: 공통 기반 이후 바로 가능, US1과 같은 엔드포인트를 공유
- **US3 (P2)**: US1의 수집/생성/저장 흐름이 먼저 있어야 함
- **US4 (P3)**: `pipeline_logs` 저장과 조회 헬퍼에 의존하지만 US1 완료 전에도 API 자체는 병행 구현 가능

### Within Each User Story

- 테스트를 먼저 작성하고 실패를 확인한 뒤 구현한다.
- 수집/생성/저장 같은 모듈 작업을 먼저 끝내고 라우트 핸들러를 연결한다.
- 로그 상태 전이와 응답 계약은 오케스트레이터 변경과 함께 마무리한다.

### Parallel Opportunities

- `T005`와 `T006`은 서로 다른 파일이므로 병렬 진행 가능
- US1의 `T008`, `T009`, `T010`은 병렬 진행 가능
- US1의 `T011`과 `T012`는 병렬 진행 가능
- US2의 `T016`과 `T017`은 병렬 진행 가능
- US3의 테스트 세트 `T020`~`T022`는 병렬 진행 가능
- US4는 `T028` 전에 `T029` 인터페이스 변경을 먼저 정리하면 충돌을 줄일 수 있다

---

## Parallel Example: User Story 1

```bash
Task: "Add RSS collection unit tests in tests/unit/lib/pipeline-collect.test.ts"
Task: "Add Claude card generation unit tests in tests/unit/lib/pipeline-generate.test.ts"
Task: "Implement RSS article collection in src/lib/pipeline/collect.ts"
Task: "Implement Claude tool_use issue generation in src/lib/pipeline/generate.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 and Phase 2.
2. Complete Phase 3 (US1) to make cron-based draft generation work end-to-end.
3. Validate the cron endpoint independently.
4. Add Phase 4 authentication hardening if not already covered during US1 route work.
5. Add Phase 5 and Phase 6 for resilience and operational visibility.
