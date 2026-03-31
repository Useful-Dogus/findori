# Tasks: 유저 피드 화면 UX 폴리싱

**Input**: Design documents from `/specs/115-feed-ux-polish/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

**Tests**: 공개 피드 UI는 shipped behavior이므로 단위 테스트를 포함한다.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: 문서/스펙/브랜치 정합성 확보

- [X] T001 이슈 번호 기준 스펙 경로와 참조를 정리한다 in specs/115-feed-ux-polish/spec.md
- [X] T002 구현 기준 산출물을 작성한다 in specs/115-feed-ux-polish/plan.md
- [X] T003 [P] 연구 및 검수 문서를 작성한다 in specs/115-feed-ux-polish/research.md
- [X] T004 [P] 데이터 모델과 quickstart를 작성한다 in specs/115-feed-ux-polish/data-model.md

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: 피드 레이아웃/테스트 변경에 공통으로 필요한 기준을 먼저 고정

- [X] T005 현재 공개 피드 컴포넌트와 테스트 기준을 점검한다 in src/components/features/feed/FeedView.tsx
- [X] T006 관련 단위 테스트의 현재 기대값을 정리한다 in tests/unit/components/FeedView.test.tsx

**Checkpoint**: 피드 구조와 회귀 포인트가 식별되어 사용자 스토리 작업을 안전하게 시작할 수 있다.

---

## Phase 3: User Story 1 - 카드가 첫 화면의 주인공이 된다 (Priority: P1) 🎯 MVP

**Goal**: 상단 위계를 정리하고 빈 컨텍스트/설명성 UI를 줄여 카드 진입부를 먼저 보이게 만든다.

**Independent Test**: 첫 화면에서 면책 문구가 카드보다 앞서지 않고, 소개 문구 없이 데이터가 있는 컨텍스트만 노출된다.

### Tests for User Story 1

- [X] T007 [P] [US1] 공개 레이아웃과 피드 헤더 기대값을 갱신한다 in tests/unit/components/FeedView.test.tsx

### Implementation for User Story 1

- [X] T008 [US1] 면책 문구 배치를 하단으로 이동한다 in src/app/(public)/layout.tsx
- [X] T009 [US1] 면책 문구 컨테이너 스타일을 하단 배치에 맞게 조정한다 in src/components/features/feed/FeedDisclaimer.tsx
- [X] T010 [US1] 피드 헤더의 설명 문구와 모바일 정렬 문제를 정리한다 in src/components/features/feed/FeedView.tsx
- [X] T011 [US1] 데이터 없는 컨텍스트 슬롯을 숨기고 컨텍스트 섹션 노출 조건을 정리한다 in src/components/features/feed/FeedView.tsx

**Checkpoint**: 첫 화면 정보 위계가 개선되고, 빈 컨텍스트 슬롯이 사라진다.

---

## Phase 4: User Story 2 - 카드는 완성된 편집물처럼 읽힌다 (Priority: P1)

**Goal**: 카드 내부 가독성, 로딩 일관성, 줄바꿈/말줄임 품질을 개선한다.

**Independent Test**: 카드 전환 시 플리커가 줄고, 카드 본문/출처가 말줄임 없이 읽히며 단어 중간 줄바꿈이 발생하지 않는다.

### Tests for User Story 2

- [X] T012 [P] [US2] 카드 스택의 네비게이션/텍스트 노출 기대값을 갱신한다 in tests/unit/components/FeedCardStack.test.tsx
- [X] T013 [P] [US2] 피드 카드 가독성 및 컨텍스트 노출 기대값을 갱신한다 in tests/unit/components/FeedView.test.tsx

### Implementation for User Story 2

- [X] T014 [US2] 카드 공통 텍스트 스타일과 이미지 오버레이/로딩 상태를 정리한다 in src/components/features/feed/FeedCardStack.tsx
- [X] T015 [US2] 카드 타입별 말줄임과 줄바꿈 규칙을 완화한다 in src/components/features/feed/FeedCardStack.tsx
- [X] T016 [US2] 카드 탐색 안내 문구를 제거하고 위치 표시 UI를 정리한다 in src/components/features/feed/FeedCardStack.tsx

**Checkpoint**: 카드가 텍스트와 이미지가 분리된 조각이 아니라 하나의 카드로 인식된다.

---

## Phase 5: User Story 3 - 피드 크롬은 카드 소비를 방해하지 않는다 (Priority: P2)

**Goal**: 카드 외부 메타 정보와 태그를 줄이고 제목 위계를 낮춰 카드 중심 블록으로 보이게 만든다.

**Independent Test**: 이슈 블록에서 카드 외부 정보가 과도하게 반복되지 않고, 카드 자체가 시각적 중심이 된다.

### Tests for User Story 3

- [X] T017 [P] [US3] 이슈 메타 정보와 태그 노출 기준 테스트를 갱신한다 in tests/unit/components/FeedView.test.tsx

### Implementation for User Story 3

- [X] T018 [US3] 이슈 태그/카드 수/제목 위계를 재정리한다 in src/components/features/feed/FeedView.tsx

**Checkpoint**: 카드 외부 정보가 줄고, 이슈 블록에서 카드가 중심이 된다.

---

## Phase 6: User Story 4 - 큰 화면에서도 카드가 빈약해 보이지 않는다 (Priority: P2)

**Goal**: 데스크톱에서 카드 내부 밀도를 키워 배경만 커진 느낌을 줄인다.

**Independent Test**: 넓은 화면에서 카드 내부 수치/본문/출처가 모바일 대비 더 읽기 좋은 밀도로 보인다.

### Tests for User Story 4

- [X] T019 [P] [US4] 데스크톱용 카드 표현 변화에 맞춘 카드 스택 테스트를 보강한다 in tests/unit/components/FeedCardStack.test.tsx

### Implementation for User Story 4

- [X] T020 [US4] 데스크톱 카드 타이포와 간격을 확장한다 in src/components/features/feed/FeedCardStack.tsx

**Checkpoint**: 넓은 화면에서 카드 배경만 커져 보이는 인상이 완화된다.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: 품질 게이트와 문서 마무리

- [X] T021 tasks 상태를 완료 기준으로 업데이트한다 in specs/115-feed-ux-polish/tasks.md
- [X] T022 [P] quickstart 기준 수동 검수 포인트를 반영한다 in specs/115-feed-ux-polish/quickstart.md
- [X] T023 `npm run validate`, `npm run test`, `npm run build`를 실행해 검증한다 in /Users/chanheepark/dev/laboratory/findori

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1**: 즉시 시작 가능
- **Phase 2**: Phase 1 완료 후 진행
- **US1-US4**: Foundational 완료 후 우선순위 순서대로 진행
- **Polish**: 구현 완료 후 진행

### User Story Dependencies

- **US1**: 독립 구현 가능, MVP
- **US2**: `FeedCardStack` 변경이므로 US1 이후 진행 권장
- **US3**: `FeedView` 메타 정보 조정으로 US1과 강하게 연관
- **US4**: `FeedCardStack` 밀도 조정으로 US2 이후 진행 권장

### Parallel Opportunities

- T003/T004는 병렬 가능
- T007, T012, T013, T017, T019는 테스트 파일 기준 병렬 가능
- 구현은 `FeedView`와 `FeedCardStack` write scope가 겹치므로 순차 진행이 안전하다

## Implementation Strategy

### MVP First

1. Phase 1-2 완료
2. US1 구현 및 테스트 갱신
3. 카드보다 앞서는 UI 제거 여부를 먼저 검증

### Incremental Delivery

1. 상단 위계/컨텍스트 정리
2. 카드 내부 가독성/로딩 품질 개선
3. 메타 정보 축소
4. 데스크톱 밀도 보정
5. 품질 게이트 통과 후 PR 생성
