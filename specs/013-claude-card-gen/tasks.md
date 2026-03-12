# Tasks: Claude 카드 생성 모듈

**Input**: Design documents from `specs/013-claude-card-gen/`
**Branch**: `013-claude-card-gen`
**Generated**: 2026-03-06

**Organization**: User Story별 독립 구현·검증 가능하도록 구성. 헌법 II("Tests Define Correctness")에 따라 행동 변경 사항에 테스트 포함.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 병렬 실행 가능 (다른 파일, 미완료 태스크 미의존)
- **[Story]**: 해당 태스크가 속한 User Story (US1, US2, US3)
- 파일 경로는 설명에 명시

---

## Phase 1: Foundational (Blocking Prerequisites)

**Purpose**: 모든 User Story 구현 전 반드시 완료해야 할 공통 기반

**⚠️ CRITICAL**: 이 Phase 완료 전까지 User Story 구현 시작 불가

- [X] T001 `ContextMarketData` 타입 추가 (`entityId`, `entityName`, `entityType: 'index' | 'currency'`, `value`, `change`, `changePercent`) in `src/types/pipeline.ts`
- [X] T002 `buildSystemPrompt()` 함수 추가 in `src/lib/pipeline/generate.ts` — 역할 정의(금융 뉴스 편집 파이프라인, 한국 개인 투자자 대상) + 카드 타입 카탈로그 7종(cover/reason/bullish/bearish/community/stats/source) 각 타입 필수 필드 포함 + 제약 규칙(3~7장, cover 시작, source 종료, hex 색상, sources 필수) + 콘텐츠 규칙(투자 유도 표현 금지, 한국어)

**Checkpoint**: T001, T002 완료 후 User Story 구현 시작 가능

---

## Phase 2: User Story 1 — generateIssues에 system prompt 적용 (Priority: P1) 🎯 MVP

**Goal**: `generateIssues()`가 상세 카드 타입 규칙을 포함한 system prompt를 AI에 전달하여 올바른 구조의 카드를 생성한다.

**Independent Test**: 수집된 기사 데이터(mock)로 `generateIssues()`를 호출하면 AI 호출에 `system` 파라미터가 포함되고, 결과 이슈의 channel이 `'v1'`이다.

### Implementation for User Story 1

- [X] T003 [US1] `generateIssues()`의 `messages.create()` 호출에 `system: buildSystemPrompt()` 파라미터 추가 in `src/lib/pipeline/generate.ts`
- [X] T004 [US1] `buildPrompt()` 리팩토링 in `src/lib/pipeline/generate.ts` — 역할/규칙 지시문 제거(system prompt로 이동), 기사 목록만 포함하도록 단순화
- [X] T005 [US1] channel 기본값 `'default'` → `'v1'` 수정 (`issue.channel ?? 'default'` → `issue.channel ?? 'v1'`) in `src/lib/pipeline/generate.ts`

### Tests for User Story 1

- [X] T006 [P] [US1] 단위 테스트 추가 — `generateIssues()` 호출 시 `anthropic.messages.create`가 `system` 파라미터를 포함하여 호출됨을 검증 in `tests/unit/lib/pipeline-generate.test.ts`
- [X] T007 [P] [US1] 단위 테스트 추가 — `generateIssues()` 결과 이슈의 channel이 `'v1'`임을 검증 (channel 필드 없는 AI 응답 기준) in `tests/unit/lib/pipeline-generate.test.ts`

**Checkpoint**: US1 완료 후 `generateIssues()` 단독으로 검증 가능

---

## Phase 3: User Story 2 — generateContextIssues 신규 구현 (Priority: P2)

**Goal**: 코스피·나스닥·USD/KRW 등 시장 맥락 지표를 입력받아 `entity_type`이 `index` 또는 `currency`인 이슈 초안을 생성하는 `generateContextIssues()` 함수를 추가한다.

**Independent Test**: `ContextMarketData[]` 목 데이터로 `generateContextIssues()`를 호출하면 `entity_type`이 `index` 또는 `currency`인 `GeneratedIssueDraft`가 반환된다. 빈 배열 입력 시 AI 호출 없이 즉시 종료된다.

### Implementation for User Story 2

- [X] T008 [US2] `buildContextPrompt(contextData: ContextMarketData[])` 헬퍼 함수 추가 in `src/lib/pipeline/generate.ts` — 각 지표(entityName, value, change, changePercent)를 텍스트로 나열하는 user prompt 생성
- [X] T009 [US2] `generateContextIssues(contextData: ContextMarketData[], deps?)` 함수 추가 in `src/lib/pipeline/generate.ts` — `generateIssues()`와 동일한 tool_use 패턴 사용, `buildContextPrompt()` user prompt, `buildSystemPrompt()` system prompt, 동일한 `parseCards()` 검증, channel `'v1'`, 빈 배열 early exit
- [X] T010 [US2] `generateContextIssues` 재내보내기 추가 in `src/lib/pipeline/index.ts`

### Tests for User Story 2

- [X] T011 [P] [US2] 단위 테스트 추가 — `generateContextIssues()` happy path: mock AI 응답으로 `entity_type: 'index'` 이슈 생성 확인, channel `'v1'` 확인 in `tests/unit/lib/pipeline-generate.test.ts`
- [X] T012 [P] [US2] 단위 테스트 추가 — `generateContextIssues([])` 호출 시 AI 호출 없이 `{ issues: [], errors: [] }` 반환 확인 in `tests/unit/lib/pipeline-generate.test.ts`

**Checkpoint**: US2 완료 후 `generateContextIssues()` 단독으로 검증 가능

---

## Phase 4: User Story 3 — generateContextIssues 부분 성공 검증 (Priority: P3)

**Goal**: `generateContextIssues()`에서 schema 검증 실패 항목은 스킵되고 성공 항목은 정상 반환되는 부분 성공 동작을 테스트로 검증한다. (구현은 T009에서 완성; 이 Phase는 검증만)

**Independent Test**: `generateContextIssues()`에 schema 위반 cards[]를 반환하는 mock AI를 연결하면 해당 항목은 errors[]에 기록되고 나머지는 정상 반환된다.

### Tests for User Story 3

- [X] T013 [US3] 단위 테스트 추가 — `generateContextIssues()` 부분 성공: schema 위반 cards[]를 반환하는 mock AI 사용 시 해당 이슈는 errors에 기록되고 유효한 이슈는 정상 반환됨 확인 in `tests/unit/lib/pipeline-generate.test.ts`

**Checkpoint**: 모든 User Story 검증 완료

---

## Final Phase: 품질 게이트

**Purpose**: 전체 변경사항 통합 검증

- [X] T014 `npm run validate && npm run test` 실행하여 타입 검사·린트·포맷·전체 테스트 통과 확인

---

## Dependencies & Execution Order

### Phase Dependencies

- **Foundational (Phase 1)**: 즉시 시작 가능
- **US1 (Phase 2)**: T002 완료 필요 (T003, T004, T005)
- **US2 (Phase 3)**: T001 완료 필요 (T008, T009), T009 완료 필요 (T010)
- **US3 (Phase 4)**: T009 완료 필요 (T013)
- **품질 게이트 (Final)**: 모든 Phase 완료 필요

### User Story Dependencies

- **US1**: T002(system prompt) 완료 후 시작
- **US2**: T001(ContextMarketData 타입) 완료 후 시작. US1과 독립적으로 병렬 진행 가능.
- **US3**: T009(generateContextIssues 구현) 완료 후 시작

### Within Each User Story

- T003 → T004 → T005 순서 또는 병렬(같은 파일이나 독립적 변경)
- T006, T007: 병렬 가능 ([P] 표시)
- T008 → T009 → T010 순서
- T011, T012: 병렬 가능 ([P] 표시)

### Parallel Opportunities

```bash
# Foundational 내 병렬:
T001 (pipeline.ts 타입) || T002 (generate.ts system prompt)

# US1 테스트 병렬:
T006 (system prompt 포함 검증) || T007 (channel 'v1' 검증)

# US1, US2 병렬 (Foundational 완료 후):
[US1: T003→T004→T005→T006/T007] || [US2: T008→T009→T010→T011/T012]

# US2 테스트 병렬:
T011 (happy path) || T012 (empty input)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. T001, T002 완료 (Foundational)
2. T003, T004, T005 완료 (US1 구현)
3. T006, T007 완료 (US1 테스트)
4. **STOP and VALIDATE**: `npm run test` — US1 독립 검증
5. US1 완료 = `generateIssues()`가 system prompt로 품질 높은 카드 생성

### Incremental Delivery

1. Foundational 완료 → 공통 기반 준비
2. US1 완료 → 기존 파이프라인 품질 향상 (기 동작 코드 개선)
3. US2 완료 → 맥락 카드 생성 신규 기능 추가
4. US3 완료 → 새 함수 견고성 검증

---

## Notes

- **T002 핵심 내용** (`buildSystemPrompt()`): 7개 카드 타입 각각의 필수 필드를 명시. 특히 `visual.*`은 반드시 hex 코드, `sources`가 있는 타입(reason/bullish/bearish)에는 최소 1개 필수, 투자 권유 표현 금지를 명시.
- **기존 테스트 3개 유지**: `parses valid tool_use output`, `skips issues whose cards fail validation`, `returns early when there are no collected articles` — 변경 없이 통과되어야 함.
- **`parseCards()` 재사용**: `generateContextIssues()`에서도 기존 Zod 검증 레이어 그대로 사용. 코드 중복 없음.
- **channel 기본값 수정(T005)**: 기존 테스트에서 `channel: 'default'`를 기대하는 케이스 있으면 `'v1'`으로 함께 수정.
