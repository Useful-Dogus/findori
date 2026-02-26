# Tasks: MVP 스펙 정합성 고정

**Input**: Design documents from `/specs/001-mvp-spec-alignment/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: 명시적 TDD 요구가 없어 테스트 태스크는 생성하지 않음.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: 정합성 작업 착수 준비 및 기준 입력 고정

- [X] T001 정합성 기준 문서 목록과 검토 규칙을 /Users/chanheepark/dev/laboratory/findori/specs/001-mvp-spec-alignment/quickstart.md에 확정 반영
- [X] T002 [P] 충돌 분류/상태 모델을 /Users/chanheepark/dev/laboratory/findori/specs/001-mvp-spec-alignment/data-model.md 기준으로 점검하고 누락 필드를 보완
- [X] T003 [P] 결과 레코드 계약 스키마를 /Users/chanheepark/dev/laboratory/findori/specs/001-mvp-spec-alignment/contracts/alignment-report-contract.md에 확정

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: 모든 사용자 스토리가 공유하는 정합성 레지스터 골격 준비

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T004 문서별 검토 섹션 인덱스를 /Users/chanheepark/dev/laboratory/findori/specs/001-mvp-spec-alignment/research.md 하단에 추가
- [X] T005 정합성 레지스터 초안 파일을 /Users/chanheepark/dev/laboratory/findori/specs/001-mvp-spec-alignment/alignment-register.md로 생성
- [X] T006 [P] 정합성 레지스터 템플릿(Conflict ID, source_refs, resolution, rationale, verification, status)을 /Users/chanheepark/dev/laboratory/findori/specs/001-mvp-spec-alignment/alignment-register.md에 정의
- [X] T007 [P] 용어집 초안 파일을 /Users/chanheepark/dev/laboratory/findori/specs/001-mvp-spec-alignment/glossary.md로 생성하고 표준 용어 컬럼을 정의
- [X] T008 완료 판정 체크리스트 파일을 /Users/chanheepark/dev/laboratory/findori/specs/001-mvp-spec-alignment/dod-checklist.md로 생성

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - MVP 기준 단일화 (Priority: P1) 🎯 MVP

**Goal**: 용어/범위/기능 정의 충돌을 식별하고 단일 기준으로 통일

**Independent Test**: PRD/SRS/Feature Spec 대조 시 동일 기능 정의 충돌이 남지 않아야 함

### Implementation for User Story 1

- [X] T009 [US1] /Users/chanheepark/dev/laboratory/findori/docs/mvp/prd.md에서 핵심 기능 정의 구간을 추출해 /Users/chanheepark/dev/laboratory/findori/specs/001-mvp-spec-alignment/alignment-register.md에 source_refs로 기록
- [X] T010 [P] [US1] /Users/chanheepark/dev/laboratory/findori/docs/mvp/srs.md의 동일 기능 정의 구간을 alignment-register.md에 source_refs로 기록
- [X] T011 [P] [US1] /Users/chanheepark/dev/laboratory/findori/docs/mvp/feature-spec.md의 동일 기능 정의 구간을 alignment-register.md에 source_refs로 기록
- [X] T012 [US1] 용어 충돌 항목(C-xxx, category=terminology)을 /Users/chanheepark/dev/laboratory/findori/specs/001-mvp-spec-alignment/alignment-register.md에 식별 상태로 등록
- [X] T013 [US1] 범위 충돌 항목(C-xxx, category=scope)을 /Users/chanheepark/dev/laboratory/findori/specs/001-mvp-spec-alignment/alignment-register.md에 식별 상태로 등록
- [X] T014 [US1] 표준 용어와 정의를 /Users/chanheepark/dev/laboratory/findori/specs/001-mvp-spec-alignment/glossary.md에 확정
- [X] T015 [US1] PRD 우선 원칙으로 terminology/scope 충돌의 resolution/rationale을 /Users/chanheepark/dev/laboratory/findori/specs/001-mvp-spec-alignment/alignment-register.md에 반영하고 status를 resolved로 갱신
- [X] T016 [US1] 기준 용어를 /Users/chanheepark/dev/laboratory/findori/docs/mvp/prd.md, /Users/chanheepark/dev/laboratory/findori/docs/mvp/srs.md, /Users/chanheepark/dev/laboratory/findori/docs/mvp/feature-spec.md에 동기화

**Checkpoint**: User Story 1 should be fully functional and independently testable

---

## Phase 4: User Story 2 - 예외/상태 기준 정합 (Priority: P2)

**Goal**: 정상/예외/상태 정의를 문서 간 동일 기준으로 정렬

**Independent Test**: 진입/소비/공유/회고 흐름의 상태 정의를 문서별 대조했을 때 충돌 0건

### Implementation for User Story 2

- [X] T017 [US2] 상태/예외 관련 source_refs를 /Users/chanheepark/dev/laboratory/findori/docs/mvp/prd.md에서 추출해 alignment-register.md에 기록
- [X] T018 [P] [US2] 상태/예외 관련 source_refs를 /Users/chanheepark/dev/laboratory/findori/docs/mvp/srs.md에서 추출해 alignment-register.md에 기록
- [X] T019 [P] [US2] 상태/예외 관련 source_refs를 /Users/chanheepark/dev/laboratory/findori/docs/mvp/feature-spec.md에서 추출해 alignment-register.md에 기록
- [X] T020 [US2] behavior/state_exception 카테고리 충돌 항목을 /Users/chanheepark/dev/laboratory/findori/specs/001-mvp-spec-alignment/alignment-register.md에 등록
- [X] T021 [US2] 충돌 항목별 단일 상태 정의 및 예외 처리 규칙을 alignment-register.md의 resolution/rationale로 확정
- [X] T022 [US2] 상태 정의 통일 결과를 /Users/chanheepark/dev/laboratory/findori/docs/mvp/feature-spec.md의 상태 정의 섹션에 반영
- [X] T023 [US2] 상위 범위 문서 동기화를 위해 /Users/chanheepark/dev/laboratory/findori/docs/mvp/prd.md와 /Users/chanheepark/dev/laboratory/findori/docs/mvp/srs.md를 업데이트

**Checkpoint**: User Stories 1 and 2 both work independently

---

## Phase 5: User Story 3 - 구현 검증 기준 고정 (Priority: P3)

**Goal**: 핵심 요구사항과 검증 증거 타입(UI/API/Log)을 1:1 이상 매핑

**Independent Test**: 모든 핵심 요구사항에 최소 1개 검증 증거 타입이 존재하고 판정 조건이 측정 가능해야 함

### Implementation for User Story 3

- [X] T024 [US3] FR 목록을 /Users/chanheepark/dev/laboratory/findori/specs/001-mvp-spec-alignment/spec.md에서 추출해 verification 매핑 초안을 alignment-register.md에 추가
- [X] T025 [US3] 각 FR에 대해 verification.type/method/pass_condition을 /Users/chanheepark/dev/laboratory/findori/specs/001-mvp-spec-alignment/alignment-register.md에 채움
- [X] T026 [US3] 계약 스키마 충족 여부를 /Users/chanheepark/dev/laboratory/findori/specs/001-mvp-spec-alignment/contracts/alignment-report-contract.md 기준으로 점검하고 alignment-register.md status를 verified로 갱신
- [X] T027 [US3] 완료 판정 체크 항목을 /Users/chanheepark/dev/laboratory/findori/specs/001-mvp-spec-alignment/dod-checklist.md에 반영
- [X] T028 [US3] 후속 Foundation 이슈 참조용 요약을 /Users/chanheepark/dev/laboratory/findori/specs/001-mvp-spec-alignment/quickstart.md에 추가

**Checkpoint**: All user stories should now be independently functional

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: 전 사용자 스토리에 걸친 마감 정리 및 추적성 강화

- [X] T029 [P] 정합성 산출물 링크 인덱스를 /Users/chanheepark/dev/laboratory/findori/specs/001-mvp-spec-alignment/README.md로 생성
- [X] T030 /Users/chanheepark/dev/laboratory/findori/specs/001-mvp-spec-alignment/spec.md의 Success Criteria와 alignment-register.md 결과 일치 여부를 상호 검증
- [X] T031 /Users/chanheepark/dev/laboratory/findori/specs/001-mvp-spec-alignment/checklists/requirements.md를 최종 상태로 갱신
- [X] T032 /Users/chanheepark/dev/laboratory/findori/docs/mvp/README.md에 정합성 기준 문서 위치(스펙 패키지 링크)를 추가

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: Depend on Foundational phase completion
- **Polish (Phase 6)**: Depends on all user stories complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational - no story dependency
- **User Story 2 (P2)**: Can start after Foundational - references US1 terminology outcomes
- **User Story 3 (P3)**: Can start after Foundational - uses US1/US2-resolved register entries

### Within Each User Story

- Source reference extraction before conflict registration
- Conflict registration before resolution
- Resolution before status verification
- Verification before DoD finalization

### Parallel Opportunities

- T002 and T003 can run in parallel
- T006 and T007 can run in parallel
- T010 and T011 can run in parallel
- T018 and T019 can run in parallel
- T029 can run in parallel with final validation tasks

---

## Parallel Example: User Story 1

```bash
Task: "T010 [US1] srs.md source_refs 추출"
Task: "T011 [US1] feature-spec.md source_refs 추출"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1
4. Validate terminology/scope conflict zero state

### Incremental Delivery

1. Deliver US1 for terminology/scope baseline
2. Deliver US2 for state/exception consistency
3. Deliver US3 for verifiable completion mapping
4. Run Phase 6 polish and finalize references

### Parallel Team Strategy

1. One owner maintains alignment-register.md integrity
2. Additional contributors extract source_refs in parallel
3. Final reviewer verifies contract compliance and DoD closure

---

## Notes

- [P] tasks are isolated file edits or non-overlapping sections
- [USx] labels map directly to spec user stories
- This task list is documentation-governance oriented and intentionally avoids runtime implementation tasks
