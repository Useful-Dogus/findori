# Tasks: 카드 중심 피드 리디자인

**Input**: Design documents from `/specs/117-card-centric-feed/`
**Prerequisites**: plan.md ✓, spec.md ✓, research.md ✓, data-model.md ✓, quickstart.md ✓

**변경 대상 파일**: `src/components/features/feed/FeedView.tsx` (유일한 변경 파일)

---

## Phase 1: Setup

**Purpose**: 브랜치 확인 및 기존 코드 파악

- [x] T001 `117-card-centric-feed` 브랜치 확인 및 최신 상태 점검 (git status)

---

## Phase 2: User Story 1 — 카드가 화면을 지배하는 레이아웃 (Priority: P1) 🎯 MVP

**Goal**: 이슈 섹션 컨테이너 박스 제거, 카드 스택이 풀 폭으로 화면을 지배

**Independent Test**: 피드 페이지에서 이슈 섹션에 border/rounded/backdrop-blur 박스가 사라지고 카드 스택이 뷰포트 너비의 90% 이상을 차지하는지 확인

- [x] T002 [US1] `src/components/features/feed/FeedView.tsx` — `<main>` 컨테이너를 `flex flex-col items-center gap-12 sm:gap-16 px-4 sm:px-6 py-6` 구조로 변경
- [x] T003 [US1] `src/components/features/feed/FeedView.tsx` — 각 이슈 `<section>`에서 `rounded-[32px] border bg-white/3 p-4 shadow-... backdrop-blur-sm` 제거, `w-full max-w-2xl` 적용
- [x] T004 [US1] `src/components/features/feed/FeedView.tsx` — 이슈 섹션 내 헤더 div(`mb-4 flex items-start justify-between`) 전체 제거 (entityType 배지, changeValue 배지, FeedShareButton 포함)

**Checkpoint**: 카드 스택이 컨테이너 박스 없이 풀 폭으로 표시됨. 제목·메타 정보가 아직 없어도 됨.

---

## Phase 3: User Story 2 — 캡션 영역의 정보 계층 정리 (Priority: P2)

**Goal**: 카드 아래 캡션 영역에 모든 메타 정보를 작고 가볍게 통합

**Independent Test**: 카드 아래 캡션에 entityName(소), title(중), changeValue/entityType(소), 공유버튼(우)이 표시되고 카드보다 시각적으로 약함

- [x] T005 [US2] `src/components/features/feed/FeedView.tsx` — 기존 `<div className="mt-4 space-y-2">` 푸터 영역을 캡션 구조로 교체: `flex items-start justify-between gap-3 mt-3 px-1`
- [x] T006 [US2] `src/components/features/feed/FeedView.tsx` — 캡션 좌측: entityName(`text-xs sm:text-sm text-muted`), title(`text-sm sm:text-base font-medium leading-snug break-keep mt-1`), 메타 행(changeValue + entityType badge, `text-xs sm:text-sm mt-1.5`)
- [x] T007 [US2] `src/components/features/feed/FeedView.tsx` — 캡션 우측: `FeedShareButton` 배치 (`shrink-0 mt-0.5`)
- [x] T008 [US2] `src/components/features/feed/FeedView.tsx` — `initialIssueId` 강조 링크: `ring` 클래스를 FeedCardStack 감싸는 wrapper div에 이동

**Checkpoint**: 캡션 영역에 모든 메타 정보가 통합되고 공유 버튼이 우측에 배치됨

---

## Phase 4: User Story 3 — 이슈 간 스크롤 흐름 개선 (Priority: P2)

**Goal**: 이슈 간 여백만으로 구분, 카드 피드 느낌 완성

**Independent Test**: 두 이슈 이상 스크롤 시 border 박스 없이 수직 여백으로만 구분되고 카드 피드처럼 흐름

- [x] T009 [US3] `src/components/features/feed/FeedView.tsx` — Phase 2(T002)에서 설정한 `gap-12 sm:gap-16` 값 검토 및 피드 스크롤 흐름 최종 조정 (구분선 없음 확인)

**Checkpoint**: 모든 3개 User Story 구현 완료. 피드가 카드 중심으로 재편됨.

---

## Phase 5: Polish & 품질 게이트

- [x] T010 `npx tsc --noEmit` — 타입 에러 없음 확인
- [x] T011 `npm run lint` — 린트 통과 확인
- [x] T012 `npm run test` — 기존 vitest 테스트 전체 통과 확인 (235/235)
- [x] T013 `npm run build` — 프로덕션 빌드 성공 확인

---

## Dependencies & Execution Order

- Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5 (순차적)
- T002, T003, T004 (Phase 2): 동일 파일이므로 순차
- T005-T008 (Phase 3): 동일 파일, 순차
- T010-T013 (Phase 5): 독립적으로 [P] 실행 가능

## MVP Scope

Phase 2(US1)만으로도 카드 중심 레이아웃의 핵심 변화가 완성됨. 필요 시 Phase 2 완료 후 검토.
