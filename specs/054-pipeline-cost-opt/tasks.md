# Tasks: 파이프라인 토큰 비용 최적화

**Input**: `/specs/054-pipeline-cost-opt/`
**GitHub Issue**: #85
**Branch**: `054-pipeline-cost-opt`

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 병렬 실행 가능 (다른 파일, 의존성 없음)
- **[Story]**: 해당 유저 스토리 (US1 ~ US3)
- 각 태스크에 정확한 파일 경로 포함

---

## Phase 1: Foundational — DB 마이그레이션 + 타입 (필수 선행)

**Purpose**: 이후 모든 변경이 의존하는 DB 스키마와 타입 정의를 먼저 확정한다.

⚠️ **CRITICAL**: 이 단계가 완료되기 전에 US2/US3 구현을 시작하지 않는다.

- [x] T001 `pipeline_logs`에 `tokens_input`, `tokens_output`, `estimated_cost_usd` 컬럼 추가 마이그레이션 파일 생성: `supabase/migrations/20260324000000_add_pipeline_cost_tracking.sql`
- [x] T002 `database.types.ts` 재생성 또는 수동 업데이트 — `pipeline_logs.Row`에 신규 컬럼 반영: `src/types/database.types.ts`
- [x] T003 `TokenUsage` 타입 추가 및 `PipelineExecutionSummary`에 `token_usage` 필드 추가: `src/types/pipeline.ts`

**Checkpoint**: 마이그레이션 + 타입 정의 완료 — 이제 US1, US2, US3 작업 가능

---

## Phase 2: User Story 1 — 기사 필터링 파이프라인 (Priority: P1) 🎯 MVP

**Goal**: 수집된 123건을 Haiku로 10건으로 압축 후 Sonnet에 전달, 소스별 30건 + content 500자 상한 적용

**Independent Test**: 파이프라인 수동 실행 → Admin 로그에서 `articles_collected ≤ 10` 확인

- [x] T004 [US1] `collectArticles`에서 소스별 최신 30건 슬라이스 + `buildArticle`에서 `content.slice(0, 500)` 적용: `src/lib/pipeline/collect.ts`
- [x] T005 [US1] Haiku 필터 모듈 신규 생성 — 기사 제목+요약을 Haiku에 전달하고 tool_use로 상위 10건 인덱스 배열 반환, 오류 시 fallback(원본 반환 + `skipped: true`): `src/lib/pipeline/filter.ts`
- [x] T006 [US1] `runPipeline`에 `filterArticles()` 호출 단계 추가 (`collectArticles` → `filterArticles` → `generateIssues` 순서): `src/lib/pipeline/index.ts`

**Checkpoint**: 파이프라인 실행 시 Sonnet 입력 기사가 10건 이하로 줄어야 함

---

## Phase 3: User Story 3 — 이슈 수 3개 상한 (Priority: P2, 선행: Phase 2)

**Goal**: Sonnet 출력 토큰 감소를 위해 이슈 최대 3개 제한

**Independent Test**: 파이프라인 실행 → Admin 피드에서 이슈 3개 이하 확인

- [x] T007 [US3] `buildSystemPrompt`에 "최대 3개 이슈만 생성" 지시 추가, `generatedIssuesResponseSchema`에 `.max(3)` 적용: `src/lib/pipeline/generate.ts`

**Checkpoint**: 이슈 생성 결과가 항상 3개 이하여야 함

---

## Phase 4: User Story 2 — 비용 로깅 + Admin UI (Priority: P1, 선행: Phase 1)

**Goal**: 실행별 토큰/비용을 DB에 저장하고 Admin에서 확인

**Independent Test**: 파이프라인 실행 → Admin 파이프라인 탭에서 비용 컬럼 확인

- [x] T008 [P] [US2] `generateIssues` / `generateContextIssues`에서 `response.usage` 추출 후 `TokenUsage` 반환, `max_tokens` 8192로 상향: `src/lib/pipeline/generate.ts`
- [x] T009 [P] [US2] `finishPipelineRun`에 `tokenUsage?: TokenUsage` 파라미터 추가, 비용 공식 상수 정의 후 DB 저장: `src/lib/pipeline/log.ts`
- [x] T010 [US2] `runPipeline`에서 Haiku(`filter.ts`) + Sonnet(`generate.ts`) usage 합산 후 `finishPipelineRun`에 전달: `src/lib/pipeline/index.ts`
- [x] T011 [US2] `PipelineManager` 테이블에 비용 컬럼 추가 (`$0.047` 형식, null이면 `—`): `src/components/features/admin/PipelineManager.tsx`
- [x] T012 [US2] `/api/admin/pipeline/logs` 응답에 신규 컬럼 포함 여부 확인 (자동 반영 시 skip): `src/app/api/admin/pipeline/logs/route.ts`

**Checkpoint**: Admin에서 각 실행 행에 비용이 표시되어야 함

---

## Phase 5: 품질 게이트

- [x] T013 TypeScript 컴파일 오류 없음 확인: `npx tsc --noEmit`
- [x] T014 Next.js 빌드 성공 확인: `npm run build`

---

## 의존성 & 실행 순서

```
Phase 1 (T001~T003)          ← 즉시 시작 가능
    │
    ├─→ Phase 2 (T004~T006)  ← Phase 1 완료 후
    │       │
    │       └─→ Phase 3 (T007)   ← Phase 2 완료 후
    │
    └─→ Phase 4 (T008~T012)  ← Phase 1 완료 후 (Phase 2와 병렬 가능)
            │
            └─→ Phase 5 (T013~T014)  ← 모든 Phase 완료 후
```

**병렬 기회**:
- T008, T009는 서로 다른 파일 → 병렬 가능
- Phase 2와 Phase 4는 Phase 1만 완료되면 동시 진행 가능

---

## 구현 전략

### MVP (Phase 1 + 2 + 3 우선)

1. T001~T003 완료 (DB + 타입)
2. T004~T006 완료 (Haiku 필터)
3. T007 완료 (이슈 수 제한)
4. **검증**: 파이프라인 수동 실행 → 기사 10건 이하, 이슈 3개 이하 확인
5. 비용 로깅(Phase 4)은 이후 추가

### 전체 완료 순서

Phase 1 → (Phase 2 + Phase 4 병렬) → Phase 3 → Phase 5
