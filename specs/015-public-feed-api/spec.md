# Feature Specification: 공개 피드 API

**Feature Branch**: `015-public-feed-api`
**Created**: 2026-03-12
**Status**: Draft
**Input**: User description: "#15 (공개 피드 API) 진행할래."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - 오늘의 피드 진입 (Priority: P1)

사용자가 앱에 처음 접속하면 가장 최신 발행 피드 날짜를 조회해 해당 날짜의 이슈 목록과 카드 데이터를 한 번에 불러온다. 프론트엔드는 이 데이터를 기반으로 스와이프 가능한 카드 피드를 렌더링한다.

**Why this priority**: 피드 진입의 첫 단계이며, 이 API 없이 공개 피드 화면 자체가 동작하지 않는다.

**Independent Test**: `/api/feeds/latest`로 최신 날짜를 얻고, 해당 날짜로 `/api/feeds/[date]`를 호출해 이슈·카드 데이터가 반환되는지 확인.

**Acceptance Scenarios**:

1. **Given** 발행(`published`) 상태의 피드가 존재할 때, **When** `GET /api/feeds/latest`를 호출하면, **Then** `{ "date": "YYYY-MM-DD" }` 형식으로 가장 최신 날짜를 반환한다.
2. **Given** 발행된 피드가 하나도 없을 때, **When** `GET /api/feeds/latest`를 호출하면, **Then** `{ "date": null }` 또는 404를 반환하며 오류 없이 처리된다.
3. **Given** 해당 날짜에 `published` 피드와 `approved` 이슈가 존재할 때, **When** `GET /api/feeds/[date]`를 호출하면, **Then** 이슈 목록(순서 포함), 각 이슈의 `cards_data`, 태그 배열을 포함한 응답을 반환한다.
4. **Given** 해당 날짜의 피드가 `draft` 상태일 때, **When** `GET /api/feeds/[date]`를 호출하면, **Then** 공개 데이터를 반환하지 않는다 (404).

---

### User Story 2 - 공유 링크로 특정 이슈 직접 열람 (Priority: P2)

사용자가 SNS나 메시지로 공유된 이슈 링크를 클릭해 해당 이슈의 카드 데이터만 바로 조회한다. 비로그인 상태에서도 접근 가능하다.

**Why this priority**: 공유 기능(#22)이 의존하는 단일 이슈 조회 API이며, 피드 진입 없이 특정 이슈로 직접 접근하는 경로를 지원한다.

**Independent Test**: 유효한 이슈 ID로 `/api/issues/[id]`를 호출해 해당 이슈의 카드 데이터와 메타 정보가 반환되는지 확인.

**Acceptance Scenarios**:

1. **Given** `approved` 상태의 이슈가 `published` 피드에 속할 때, **When** `GET /api/issues/[id]`를 호출하면, **Then** 이슈 상세 정보(제목, entity 정보, cards_data, 태그, 피드 날짜)를 반환한다.
2. **Given** 존재하지 않는 이슈 ID를 요청할 때, **When** `GET /api/issues/[id]`를 호출하면, **Then** 404를 반환한다.
3. **Given** `draft` 또는 `rejected` 상태의 이슈 ID를 요청할 때, **When** `GET /api/issues/[id]`를 호출하면, **Then** 404를 반환한다.
4. **Given** `approved` 이슈이지만 피드가 `draft` 상태일 때, **When** `GET /api/issues/[id]`를 호출하면, **Then** 404를 반환한다.

---

### User Story 3 - 날짜별 피드 탐색 (Priority: P3)

사용자가 날짜 탐색 UI를 통해 특정 과거 날짜의 피드를 조회한다.

**Why this priority**: P1과 동일한 API(`/api/feeds/[date]`)를 재사용하지만, 빈 날짜 처리와 잘못된 입력에 대한 응답 일관성이 핵심이다.

**Independent Test**: 발행 이력이 없는 날짜와 잘못된 날짜 형식으로 `/api/feeds/[date]`를 호출해 적절한 오류 응답이 반환되는지 확인.

**Acceptance Scenarios**:

1. **Given** 발행된 피드가 없는 날짜를 요청할 때, **When** `GET /api/feeds/[date]`를 호출하면, **Then** 404를 반환한다.
2. **Given** 잘못된 날짜 형식(예: `2026-13-01`, `20260101`)을 요청할 때, **When** `GET /api/feeds/[date]`를 호출하면, **Then** 400을 반환한다.

---

### Edge Cases

- 발행된 피드는 존재하지만 `approved` 이슈가 0개인 경우: 빈 `issues` 배열로 200 응답
- `cards_data`가 null이거나 빈 배열인 이슈는 응답에 포함하되 카드 배열이 비어있음을 그대로 전달
- 동시에 여러 클라이언트가 동일 날짜를 요청해도 일관된 응답 반환
- 날짜 파라미터는 `YYYY-MM-DD` 형식만 허용; 다른 형식은 400

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: 시스템은 `GET /api/feeds/latest`로 가장 최근 `published` 상태 피드의 날짜를 반환해야 한다.
- **FR-002**: `published` 피드가 없으면 `GET /api/feeds/latest`는 날짜 없음(`{ "date": null }` 또는 404)을 명확히 반환해야 한다.
- **FR-003**: 시스템은 `GET /api/feeds/[date]`로 해당 날짜의 `published` 피드에 속한 `approved` 이슈 목록을 `order` 오름차순으로 반환해야 한다.
- **FR-004**: 각 이슈 응답에는 `id`, `entity_type`, `entity_name`, `title`, `change_value`, `channel`, `cards_data`, `tags`(이름 배열) 필드가 포함되어야 한다.
- **FR-005**: `GET /api/feeds/[date]`는 `draft` 상태 피드의 이슈를 어떤 경우에도 반환하지 않는다.
- **FR-006**: 시스템은 `GET /api/issues/[id]`로 단일 이슈를 조회할 수 있어야 하며, 해당 이슈가 `published` 피드에 속한 `approved` 이슈일 때만 반환한다.
- **FR-007**: `GET /api/issues/[id]` 응답에는 이슈가 속한 피드 날짜(`feed_date`)가 포함되어야 한다.
- **FR-008**: 세 API 엔드포인트 모두 인증 없이 접근 가능해야 한다 (공개 읽기 전용).
- **FR-009**: 잘못된 날짜 형식 요청 시 400, 존재하지 않거나 미발행 리소스 요청 시 404, 서버 오류 시 500을 반환해야 한다.
- **FR-010**: 각 이슈의 `tags` 필드는 해당 이슈에 연결된 태그 이름 문자열 배열로 반환해야 한다.

### Key Entities

- **Feed**: 하루 단위로 묶인 이슈 컨테이너. `date`(고유 키), `status`(`draft`|`published`) 보유. `published` 상태만 공개.
- **Issue**: Feed에 속한 개별 투자 이슈. `cards_data`(카드 배열 JSON), `status`(`draft`|`approved`|`rejected`), `order`(피드 내 노출 순서) 보유. `approved` 상태만 공개.
- **Tag**: 이슈에 연결된 카테고리 레이블. 이슈와 N:M 관계. 이슈 응답에 이름 배열로 포함.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 공개 피드 API 3개 엔드포인트(`/api/feeds/latest`, `/api/feeds/[date]`, `/api/issues/[id]`) 모두 정상 응답을 반환한다.
- **SC-002**: `draft` 피드 및 `approved`가 아닌 이슈는 어떤 공개 API 호출에도 응답에 포함되지 않는다.
- **SC-003**: 잘못된 날짜 형식·존재하지 않는 날짜·미발행 피드에 대한 요청은 적절한 HTTP 상태 코드(400/404)와 오류 메시지를 반환한다.
- **SC-004**: API 응답 구조가 SRS 7.1절의 응답 예시(date, issues 배열, 각 이슈의 entity 정보·tags·cards_data)와 일치한다.
- **SC-005**: 핵심 시나리오(정상 조회, 미발행 필터링, 오류 처리)를 커버하는 자동화 테스트가 존재한다.

## Assumptions

- `feeds.status = 'published'` AND `issues.status = 'approved'`가 공개 노출의 필요충분조건이다.
- 응답 캐싱(CDN/HTTP Cache)은 이 이슈 범위 밖이며, 추후 별도 이슈에서 다룬다.
- Rate limiting은 MVP 범위 밖이다.
- OG 이미지 API(`/api/og/issue/[id]`)는 #25에서 별도 구현한다.
- `GET /api/feeds/latest`는 `{ "date": null }` 반환(빈 피드 상황)으로 통일한다 (404 대신 명시적 null이 프론트엔드 처리에 더 자연스러움).
