# Tasks: 공개 라우팅/SSR 진입 플로우

**Input**: Design documents from `/specs/016-public-routing-ssr/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅

**Organization**: 3개 User Story 모두 P1. Foundational 공유 컴포넌트 완료 후 각 라우트를 독립적으로 구현 가능.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 다른 파일, 의존성 없음 → 병렬 실행 가능
- **[Story]**: User Story 매핑 (US1/US2/US3)

---

## Phase 1: Setup (단위 테스트)

**Purpose**: 기존 `isValidDate` 함수의 단위 테스트 선작성 (구현은 이미 완료)

- [x] T001 Write unit tests for `isValidDate` in `tests/unit/public/isValidDate.test.ts` — 유효 날짜, 잘못된 형식, 실존하지 않는 날짜(2026-02-30), 경계값 케이스 포함

---

## Phase 2: Foundational (공유 UI 컴포넌트)

**Purpose**: 모든 공개 라우트에서 공통으로 사용하는 상태 컴포넌트와 FeedView stub. 이 Phase가 완료되어야 US1~US3 구현이 가능하다.

**⚠️ CRITICAL**: 이 Phase 완료 전에는 어느 User Story도 시작할 수 없다.

- [x] T002 [P] Create `FeedEmptyState` component in `src/components/features/feed/FeedEmptyState.tsx` — props: `{ date?: string }`, 빈 상태 메시지 + 홈 링크(`/`) CTA 포함
- [x] T003 [P] Create `FeedErrorState` component in `src/components/features/feed/FeedErrorState.tsx` — props 없음, 에러 안내 메시지 + 새로고침 버튼 + 홈 링크 CTA 포함
- [x] T004 Create `FeedView` client component stub in `src/components/features/feed/FeedView.tsx` — `'use client'`, props: `{ date: string; issues: PublicIssueSummary[]; initialIssueId?: string }`, 이슈 목록 타이틀 수준의 최소 렌더링 (카드 렌더링은 #17/#18에서 구현)

**Checkpoint**: T001~T004 완료 → 모든 User Story 구현 시작 가능

---

## Phase 3: User Story 1 - 홈 접근 시 오늘 피드로 자동 이동 (Priority: P1) 🎯

**Goal**: `/` 및 `/feed/latest` 접근 시 최신 발행 날짜로 서버 리다이렉트

**Independent Test**: 브라우저에서 `/` 접근 → `/feed/YYYY-MM-DD` URL로 이동하는지 확인. 발행 피드 없을 때 빈 상태 UI 노출 확인.

- [x] T005 [US1] Implement root page SSR redirect in `src/app/page.tsx` — `getLatestPublishedDate()` 서버 호출: 날짜 있으면 `redirect('/feed/[date]')`, null이면 `FeedEmptyState` 반환, 예외 시 `FeedErrorState` 반환. 기존 `/feed/latest` redirect 코드 교체.
- [x] T006 [P] [US1] Create `/feed/latest` route in `src/app/(public)/feed/latest/page.tsx` — `getLatestPublishedDate()` 호출 후 실제 날짜로 `redirect`. 루트 페이지와 동일한 로직. `generateMetadata` 불필요(redirect 페이지).

**Checkpoint**: US1 완료 → 홈 진입 플로우 독립 검증 가능

---

## Phase 4: User Story 2 - 날짜별 피드 SSR 로드 (Priority: P1)

**Goal**: `/feed/[date]` SSR로 이슈 목록 데이터를 사전 로드하고 FeedView에 전달

**Independent Test**: `/feed/2026-03-19` 직접 접근 → HTTP 200 + 이슈 데이터 포함 HTML 응답 확인. HTML 소스에서 이슈 제목 텍스트 포함 여부 확인.

- [x] T007 [US2] Implement `/feed/[date]` SSR page in `src/app/(public)/feed/[date]/page.tsx` — (1) `isValidDate(date)` 실패 시 `notFound()`, (2) `getPublicFeedByDate(date)` 호출: feed null → `FeedEmptyState date={date}`, 예외 → `FeedErrorState`, 성공 → `FeedView` 렌더링. `generateMetadata` export 추가: `title`, `og:title`(날짜 포함), `og:description`, `og:url`, `og:image`(`/og-default.png`). 기존 stub 교체.
- [x] T008 [P] [US2] Create loading skeleton in `src/app/(public)/feed/[date]/loading.tsx` — 텍스트 placeholder 수준 스켈레톤 UI (Next.js Suspense boundary 자동 활성화)

**Checkpoint**: US2 완료 → 날짜별 피드 SSR 독립 검증 가능

---

## Phase 5: User Story 3 - 공유 링크 직접 진입 (Priority: P1)

**Goal**: `/feed/[date]/issue/[id]` SSR로 특정 이슈를 사전 로드하고 `initialIssueId` 포함 FeedView에 전달

**Independent Test**: 유효한 이슈 공유 링크 직접 접근 → HTTP 200 + 이슈 데이터 포함 HTML 응답. `og:title`에 이슈 제목 포함 확인.

- [x] T009 [US3] Implement `/feed/[date]/issue/[id]` SSR page in `src/app/(public)/feed/[date]/issue/[id]/page.tsx` — (1) `isValidDate(date)` 실패 시 `notFound()`, (2) `getPublicIssueById(id)` null → `notFound()`, (3) `issue.feedDate !== date` → `notFound()`, (4) `getPublicFeedByDate(date)` 호출: 예외 → `FeedErrorState`, 성공 → `FeedView initialIssueId={id}` 렌더링. `generateMetadata` export: `title`(이슈 제목), `og:title`, `og:description`(entityName + changeValue + 날짜), `og:url`, `og:image`(`/og-default.png`). 기존 stub 교체.
- [x] T010 [P] [US3] Create loading skeleton in `src/app/(public)/feed/[date]/issue/[id]/loading.tsx` — T008과 동일한 스켈레톤 패턴

**Checkpoint**: US3 완료 → 공유 링크 비로그인 진입 독립 검증 가능

---

## Phase 6: Polish & 품질 게이트

**Purpose**: 전체 구현 검증

- [x] T011 Run quality gate: `npm run validate` (typecheck + lint + format:check) → `npm run test` (Vitest) → `npm run build` — 모든 체크 통과 확인

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: 즉시 시작 가능
- **Foundational (Phase 2)**: Phase 1과 병렬 시작 가능 (별개 파일). US1~US3 모두 BLOCK.
- **US1~US3 (Phase 3~5)**: Phase 2 완료 후 병렬 진행 가능 (각기 다른 파일)
- **Polish (Phase 6)**: Phase 3~5 완료 후

### User Story Dependencies

- **US1**: Phase 2 완료 후 독립 시작 가능
- **US2**: Phase 2 완료 후 독립 시작 가능 (US1과 무관)
- **US3**: Phase 2 완료 후 독립 시작 가능 (US1, US2와 무관. 단, `getPublicFeedByDate`도 호출하므로 US2의 SSR 패턴 참고 권장)

### Within Each User Story

- 각 Phase 내 [P] 태그 작업은 병렬 실행 가능
- T007 (US2 페이지)과 T008 (US2 loading) → 병렬
- T009 (US3 페이지)과 T010 (US3 loading) → 병렬

### Parallel Opportunities

- T002, T003 (Foundational 상태 컴포넌트) → 병렬
- T005 (루트 페이지)와 T006 (/feed/latest) → 병렬
- T007 (US2 페이지)와 T008 (US2 loading) → 병렬
- T009 (US3 페이지)와 T010 (US3 loading) → 병렬
- Phase 3, Phase 4, Phase 5 전체 → Phase 2 완료 후 병렬

---

## Parallel Example: Phase 2 (Foundational)

```bash
# T002와 T003 동시 실행:
Task: "Create FeedEmptyState in src/components/features/feed/FeedEmptyState.tsx"
Task: "Create FeedErrorState in src/components/features/feed/FeedErrorState.tsx"
# T002, T003 완료 후:
Task: "Create FeedView stub in src/components/features/feed/FeedView.tsx"
```

## Parallel Example: Phase 4 (US2)

```bash
# T007와 T008 동시 실행:
Task: "Implement /feed/[date] SSR page in src/app/(public)/feed/[date]/page.tsx"
Task: "Create loading skeleton in src/app/(public)/feed/[date]/loading.tsx"
```

---

## Implementation Strategy

### MVP First (단일 라우트 검증)

1. Phase 1 + Phase 2 완료 (Setup + Foundational)
2. Phase 3 (US1: 홈 리다이렉트) 완료
3. **STOP & VALIDATE**: `/` 접근 → 최신 날짜로 리다이렉트 확인
4. Phase 4 (US2: 날짜별 피드 SSR) 완료
5. **STOP & VALIDATE**: `/feed/[date]` SSR 데이터 확인
6. Phase 5 (US3: 공유 링크 진입) 완료
7. Phase 6 (품질 게이트)

### 전체 병렬 전략

Phase 2 완료 후 US1~US3 동시 구현 가능:
- 개발자 A: US1 (T005, T006)
- 개발자 B: US2 (T007, T008)
- 개발자 C: US3 (T009, T010)

---

## Summary

| 항목 | 수 |
|------|-----|
| 총 태스크 | 11개 |
| Phase 1 (Setup) | 1개 |
| Phase 2 (Foundational) | 3개 |
| Phase 3 (US1) | 2개 |
| Phase 4 (US2) | 2개 |
| Phase 5 (US3) | 2개 |
| Phase 6 (Polish) | 1개 |
| 병렬 가능 태스크 [P] | 6개 |
