# Tasks: Admin 피드 목록/날짜별 이슈 검토 화면

**Input**: `specs/007-admin-feed-review/`
**Branch**: `007-admin-feed-review`
**Spec**: [spec.md](spec.md) | **Plan**: [plan.md](plan.md)

**Organization**: User story 기준 구성. 각 스토리를 독립적으로 구현·테스트 가능.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: 병렬 실행 가능 (다른 파일, 미완료 태스크에 미의존)
- **[Story]**: 해당 태스크가 속한 유저 스토리 (US1, US2, US3)
- 스토리 레이블 없음 = Setup 또는 Foundational 단계

---

## Phase 1: Setup & Foundational (공통 선행 작업)

**Purpose**: 두 P1 스토리가 공통으로 필요로 하는 데이터 접근 함수와 공유 컴포넌트 구현

**⚠️ CRITICAL**: 이 Phase 완료 전에 어떤 유저 스토리도 시작할 수 없음

- [ ] T001 `src/lib/admin/feeds.ts` 신규 파일 생성 — `AdminFeedSummary`, `AdminIssueSummary` 타입 정의 및 `getAdminFeeds()` 구현 (`feeds` 테이블 + `issues(count)` 집계 쿼리, limit 30, DESC)
- [ ] T002 [P] `src/lib/admin/feeds.ts`에 `getAdminFeedByDate(date: string)` 구현 — `feeds` + `issues` 순차 조회, `parseCards()` 호출로 `cardsData`/`cardsParseError` 매핑 (`src/lib/cards.ts` 재사용)
- [ ] T003 [P] `src/components/features/admin/StatusBadge.tsx` 신규 생성 — `draft`(gray), `published`(blue), `approved`(green), `rejected`(red) 상태별 Tailwind CSS v4 배지 컴포넌트 (Server Component)

**Checkpoint**: 데이터 접근 함수와 공유 컴포넌트 준비 완료 → 두 P1 스토리 병렬 시작 가능

---

## Phase 2: User Story 1 — 피드 목록 화면 (Priority: P1) 🎯 MVP

**Goal**: 운영자가 `/admin`에서 날짜별 피드 목록을 확인하고 이슈 검토 화면으로 이동할 수 있다.

**Independent Test**: 인증된 운영자가 `/admin` 접근 → 피드 목록 렌더링 (날짜 DESC 정렬) → 항목 클릭 → `/admin/feed/[date]` 이동 성공

### Tests for User Story 1

- [ ] T004 [P] [US1] `tests/unit/lib/admin-feeds.test.ts` 작성 — `getAdminFeeds()` 단위 테스트: Supabase 모킹, 데이터 매핑 검증, 빈 목록 반환, DB 오류 처리

### Implementation for User Story 1

- [ ] T005 [US1] `src/app/api/admin/feeds/route.ts` 구현 — `requireAdminSession` 유지, `getAdminFeeds()` 호출, `{ feeds: AdminFeedSummary[] }` JSON 반환, 500 오류 처리
- [ ] T006 [P] [US1] `src/components/features/admin/FeedListItem.tsx` 신규 생성 — 날짜, `StatusBadge`, 이슈 수, `/admin/feed/[date]` 링크 (Server Component)
- [ ] T007 [US1] `src/components/features/admin/FeedList.tsx` 신규 생성 — `FeedListItem` 목록 렌더링, 빈 상태 안내 메시지 (Server Component)
- [ ] T008 [US1] `src/app/(admin)/admin/page.tsx` 구현 — Server Component, `getAdminFeeds()` 직접 호출 (API 경유 없음), `FeedList` 렌더링, 오류 상태 표시
- [ ] T009 [P] [US1] `src/app/(admin)/layout.tsx` 내비게이션 추가 — 현재 경로 표시 + 로그아웃 버튼 (TODO(#7) 제거)

**Checkpoint**: `/admin` 피드 목록 화면 독립 동작 — US1 완료

---

## Phase 3: User Story 2 — 날짜별 이슈 검토 화면 (Priority: P1)

**Goal**: 운영자가 `/admin/feed/[date]`에서 이슈 목록과 카드 미리보기(accordion)를 확인할 수 있다.

**Independent Test**: 인증된 운영자가 `/admin/feed/2026-03-03` 접근 → 이슈 목록 표시 → 이슈 선택 → 카드 타입/제목/텍스트 미리보기 펼침 성공

### Tests for User Story 2

- [ ] T010 [P] [US2] `tests/unit/lib/admin-feeds.test.ts` 보완 — `getAdminFeedByDate()` 단위 테스트: 피드 존재/미존재, `parseCards` 성공/실패 케이스, `cardsParseError: true` 매핑

### Implementation for User Story 2

- [ ] T011 [US2] `src/app/api/admin/feeds/[date]/route.ts` 구현 — `requireAdminSession`, `isValidDate()` 검증 → 400, `getAdminFeedByDate()` 호출, `{ date, feed, issues }` JSON 반환, 500 처리
- [ ] T012 [P] [US2] `src/components/features/admin/IssueListItem.tsx` 신규 생성 — `'use client'`, `useState` accordion 토글, 카드 타입·제목·핵심 텍스트 미리보기, `cardsParseError: true` 시 오류 안내 (Client Component)
- [ ] T013 [US2] `src/components/features/admin/IssueList.tsx` 신규 생성 — `IssueListItem` 목록 렌더링, 빈 상태 안내 메시지 (Server Component)
- [ ] T014 [US2] `src/app/(admin)/admin/feed/[date]/page.tsx` 구현 — Server Component, `isValidDate()` 검증 → 안내 UI + `/admin` 링크, `getAdminFeedByDate()` 직접 호출, `IssueList` 렌더링, 피드 없음/오류 상태 처리

**Checkpoint**: `/admin/feed/[date]` 이슈 검토 화면 독립 동작 — US2 완료

---

## Phase 4: User Story 3 — 상태 배지 표시 검증 (Priority: P2)

**Goal**: 운영자가 피드와 이슈 목록에서 모든 상태값의 배지를 정확하게 확인할 수 있다.

**Independent Test**: 5가지 상태(`draft`, `published`, `approved`, `rejected`) 각각에 대해 `StatusBadge` 렌더링 결과가 지정 색상·레이블과 일치

### Tests for User Story 3

- [ ] T015 [P] [US3] `tests/unit/components/StatusBadge.test.tsx` 신규 작성 — 5개 상태별 렌더링 결과(텍스트, CSS 클래스) 검증
- [ ] T016 [P] [US3] `tests/unit/components/IssueCardPreview.test.tsx` 신규 작성 — `IssueListItem` accordion 열기/닫기, `cardsParseError: true` 오류 안내 렌더링 검증

**Checkpoint**: 배지 및 미리보기 컴포넌트 단위 테스트 통과 — US3 완료

---

## Phase 5: Polish & Integration

**Purpose**: 통합 테스트 + 품질 게이트 통과

- [ ] T017 `tests/integration/admin-feed-review.test.ts` 신규 작성 — 피드 목록 조회 → 날짜별 이슈 조회 흐름 통합 테스트 (API 라우트 레벨 모킹)
- [ ] T018 [P] `npm run validate` 실행 — type-check + lint + format 오류 전체 수정
- [ ] T019 `npm run test` 실행 — 전체 테스트 통과 확인, 실패 시 수정 후 재실행

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup & Foundational)**: 즉시 시작 가능 — T001/T002/T003 병렬 실행
- **Phase 2 (US1)**: Phase 1 완료 후 시작 — T004~T009
- **Phase 3 (US2)**: Phase 1 완료 후 시작 (Phase 2와 병렬 가능) — T010~T014
- **Phase 4 (US3)**: Phase 1 완료 후 시작 — T015/T016 병렬 실행
- **Phase 5 (Polish)**: Phase 2+3+4 모두 완료 후 — T017~T019

### User Story Dependencies

- **US1 (Phase 2)**: Phase 1 완료 필수 — US2와 독립
- **US2 (Phase 3)**: Phase 1 완료 필수 — US1과 독립
- **US3 (Phase 4)**: Phase 1 완료 필수 — T003(StatusBadge) 완료 필수

### Within Each User Story

- 테스트 태스크 → 구현 전 작성 (TDD)
- API 라우트 → 데이터 접근 함수(lib/admin/feeds.ts) 완료 후
- List 컴포넌트 → Item 컴포넌트 완료 후
- Page → List 컴포넌트 + API 라우트 완료 후

### Parallel Opportunities

**Phase 1 병렬**:
- T001 + T002 + T003 — 모두 다른 파일

**Phase 2 + Phase 3 병렬** (Phase 1 완료 후):
- US1(T004~T009)과 US2(T010~T014) 동시 진행 가능

**Phase 4 병렬**:
- T015 + T016 — 다른 파일

---

## Parallel Example: Phase 1

```bash
# T001, T002, T003 동시 실행 가능:
Task: "getAdminFeeds() 구현 in src/lib/admin/feeds.ts"
Task: "getAdminFeedByDate() 구현 in src/lib/admin/feeds.ts"   # 같은 파일이므로 순차 권장
Task: "StatusBadge.tsx 생성 in src/components/features/admin/StatusBadge.tsx"
```

```bash
# Phase 1 완료 후 US1 + US2 동시 실행 가능:
Task: "US1: GET /api/admin/feeds 구현"
Task: "US2: IssueListItem.tsx Client Component 구현"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only — Phase 1~2)

1. Phase 1 완료: `lib/admin/feeds.ts` + `StatusBadge.tsx`
2. Phase 2 완료: `/admin` 피드 목록 화면 + AdminLayout 내비게이션
3. **STOP and VALIDATE**: `/admin` 접근 → 피드 목록 확인 → `/admin/feed/[date]` 이동 (이슈 화면은 stub)
4. MVP 확인 후 Phase 3 진행

### Incremental Delivery

1. Phase 1 완료 → 데이터 레이어 준비
2. Phase 2 완료 → 피드 목록 화면 동작 (MVP!)
3. Phase 3 완료 → 이슈 검토 + 카드 미리보기 동작
4. Phase 4 완료 → 상태 배지 전 상태 검증
5. Phase 5 완료 → 통합 테스트 + 품질 게이트 통과

---

## Notes

- **[P]**: 다른 파일을 편집하며 미완료 태스크에 의존하지 않는 태스크
- **[Story]**: 해당 유저 스토리와 연결된 태스크
- Server Component 기본, 인터랙션 필요 시만 `'use client'` 추가 (IssueListItem만 해당)
- Admin 페이지는 Server Component에서 Supabase 직접 호출 (API 경유 없음)
- API 라우트 stub 구현도 포함 (향후 클라이언트 재검증용)
- `npm run validate` 통과 후에만 커밋
