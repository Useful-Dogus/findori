# Tasks: 에이전트 지침 통합 관리

**Input**: Design documents from `specs/036-unified-agent-context/`
**Prerequisites**: plan.md ✓, spec.md ✓, research.md ✓, quickstart.md ✓

**Organization**: US1(P1) — 단일 문서 공통 지침 관리 / US2(P2) — 에이전트별 전용 설정 유지

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 병렬 실행 가능 (다른 파일, 의존성 없음)
- **[Story]**: 해당 태스크가 속한 유저 스토리 (US1, US2)

---

## Phase 1: Setup

**Purpose**: `docs/agent-guidelines.md` 신규 파일 생성 및 기본 구조 준비

- [x] T001 Create `docs/` directory at repo root
- [x] T002 Create `docs/agent-guidelines.md` with skeleton sections: `# findori — Agent Guidelines`, `## Active Technologies`, `## Project Structure`, `## Commands`, `## Code Style`, `<!-- MANUAL ADDITIONS START -->`, `<!-- MANUAL ADDITIONS END -->`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: 현재 CLAUDE.md(최신 상태)의 공통 지침 내용을 `docs/agent-guidelines.md`에 이전 — 이후 모든 작업의 전제조건

**⚠️ CRITICAL**: Phase 2 완료 전까지 US1/US2 작업 불가

- [x] T003 Populate `docs/agent-guidelines.md` with shared content from CLAUDE.md: copy Active Technologies, Project Structure, Commands, Code Style sections, and MANUAL ADDITIONS markers

**Checkpoint**: `docs/agent-guidelines.md`에 현재 프로젝트 공통 지침 전체가 담겨 있어야 함

---

## Phase 3: User Story 1 — 단일 문서 공통 지침 관리 (Priority: P1) 🎯 MVP

**Goal**: `docs/agent-guidelines.md` 한 곳만 수정하면 Claude와 Codex 모두 최신 지침을 갖는 상태

**Independent Test**: `docs/agent-guidelines.md`를 수정 후 Claude 세션에서 변경 내용이 반영되고, `.specify/scripts/bash/update-agent-context.sh codex` 실행 후 AGENTS.md에도 동일 내용이 반영되면 통과

### Implementation for User Story 1

- [x] T004 [US1] Rewrite `CLAUDE.md` to slim structure: title → `@docs/agent-guidelines.md` import line → Claude-specific placeholder section
  - 구조 예시:
    ```
    # findori — Claude Code Guidelines
    @docs/agent-guidelines.md
    <!-- CLAUDE-SPECIFIC START -->
    <!-- CLAUDE-SPECIFIC END -->
    ```
- [x] T005 [US1] Rewrite `AGENTS.md` to auto-generated structure: title → auto-generation notice → `<!-- AUTO-GENERATED START -->` block with content copied from `docs/agent-guidelines.md` → `<!-- AUTO-GENERATED END -->` → Codex-specific placeholder section
  - 구조 예시:
    ```
    # findori — Codex Agent Guidelines
    <!-- AUTO-GENERATED FROM docs/agent-guidelines.md — DO NOT EDIT DIRECTLY -->
    <!-- Run: .specify/scripts/bash/update-agent-context.sh codex to regenerate -->
    <!-- AUTO-GENERATED START -->
    [docs/agent-guidelines.md 내용 복사]
    <!-- AUTO-GENERATED END -->
    <!-- CODEX-SPECIFIC START -->
    <!-- CODEX-SPECIFIC END -->
    ```

**Checkpoint**: CLAUDE.md는 @import 방식, AGENTS.md는 공통 내용 직접 포함 방식으로 변경 완료

---

## Phase 4: User Story 2 — 에이전트별 전용 설정 유지 (Priority: P2)

**Goal**: 공통 지침과 에이전트 전용 설정이 명확히 구분되고, speckit 스크립트가 공통 문서 기준으로 동기화

**Independent Test**: `update-agent-context.sh claude` 실행 후 CLAUDE.md의 @import 라인과 CLAUDE-SPECIFIC 섹션이 보존되고, `update-agent-context.sh codex` 실행 후 AGENTS.md의 AUTO-GENERATED 블록만 갱신되며 CODEX-SPECIFIC 섹션이 보존되면 통과

### Implementation for User Story 2

- [x] T006 [US2] Update `update-agent-context.sh`: `update_existing_agent_file()` 함수에서 CLAUDE.md 처리 시 기존 `## Active Technologies` / `## Recent Changes` 섹션 직접 수정 대신 `docs/agent-guidelines.md`에 변경 내용 기록하도록 수정. CLAUDE.md에 `@docs/agent-guidelines.md` 라인이 없으면 추가 (있으면 유지)
- [x] T007 [US2] Update `update-agent-context.sh`: AGENTS.md(codex/opencode/amp/q/bob 처리) 시 `<!-- AUTO-GENERATED START -->` ~ `<!-- AUTO-GENERATED END -->` 블록 내용을 `docs/agent-guidelines.md` 내용으로 교체하도록 수정. `<!-- CODEX-SPECIFIC -->` 섹션은 보존
- [x] T008 [US2] Update `update-agent-context.sh`: `create_new_agent_file()` 함수에서 신규 CLAUDE.md 생성 시 @import 구조로 생성하도록 수정 (템플릿 대신 @import 방식)
- [x] T009 [P] [US2] Verify `docs/agent-guidelines.md` is NOT excluded in `.gitignore` (should be tracked by git)
- [x] T010 [P] [US2] Verify `CLAUDE.md` and `AGENTS.md` remain in `.gitignore` (should NOT be tracked — local auto-generated files)

**Checkpoint**: `update-agent-context.sh` 실행 시 `docs/agent-guidelines.md`가 갱신되고, CLAUDE.md/@import 구조와 AGENTS.md/AUTO-GENERATED 구조가 유지됨

---

## Phase 5: Polish & 검증

**Purpose**: 전체 플로우 검증 및 문서 정리

- [x] T011 Run `.specify/scripts/bash/update-agent-context.sh claude` and verify CLAUDE.md retains @import line and CLAUDE-SPECIFIC markers
- [x] T012 Run `.specify/scripts/bash/update-agent-context.sh codex` and verify AGENTS.md AUTO-GENERATED block is updated from `docs/agent-guidelines.md` while CODEX-SPECIFIC section is preserved
- [x] T013 [P] Update `specs/036-unified-agent-context/quickstart.md` if maintenance instructions changed during implementation

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: 즉시 시작 가능
- **Foundational (Phase 2)**: Phase 1 완료 후 — 이후 모든 Phase의 전제조건
- **US1 (Phase 3)**: Phase 2 완료 후 시작 (T004, T005 병렬 실행 가능)
- **US2 (Phase 4)**: Phase 3 완료 후 시작 (T006, T007, T008 순차, T009/T010 병렬)
- **Polish (Phase 5)**: Phase 4 완료 후

### Within Each Story

- T004, T005 (US1): 서로 다른 파일 — 병렬 가능
- T006, T007, T008 (US2): 같은 스크립트 파일 수정 — 순차 실행
- T009, T010 (US2): 서로 다른 검증 — 병렬 가능

---

## Parallel Example: User Story 1

```bash
# T004, T005는 다른 파일을 수정하므로 병렬 실행 가능
Task: "Rewrite CLAUDE.md to @import structure in CLAUDE.md"
Task: "Rewrite AGENTS.md to AUTO-GENERATED structure in AGENTS.md"
```

---

## Implementation Strategy

### MVP (User Story 1만)

1. Phase 1: docs/ 디렉터리 + agent-guidelines.md 생성
2. Phase 2: 현재 CLAUDE.md에서 내용 이전
3. Phase 3: CLAUDE.md(@import) + AGENTS.md(공통 내용 직접 포함) 재작성
4. **STOP and VALIDATE**: Claude 세션에서 @import 동작 확인, Codex에서 AGENTS.md 내용 확인

### Full Delivery (US1 + US2)

5. Phase 4: `update-agent-context.sh` 수정 → 이후 speckit plan 실행 시 자동 동기화
6. Phase 5: 전체 검증

---

## Notes

- `docs/agent-guidelines.md`는 git 추적 대상 (팀 공유 문서)
- `CLAUDE.md`, `AGENTS.md`는 현행 .gitignore 정책 유지 (로컬 자동생성 파일)
- CLAUDE.md의 @import는 파일 경로 기준: CLAUDE.md가 repo root에 있으므로 `@docs/agent-guidelines.md`
- update-agent-context.sh 수정 시 `<!-- MANUAL ADDITIONS START/END -->`, `<!-- CLAUDE-SPECIFIC START/END -->`, `<!-- CODEX-SPECIFIC START/END -->` 마커 모두 보존 필수
