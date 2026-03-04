# Tasks: Admin 이슈 편집/순서조정/승인·반려 (Feature 008)

**Input**: Design documents from `/specs/008-admin-issue-review/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/api.md ✅, quickstart.md ✅

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: User story label ([US1], [US2], [US3])

---

## Phase 1: Foundational (Blocking Prerequisites)

**Purpose**: 서버 레이어 분리 — `lib/admin/issues.ts` 쓰기 함수. 모든 Route Handler가 이 함수에 의존한다.

**⚠️ CRITICAL**: US1/US2 Route Handler 구현 전 반드시 완료

- [ ] T001 Create `updateIssueStatus(id, status)` in `src/lib/admin/issues.ts` — Supabase `.update({ status }).eq('id', id)`; throw on error
- [ ] T002 Add `updateIssueCards(id, cards)` in `src/lib/admin/issues.ts` — Supabase `.update({ cards_data: cards }).eq('id', id)`; throw on error

**Checkpoint**: `lib/admin/issues.ts` 완성 — Route Handler 구현 시작 가능

---

## Phase 2: User Story 1 — 이슈 승인/반려 (Priority: P1) 🎯 MVP

**Goal**: 운영자가 개별 이슈를 승인(approved) 또는 반려(rejected)로 상태 변경할 수 있다. 낙관적 업데이트로 2초 이내 UI 반영, 중복 클릭 방지.

**Independent Test**: Admin 검토 화면에서 draft 이슈의 승인 버튼을 클릭하면 상태 배지가 즉시 "승인됨"으로 바뀌고, DB에도 `approved`가 저장된다.

### Tests for User Story 1

- [ ] T003 [P] [US1] Write unit tests for `updateIssueStatus` in `tests/unit/lib/admin/issues.test.ts` — mock Supabase client; test: success updates status, DB error throws, invalid id handled
- [ ] T004 [P] [US1] Write unit tests for PATCH handler in `tests/unit/api/admin/issues-patch.test.ts` — test: no session → 401, invalid status → 400, valid status → 200 `{id, status}`, DB error → 500

### Implementation for User Story 1

- [ ] T005 [P] [US1] Create `src/components/features/admin/IssueStatusActions.tsx` — approve/reject 버튼 컴포넌트; props: `{ issueId, currentStatus, onStatusChange, disabled }`; 현재 상태에 따라 버튼 레이블/스타일 결정 (Tailwind 다크테마)
- [ ] T006 [US1] Implement PATCH handler in `src/app/api/admin/issues/[id]/route.ts` — `requireAdminSession` 선행; Zod로 `status` enum 검증; `updateIssueStatus` 호출; 200 `{id, status}` / 400 / 401 / 404 / 500 응답
- [ ] T007 [US1] Integrate `IssueStatusActions` into `src/components/features/admin/IssueListItem.tsx` — `localStatus`, `isStatusChanging` state 추가; 낙관적 업데이트 패턴 (`setLocalStatus` → fetch PATCH → 실패 시 롤백); `IssueStatusActions`를 헤더 영역에 배치

**Checkpoint**: User Story 1 독립 검증 가능 — 승인/반려 버튼 클릭 → DB 저장 → UI 반영 확인

---

## Phase 3: User Story 2 — 카드 텍스트 수정 (Priority: P2)

**Goal**: 운영자가 이슈 내 카드의 텍스트 필드(tag, title, sub/body/stat)를 인라인 편집하고 카드별로 저장할 수 있다. 필수 필드 빈값 저장 거부, 취소 시 원복.

**Independent Test**: 아코디언 열린 상태에서 카드의 title을 수정 후 저장하면 변경된 텍스트가 즉시 화면에 반영되고, DB `cards_data`가 갱신된다.

### Tests for User Story 2

- [ ] T008 [P] [US2] Write unit tests for `updateIssueCards` in `tests/unit/lib/admin/issues.test.ts` — mock Supabase; test: success updates cards_data, DB error throws
- [ ] T009 [P] [US2] Write unit tests for PUT handler in `tests/unit/api/admin/issues-put.test.ts` — test: no session → 401, invalid cards → 400 with message, valid cards → 200 `{id, cards}`, DB error → 500

### Implementation for User Story 2

- [ ] T010 [P] [US2] Create `src/components/features/admin/CardEditForm.tsx` — 카드 타입별 편집 가능 필드 렌더링 (cover: tag/title/sub; reason/bullish/bearish: tag/title/body/stat; community/stats: tag/title; source: tag); `quotes`, `items`, `sources` 내부는 읽기 전용 표시; 저장/취소 버튼; 필수 필드(title) 빈값 시 저장 거부 + 인라인 오류 메시지
- [ ] T011 [US2] Implement PUT handler in `src/app/api/admin/issues/[id]/route.ts` — `requireAdminSession` 선행; `parseCards()` 호출로 cards 배열 검증; 검증 실패 시 400 `{error: 'invalid_body', message}`; `updateIssueCards` 호출; 200 `{id, cards}` / 401 / 404 / 500
- [ ] T012 [US2] Integrate `CardEditForm` into `src/components/features/admin/IssueListItem.tsx` — `cardsState`, `editingCardId`, `cardDraft`, `isSavingCard`, `cardSaveError` state 추가; 카드 행에 편집 아이콘 추가; 편집 모드 전환 시 `CardEditForm` 표시; 저장 → PUT fetch → 성공 시 `cardsState` 갱신 + 편집 종료; 실패 시 `cardSaveError` 표시

**Checkpoint**: User Story 2 독립 검증 가능 — 카드 편집 → 저장 → DB 반영 확인

---

## Phase 4: User Story 3 — 카드 순서 조정 (Priority: P3)

**Goal**: 운영자가 카드 위/아래 이동 버튼으로 순서를 조정하고 저장하면 `cards_data` 배열 순서가 변경된다. 첫/마지막 카드 이동 버튼 비활성화.

**Independent Test**: 아코디언에서 두 번째 카드의 '위로 이동' 버튼 클릭 → 첫 번째 카드와 순서 교환 → 저장 클릭 → DB에 변경된 순서 반영.

### Implementation for User Story 3

- [ ] T013 [US3] Add card reorder UI to `src/components/features/admin/IssueListItem.tsx` — 각 카드 행에 ↑/↓ 버튼 추가; 첫 번째 카드 ↑ 비활성화, 마지막 카드 ↓ 비활성화; 클릭 시 `cardsState` 배열 내 인접 카드와 swap (즉시 UI 반영)
- [ ] T014 [US3] Wire order-change save to PUT handler in `src/components/features/admin/IssueListItem.tsx` — 순서 변경 후 나타나는 "순서 저장" 버튼; 클릭 시 현재 `cardsState` 전체를 PUT으로 전송; 성공/실패 피드백 표시

**Checkpoint**: User Story 3 독립 검증 가능 — 순서 변경 → 저장 → 페이지 재방문 시 동일 순서 확인

---

## Phase 5: Polish & Cross-Cutting Concerns

- [ ] T015 [P] Run `npm run validate` (type-check + lint + format:check) in repo root and fix all errors
- [ ] T016 [P] Run `npm run test` and verify all unit tests pass (issues.test.ts, issues-patch.test.ts, issues-put.test.ts)
- [ ] T017 Run `npm run build` to confirm production build with no errors
- [ ] T018 Commit all changes to feature branch and create GitHub PR targeting main

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Foundational)**: 즉시 시작 가능. US1/US2 Route Handler의 필수 선행.
- **Phase 2 (US1)**: T001 완료 후 시작. T003/T004/T005는 T001 완료 즉시 병렬 시작 가능.
- **Phase 3 (US2)**: T002 완료 후 시작. T008/T009/T010은 T002 완료 즉시 병렬 시작 가능. T011은 T002 필요.
- **Phase 4 (US3)**: T011 완료 후 시작 (PUT handler 재사용).
- **Phase 5 (Polish)**: 구현 완료 후 실행.

### Within Each User Story

```
US1: T001 → [T003 ∥ T004 ∥ T005] → T006 → T007
US2: T002 → [T008 ∥ T009 ∥ T010] → T011 → T012
US3: T011 완료 후 → T013 → T014
```

### Parallel Opportunities per Story

```bash
# Phase 2 (US1): T001 완료 후 동시 시작
Task T003: "Unit tests for updateIssueStatus in tests/unit/lib/admin/issues.test.ts"
Task T004: "Unit tests for PATCH handler in tests/unit/api/admin/issues-patch.test.ts"
Task T005: "IssueStatusActions component in src/components/features/admin/IssueStatusActions.tsx"

# Phase 3 (US2): T002 완료 후 동시 시작
Task T008: "Unit tests for updateIssueCards in tests/unit/lib/admin/issues.test.ts"
Task T009: "Unit tests for PUT handler in tests/unit/api/admin/issues-put.test.ts"
Task T010: "CardEditForm component in src/components/features/admin/CardEditForm.tsx"
```

---

## Implementation Strategy

### MVP (User Story 1 Only)

1. Complete Phase 1 (Foundational): T001, T002
2. Complete Phase 2 (US1): T003–T007
3. **VALIDATE**: 승인/반려 기능 단독 동작 확인
4. 필요 시 여기서 배포 — 편집 없이 검수 워크플로우 가동 가능

### Incremental Delivery

1. Foundation (T001–T002) → US1 (T003–T007) → **MVP 데모 가능**
2. US2 (T008–T012) → 카드 텍스트 편집 기능 추가
3. US3 (T013–T014) → 카드 순서 조정 기능 추가
4. Polish (T015–T018) → 품질 게이트 통과 후 PR

---

## Summary

| Phase | Tasks | User Story | Parallel? |
|-------|-------|-----------|-----------|
| Phase 1: Foundational | T001–T002 | — | Sequential (same file) |
| Phase 2: US1 P1 | T003–T007 | US1 | T003/T004/T005 parallel |
| Phase 3: US2 P2 | T008–T012 | US2 | T008/T009/T010 parallel |
| Phase 4: US3 P3 | T013–T014 | US3 | Sequential |
| Phase 5: Polish | T015–T018 | — | T015/T016 parallel |

**Total tasks**: 18
**Per user story**: US1=5, US2=5, US3=2
**MVP scope**: Phase 1 + Phase 2 (T001–T007, 7 tasks)
