# Tasks: 에이전트 산출물 작성 규칙 통합

**Input**: Design documents from `specs/042-agent-artifact-conventions/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, quickstart.md ✅
**Project Type**: Documentation — 소스 코드 변경 없음. 파일 2개 변경 (1 신규, 1 업데이트).

> **Note**: 이 피처는 순수 문서 변경이므로 Setup/Foundational 단계가 없다.
> 테스트는 자동화 대신 수동 검증(quickstart.md 체크리스트)으로 대체된다.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 병렬 실행 가능 (다른 파일, 의존성 없음)
- **[Story]**: 해당 유저 스토리 (US1~US4)
- 각 태스크에 정확한 파일 경로 포함

---

## Phase 3: US1 + US2 — 산출물 형식 규칙 & 번호 정렬 체계 (Priority: P1) 🎯 MVP

**Goal**: `docs/artifact-conventions.md` 파일을 생성하고 스펙·이슈·커밋·PR 형식 규칙과 번호 정렬 체계(섹션 1~5)를 작성한다. `docs/agent-guidelines.md`에 참조 섹션을 추가한다.

**Independent Test**: `docs/artifact-conventions.md`에 섹션 1~5가 존재하고, `docs/agent-guidelines.md`에서 해당 파일을 참조하는지 확인한다. 동일 작업 설명으로 에이전트가 생성한 이슈 초안에 배경·범위·완료 기준이 포함되는지 확인한다.

### Implementation for US1 + US2

- [X] T001 [US2] `docs/artifact-conventions.md` 파일을 신규 생성하고 섹션 1 — 번호 정렬 체계(GitHub 이슈 #N → 브랜치 0NN-* → specs/0NN-* 3자리 패딩 규칙, 커밋/PR 본문에서는 패딩 없이 원래 숫자 사용)를 작성한다
- [X] T002 [US1] `docs/artifact-conventions.md`에 섹션 2 — 스펙 형식(경로 패턴 `specs/0NN-<short-name>/spec.md`, speckit 워크플로우 경로 specify→plan→tasks→implement)을 추가한다
- [X] T003 [US1] `docs/artifact-conventions.md`에 섹션 3 — GitHub 이슈 형식(필수 섹션: `## 배경`, `## 범위` In/Out, `## 완료 기준 (DoD)`; 선택 섹션: `## 의존성`)을 추가한다
- [X] T004 [US1] `docs/artifact-conventions.md`에 섹션 4 — 커밋 메시지 규칙(Tier 1: `[Issue #N] <설명>`, Tier 2: Conventional Commits 허용 타입 표 feat/fix/hotfix/docs/chore/refactor/test/style/perf/ci, `Co-Authored-By:` 금지)을 추가한다
- [X] T005 [US1] `docs/artifact-conventions.md`에 섹션 5 — PR 형식(제목: `[Issue #N] <설명>`, 필수 섹션: `## Summary`, `## Test plan`, 링크 키워드; Closes #N/Part of #N/Refs #N 사용 규칙; 선택 섹션: `## Changes`)을 추가한다
- [X] T006 [US1] `docs/agent-guidelines.md`의 `## Code Style` 섹션 아래에 `## Artifact Conventions` 섹션을 추가하고 `docs/artifact-conventions.md` 링크 참조를 기재한다 (FR-008, FR-009)

**Checkpoint**: 이 시점에서 US1·US2가 독립적으로 검증 가능하다 — `docs/artifact-conventions.md` 섹션 1~5 존재, `docs/agent-guidelines.md` 참조 확인.

---

## Phase 4: US3 — 코드 품질 기준 (Priority: P2)

**Goal**: 공통 정책 문서에 코드 품질 4-axis 기준을 추가해 에이전트가 코드 생성 시 참조할 수 있게 한다.

**Independent Test**: `docs/artifact-conventions.md`에 섹션 6이 존재하고, 가독성·예측 가능성·응집도·결합도&성능 4개 항목을 모두 포함하는지 확인한다.

### Implementation for US3

- [X] T007 [US3] `docs/artifact-conventions.md`에 섹션 6 — 코드 품질 기준(가독성: 단일 책임·의도 드러내는 이름·매직 넘버 금지; 예측 가능성: 프로젝트 관용구 우선·사이드이펙트 최소화; 응집도: 관련 로직 한 곳 집중; 결합도&기본 성능: 의존성 단방향·순환 금지·N+1/무한루프/메모리누수 금지)을 추가한다

**Checkpoint**: 이 시점에서 US3 독립 검증 가능 — 섹션 6 4개 항목 전부 존재 확인.

---

## Phase 5: US4 — hotfix 예외 흐름 (Priority: P3)

**Goal**: 긴급 수정 시 표준 워크플로우를 일부 생략할 수 있는 hotfix 예외 흐름과 최소 필수 항목을 정의한다.

**Independent Test**: `docs/artifact-conventions.md`에 섹션 7이 존재하고, hotfix 정의·커밋 타입(`hotfix:`)·최소 필수 항목·생략 가능 항목이 명시되는지 확인한다.

### Implementation for US4

- [X] T008 [US4] `docs/artifact-conventions.md`에 섹션 7 — hotfix 예외 흐름(정의: spec/plan/tasks 사이클 없이 즉각 수정; 커밋: `hotfix:` 또는 `fix:`, 이슈 있으면 `Refs #N` 권장; PR: `## Summary` 한 줄 이상 + `## Test plan` 한 줄 이상; 생략 가능: spec.md·plan.md·tasks.md·`Closes #N`)을 추가한다

**Checkpoint**: 이 시점에서 US1~US4 모두 독립 검증 가능. `docs/artifact-conventions.md` 7개 섹션 완성.

---

## Phase 6: Polish & 검증

**Purpose**: 완성된 문서의 완전성 확인, 중복 기술 없음 검증, 빌드 이상 없음 확인

- [X] T009`docs/artifact-conventions.md`를 열고 7개 섹션(번호 정렬·스펙·이슈·커밋·PR·코드 품질·hotfix) 전부 존재하며 FR-001~FR-007 요구사항을 충족하는지 자기검증한다
- [X] T010 [P] `CLAUDE.md`와 `AGENTS.md`를 확인해 공통 정책 문서 규칙이 중복 기술되지 않고 참조만 사용하는지 검증한다 (FR-010)
- [X] T011터미널에서 `npm run validate`를 실행해 문서 변경으로 인한 타입체크·린트·포맷 오류가 없음을 확인한다

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 3 (US1+US2, P1)**: 즉시 시작 가능 — 의존성 없음
- **Phase 4 (US3, P2)**: Phase 3 완료 후 (동일 파일 순차 작성)
- **Phase 5 (US4, P3)**: Phase 4 완료 후 (동일 파일 순차 작성)
- **Phase 6 (Polish)**: Phase 5 완료 후 전체 검증

### User Story Dependencies

- **US1 (P1)**: T002~T006 — Phase 3에서 처리, 즉시 시작 가능
- **US2 (P1)**: T001 — Phase 3 첫 번째 태스크, 즉시 시작 가능
- **US3 (P2)**: T007 — US1+US2 완료 후 (동일 파일)
- **US4 (P3)**: T008 — US3 완료 후 (동일 파일)

### Within Each Phase

- `docs/artifact-conventions.md` 작성은 섹션 순서대로 순차 실행 (같은 파일)
- T006(`docs/agent-guidelines.md`)은 T001~T005와 [P] 병렬 가능 (다른 파일)
- T010(`CLAUDE.md`, `AGENTS.md` 검증)은 T009와 [P] 병렬 가능 (읽기 전용)

### Parallel Opportunities

```bash
# Phase 3: T001~T005는 순차, T006은 병렬 실행 가능
Task(sequential): T001 → T002 → T003 → T004 → T005  # docs/artifact-conventions.md
Task(parallel):   T006                                 # docs/agent-guidelines.md

# Phase 6: T009 이후 T010과 T011은 병렬 가능
Task(sequential): T009
Task(parallel):   T010, T011
```

---

## Implementation Strategy

### MVP First (US1 + US2)

1. Phase 3 실행: T001~T006
2. **STOP and VALIDATE**: `docs/artifact-conventions.md` 섹션 1~5 존재, `docs/agent-guidelines.md` 참조 확인
3. 동일 작업 설명으로 에이전트 이슈 초안 생성 → 필수 섹션 일치 여부 확인

### Incremental Delivery

1. Phase 3 완료 → 산출물 형식 일관성 확보 (MVP)
2. Phase 4 완료 → 코드 품질 기준 추가
3. Phase 5 완료 → hotfix 예외 흐름 추가
4. Phase 6 완료 → 검증 및 빌드 확인

---

## Notes

- 이 피처는 순수 문서 변경 — 소스 코드 수정 없음
- `docs/artifact-conventions.md`의 각 섹션 내용은 `specs/042-agent-artifact-conventions/research.md`와 `data-model.md`에 상세히 정의되어 있음
- [P] 태스크: 다른 파일, 의존성 없음
- 각 Phase 체크포인트에서 독립 검증 후 다음 Phase 진행
- `npm run validate` 통과 후 커밋 (Workflow Rules 참조)
