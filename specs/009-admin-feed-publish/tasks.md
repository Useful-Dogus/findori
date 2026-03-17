# Tasks: Admin 피드 발행 워크플로우

**Input**: Design documents from `/specs/009-admin-feed-publish/`
**Branch**: `009-admin-feed-publish`
**Prerequisites**: plan.md ✓, spec.md ✓, research.md ✓, data-model.md ✓, contracts/api.md ✓

**Organization**: 3개 User Story를 독립 구현·테스트 가능한 단계로 분리. 기존 Admin 패턴 재사용으로 setup 단계 불필요.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 다른 파일, 의존 관계 없음 → 병렬 실행 가능
- **[Story]**: 해당 태스크가 속하는 User Story (US1, US2, US3)

---

## Phase 1: Foundational (블로킹 전제조건)

**Purpose**: `publishFeed()` 비즈니스 로직 완성. API Route와 UI Component 모두 이 함수에 의존하므로 먼저 완료해야 한다.

**⚠️ CRITICAL**: 이 Phase가 완료되기 전까지 US1~US3 구현을 시작하지 않는다.

- [ ] T001 `src/lib/admin/feeds.ts`에 에러 클래스 3종 추가: `FeedNotFoundError`, `FeedAlreadyPublishedError`, `NoApprovedIssuesError` (IssueNotFoundError 패턴 동일 적용)
- [ ] T002 `src/lib/admin/feeds.ts`에 `publishFeed(date: string): Promise<PublishFeedResult>` 함수 구현 — (1) date로 feed 조회 → FeedNotFoundError, (2) status !== 'draft' → FeedAlreadyPublishedError, (3) approved 이슈 count → NoApprovedIssuesError, (4) UPDATE feeds SET status='published', published_at=now() WHERE id=$id AND status='draft'
- [ ] T003 `tests/unit/lib/admin/feeds.publish.test.ts` 신규 생성 — happy path / FeedNotFoundError / FeedAlreadyPublishedError / NoApprovedIssuesError 4케이스 단위 테스트 작성 및 통과 확인

**Checkpoint**: `npm run test` 통과 → US1~US3 구현 시작 가능

---

## Phase 2: User Story 1 - 피드 발행 (Priority: P1) 🎯 MVP

**Goal**: draft 피드 + approved 이슈 1건 이상 → 발행 버튼 클릭 → published 전환 + 화면 즉시 갱신

**Independent Test**: Admin에서 draft 피드에 approved 이슈 1건을 세팅한 뒤, 발행 버튼을 클릭하면 StatusBadge가 published로 바뀌고 `/api/feeds/[date]`에서 해당 날짜 이슈가 조회되는지 확인.

### Implementation for User Story 1

- [ ] T004 [P] [US1] `src/app/api/admin/feeds/[date]/publish/route.ts` 501 스텁을 완전 구현으로 교체 — requireAdminSession 인증, isValidDate 검증(400), publishFeed() 호출, 에러 클래스별 HTTP 코드 매핑(404/409/422/500), 성공 시 `{ date, status: 'published', publishedAt }` 200 응답
- [ ] T005 [P] [US1] `src/components/features/admin/PublishFeedButton.tsx` 신규 Client Component 생성 — props: `date: string`, `feedStatus: 'draft' | 'published'`; 상태: isLoading / errorCode; 클릭 → `POST /api/admin/feeds/{date}/publish` → 성공 시 `useRouter().refresh()`; 에러 코드별 메시지 표시(no_approved_issues / already_published / 기타); feedStatus === 'published'이면 버튼 비활성화
- [ ] T006 [US1] `src/app/(admin)/admin/feed/[date]/page.tsx`에 `<PublishFeedButton date={feed.date} feedStatus={feed.status} />` 추가 — 피드 헤더 영역(h1 + StatusBadge 옆)에 배치 (T004, T005 완료 후)

**Checkpoint**: 발행 버튼 클릭 → published 전환 + 화면 갱신 3초 이내 동작 확인 (US1 완전 동작)

---

## Phase 3: User Story 2 - 발행 차단: 승인 이슈 없음 (Priority: P2)

**Goal**: approved 이슈 0건인 draft 피드에서 발행 시도 시 명확한 차단 메시지 표시

**Independent Test**: approved 이슈 0건 피드에서 발행 버튼 클릭 → "승인된 이슈가 없어 발행할 수 없습니다" 메시지 노출, 피드 상태 draft 유지 확인.

### Implementation for User Story 2

- [ ] T007 [US2] `src/components/features/admin/PublishFeedButton.tsx` 에서 `no_approved_issues` 에러 코드에 대한 사용자 메시지가 명확한지 검증 — 필요 시 메시지 문구 개선: "승인된 이슈가 없습니다. 이슈를 승인한 후 발행해주세요." (T005의 초기 구현에서 처리됐다면 메시지 문구만 확인)

**Note**: API-side 차단(422 반환)은 Phase 1 T002의 `NoApprovedIssuesError`와 Phase 2 T004의 라우트 핸들러에서 이미 구현됨. 이 Phase는 UI 메시지 품질 검증에 집중.

**Checkpoint**: 승인 이슈 없는 피드에서 발행 시도 → 발행 차단 + 안내 메시지 100% 동작 확인 (US2 완전 동작)

---

## Phase 4: User Story 3 - 이미 발행된 피드 (Priority: P3)

**Goal**: published 상태 피드에서 발행 버튼 비활성화, 직접 API 호출 시에도 거부

**Independent Test**: published 피드의 검토 화면에서 발행 버튼이 disabled 상태인지 확인. curl로 publish 엔드포인트 직접 호출 시 409 응답 확인.

### Implementation for User Story 3

- [ ] T008 [US3] `src/components/features/admin/PublishFeedButton.tsx`에서 `feedStatus === 'published'` 시 버튼 disabled 처리 및 "이미 발행된 피드입니다" 상태 텍스트 표시 — T005에서 이미 구현됐다면 동작 확인만 수행

**Note**: API-side 중복 발행 거부(409 반환)는 Phase 1 T002의 `FeedAlreadyPublishedError`와 Phase 2 T004의 라우트 핸들러에서 이미 구현됨.

**Checkpoint**: published 피드 화면에서 발행 버튼 비활성화 확인 (US3 완전 동작)

---

## Phase 5: Polish & 품질 게이트

**Purpose**: 전체 기능 통합 검증 + 품질 기준 충족

- [ ] T009 `npm run validate` 실행 — TypeScript 타입 오류, ESLint, Prettier 검사 통과 확인
- [ ] T010 `npm run test` 실행 — T003 단위 테스트 포함 전체 테스트 통과 확인
- [ ] T011 `npm run build` 실행 — 프로덕션 빌드 성공 확인

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1 (Foundational)
  ↓ (T001, T002, T003 완료 후)
Phase 2 (US1: T004, T005 병렬 가능)
  ↓ (T006은 T004+T005 완료 후)
Phase 3 (US2: T007 — Phase 2 이후)
  ↓
Phase 4 (US3: T008 — Phase 2 이후, Phase 3와 병렬 가능)
  ↓
Phase 5 (Polish)
```

### User Story Dependencies

- **US1 (P1)**: Phase 1 완료 후 시작 — 독립 동작
- **US2 (P2)**: Phase 2 완료 후 시작 — US1 API/UI 재사용
- **US3 (P3)**: Phase 2 완료 후 시작 — US2와 병렬 가능

### Parallel Opportunities

- T004와 T005: 서로 다른 파일, 병렬 실행 가능 (Phase 2 내)
- T001, T002: 순차 실행 필요 (T001의 에러 클래스를 T002가 사용)
- T007와 T008: Phase 3/4가 Phase 2 이후라면 병렬 실행 가능

---

## Parallel Example: Phase 2 (US1)

```text
# Phase 2 내 병렬 실행 가능한 태스크:
Task T004: API Route 구현 (src/app/api/admin/feeds/[date]/publish/route.ts)
Task T005: PublishFeedButton 컴포넌트 생성 (src/components/features/admin/PublishFeedButton.tsx)

# T006은 T004 + T005 완료 후 순차 실행:
Task T006: page.tsx에 PublishFeedButton 연결
```

---

## Implementation Strategy

### MVP (US1만으로 운영 가능)

1. Phase 1 완료 — publishFeed() 로직 + 테스트
2. Phase 2 완료 (T004, T005 병렬 → T006 순차) — 발행 버튼 동작
3. **STOP and VALIDATE**: 실제 draft 피드에서 발행 버튼 클릭 → published 전환 확인
4. Phase 5 (품질 게이트) 통과 → PR 생성

### Full Delivery (모든 US)

1. Phase 1 → Phase 2 → Phase 3 + Phase 4 (병렬) → Phase 5

---

## Notes

- 총 태스크: 11개
- US1: 3개 (T004, T005, T006) + Foundational 3개 (T001, T002, T003)
- US2: 1개 (T007)
- US3: 1개 (T008)
- Polish: 3개 (T009, T010, T011)
- 병렬 실행 가능: T004/T005 (US1 내), T007/T008 (Phase 2 이후)
- 기존 패턴 재사용으로 신규 파일은 최소화: 1개 신규 컴포넌트 + 1개 신규 테스트 파일 + 2개 기존 파일 수정
