# Tasks: 공개 피드 API

**Input**: Design documents from `/specs/015-public-feed-api/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅

**Organization**: 유저 스토리별로 독립 구현·테스트 가능한 단위로 분리.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 병렬 실행 가능 (다른 파일, 미완료 태스크 의존 없음)
- **[Story]**: 해당 유저 스토리 레이블 (US1, US2, US3)
- 각 태스크에 정확한 파일 경로 포함

---

## Phase 1: Setup

**Purpose**: 공개 피드 lib 모듈 초기 구조 생성

- [x] T001 `src/lib/public/feeds.ts` 파일 생성 — 애플리케이션 레이어 타입(`PublicIssueSummary`, `PublicIssueDetail`)과 `isValidDate` 헬퍼 함수 정의. `isValidDate`는 `/^\d{4}-\d{2}-\d{2}$/` 정규식 + `Date` 파싱 검증 로직 포함 (admin/feeds.ts 패턴 동일하게 적용)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: 세 Route Handler가 공통으로 의존하는 데이터 접근 함수 구현. 이 Phase 완료 전 US1·US2·US3 구현 불가.

**⚠️ CRITICAL**: Phase 2 완료 후에야 각 User Story 구현 시작 가능

- [x] T002 `src/lib/public/feeds.ts`에 `getLatestPublishedDate()` 함수 추가 — `feeds` 테이블에서 `status='published'`인 행 중 `date` 내림차순 1건 조회. 없으면 `null` 반환, DB 오류 시 throw

- [x] T003 `src/lib/public/feeds.ts`에 `getPublicFeedByDate(date: string)` 함수 추가 — 2-step: ① `feeds` 테이블에서 `date=param AND status='published'`로 단건 조회(maybeSingle), 없으면 `null` 반환 ② `issues` 테이블에서 `feed_id=feed.id AND status='approved'` 조회, `display_order` 오름차순 정렬 ③ 이슈 ID 목록으로 `issue_tags`+`tags` 배치 조회 후 `tags: string[]` 매핑. 반환 타입: `{ feed: { date: string } | null, issues: PublicIssueSummary[] }`

- [x] T004 `src/lib/public/feeds.ts`에 `getPublicIssueById(id: string)` 함수 추가 — ① `issues` 테이블에서 `id=param AND status='approved'`로 단건 조회, 없으면 `null` 반환 ② 연결된 `feeds` 행의 `status='published'` 확인, 아니면 `null` 반환 ③ `issue_tags`+`tags` 배치 조회 후 `tags: string[]` 매핑. 반환 타입: `PublicIssueDetail | null`

- [x] T005 `tests/unit/lib/public-feeds.test.ts` 작성 — `vi.mock('@/lib/supabase/server')` 패턴으로 Supabase 클라이언트 모킹. 커버리지: `isValidDate`(유효/무효/존재하지 않는 날짜), `getLatestPublishedDate`(정상·빈 피드·DB 오류), `getPublicFeedByDate`(정상·피드 없음·draft 피드 미포함·approved 이슈만 반환·태그 매핑·DB 오류), `getPublicIssueById`(정상·존재하지 않는 ID·draft 이슈·draft 피드에 속한 이슈·DB 오류)

**Checkpoint**: `npm run test -- tests/unit/lib/public-feeds.test.ts` 통과 후 User Story 구현 시작

---

## Phase 3: User Story 1+3 — 피드 진입 및 날짜 탐색 (Priority: P1/P3) 🎯 MVP

**Goal**: `/api/feeds/latest`와 `/api/feeds/[date]` 스텁을 실제 구현으로 교체. US3의 오류 처리(400/404)도 이 Phase에서 함께 구현.

**Independent Test**: `GET /api/feeds/latest`가 최신 날짜를 반환하고, 해당 날짜로 `GET /api/feeds/[date]`가 이슈 목록을 반환하는지 확인. 잘못된 날짜 형식 → 400, 미발행 날짜 → 404 확인.

### Tests for User Story 1+3

- [x] T006 [P] [US1] `tests/unit/api/public-feeds-latest-route.test.ts` 작성 — `getLatestPublishedDate` 모킹으로 HTTP 응답 검증: 날짜 있음 → 200 `{ date }`, 날짜 없음(null) → 200 `{ date: null }`, 내부 오류 → 500

- [x] T007 [P] [US1] `tests/unit/api/public-feeds-date-route.test.ts` 작성 — `getPublicFeedByDate` 모킹으로 HTTP 응답 검증: 정상 → 200 `{ date, issues[] }`, 잘못된 날짜 형식 → 400, 피드 없음(null) → 404, 빈 이슈 배열 → 200 `{ date, issues: [] }`, 내부 오류 → 500

### Implementation for User Story 1+3

- [x] T008 [US1] `src/app/api/feeds/latest/route.ts` 스텁 교체 — `getLatestPublishedDate()` 호출, 200 `{ date }` 반환(null 포함), try/catch로 500 처리

- [x] T009 [US1] `src/app/api/feeds/[date]/route.ts` 스텁 교체 — `isValidDate` 검증 → 실패 시 400, `getPublicFeedByDate(date)` 호출 → null이면 404, 성공 시 200 `{ date, issues }`, try/catch로 500 처리

**Checkpoint**: `npm run test -- tests/unit/api/public-feeds` 통과. `GET /api/feeds/latest`와 `GET /api/feeds/[date]` 모두 동작 확인.

---

## Phase 4: User Story 2 — 공유 링크 이슈 직접 열람 (Priority: P2)

**Goal**: `/api/issues/[id]` 스텁을 실제 구현으로 교체. 비로그인 상태에서 `published` 피드의 `approved` 이슈만 반환.

**Independent Test**: 유효한 approved 이슈 ID로 `GET /api/issues/[id]` 호출 시 이슈 상세(feedDate, cardsData, tags 포함) 반환 확인. draft 이슈 또는 draft 피드 이슈 → 404 확인.

### Tests for User Story 2

- [x] T010 [US2] `tests/unit/api/public-issues-id-route.test.ts` 작성 — `getPublicIssueById` 모킹으로 HTTP 응답 검증: 정상 → 200 `PublicIssueDetail`, 없거나 비공개 → 404, 내부 오류 → 500

### Implementation for User Story 2

- [x] T011 [US2] `src/app/api/issues/[id]/route.ts` 스텁 교체 — `getPublicIssueById(id)` 호출 → null이면 404, 성공 시 200 `PublicIssueDetail`, try/catch로 500 처리

**Checkpoint**: `npm run test -- tests/unit/api/public-issues` 통과. `GET /api/issues/[id]` 동작 확인.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: 전체 품질 게이트 통과 및 검증

- [x] T012 [P] `npm run validate` 실행 — 타입 체크·린트·포맷 오류 수정
- [x] T013 `npm run test` 실행 — 전체 테스트 통과 확인 (신규 4개 파일 포함)
- [x] T014 [P] `npm run build` 실행 — 빌드 오류 없음 확인 (ANTHROPIC_API_KEY 검증 실패는 기존 환경변수 이슈, 코드 변경 무관)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: 즉시 시작 가능
- **Foundational (Phase 2)**: Phase 1 완료 후 — 모든 User Story를 블록
- **User Story 1+3 (Phase 3)**: Phase 2 완료 후 시작
- **User Story 2 (Phase 4)**: Phase 2 완료 후 시작 (Phase 3와 병렬 가능)
- **Polish (Phase 5)**: Phase 3, Phase 4 모두 완료 후

### User Story Dependencies

- **US1+3 (Phase 3)**: Phase 2 완료 후 — US2와 독립적
- **US2 (Phase 4)**: Phase 2 완료 후 — US1+3와 독립적, 병렬 실행 가능

### Within Each Phase

- T002 → T003 → T004 순서 (같은 파일에 추가하는 방식)
- T005는 T002~T004 모두 완료 후
- T006/T007은 Phase 3에서 [P] — 다른 파일이므로 병렬 가능
- T008/T009는 T006/T007 이후 순차 실행

### Parallel Opportunities

- T006과 T007: 다른 파일 → 병렬 작성 가능
- T010과 T012: 다른 파일 → 병렬 가능 (Phase 4+5 시작 후)
- Phase 3와 Phase 4는 Phase 2 완료 후 병렬 진행 가능

---

## Parallel Example: Phase 3

```bash
# T006과 T007 병렬 작성:
Task: "tests/unit/api/public-feeds-latest-route.test.ts 작성"
Task: "tests/unit/api/public-feeds-date-route.test.ts 작성"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1: Setup 완료
2. Phase 2: Foundational 완료 (T001~T005)
3. Phase 3: US1+3 완료 (T006~T009)
4. **STOP and VALIDATE**: `/api/feeds/latest` + `/api/feeds/[date]` 독립 동작 확인
5. Phase 4: US2 추가

### Incremental Delivery

1. T001~T005 → lib 모듈 완성, 테스트 통과
2. T006~T009 → 피드 진입 API 동작
3. T010~T011 → 이슈 공유 API 동작
4. T012~T014 → 전체 품질 게이트 통과, PR 준비

---

## Notes

- [P] 태스크 = 다른 파일, 의존 없음 → 병렬 실행 가능
- T002~T004는 같은 파일(`feeds.ts`)에 순차 추가 → 병렬 불가
- `parseCards` 함수(`src/lib/cards.ts`)는 기존 코드 그대로 재사용
- `createClient` 함수(`src/lib/supabase/server.ts`)는 기존 코드 그대로 재사용
- admin/feeds.ts의 `isValidDate` 구현을 참고하되 public/feeds.ts에 독립 구현
- 모든 공개 엔드포인트는 인증 미들웨어 없이 동작해야 하며, admin 미들웨어가 적용되지 않음을 확인
