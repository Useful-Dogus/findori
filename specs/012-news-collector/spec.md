# Feature Specification: 뉴스 수집 모듈

**Feature Branch**: `012-news-collector`
**Created**: 2026-03-05
**Status**: Draft
**Input**: User description: "#12 뉴스 수집 모듈 구현 (화이트리스트 기반, URL dedup)"

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - 파이프라인이 당일 기사를 수집한다 (Priority: P1)

Cron 파이프라인(#11)이 실행될 때, 수집 모듈은 DB에 등록된 활성 화이트리스트 매체 전체에서 당일 신규 기사를 가져와 URL 기준으로 중복 제거 후 하나의 기사 목록으로 반환한다. 반환된 목록은 Step 2(Claude 카드 생성 모듈, #13)가 즉시 소비할 수 있는 형태여야 한다.

**Why this priority**: 파이프라인 전체의 입력 데이터를 생성하는 단계다. 이 단계가 없으면 이후 모든 단계(카드 생성, Admin 검토, 피드 발행)가 동작하지 않는다.

**Independent Test**: `media_sources` 테이블에 활성 매체를 1개 이상 등록한 상태에서 수집 함수를 직접 호출하여 당일 기사 목록(url, title, body, source_name)이 반환되면 독립 검증 가능하다.

**Acceptance Scenarios**:

1. **Given** DB에 활성(`active=true`) 매체가 3개 등록되어 있고, **When** 수집 모듈이 실행되면, **Then** 각 매체의 RSS 피드에서 당일 기사를 수집하여 통합된 단일 기사 목록을 반환한다.
2. **Given** 서로 다른 매체에 동일 URL의 기사가 존재할 때, **When** 수집 모듈이 실행되면, **Then** 해당 URL의 기사는 1건만 포함된 목록이 반환된다.
3. **Given** 활성 매체가 0개일 때, **When** 수집 모듈이 실행되면, **Then** 빈 기사 목록과 함께 정상 완료 신호를 반환한다.

---

### User Story 2 - 개별 매체 실패가 전체 수집을 중단하지 않는다 (Priority: P2)

특정 매체의 RSS 피드 fetch가 실패하더라도 나머지 매체 수집은 계속 진행되어야 한다. 실패한 매체는 스킵되고 실패 사실이 운영 로그에 기록된다.

**Why this priority**: 단일 매체 장애가 전체 파이프라인을 다운시키지 않도록 하는 것이 운영 신뢰성의 핵심이다.

**Independent Test**: RSS fetch를 의도적으로 실패시키는 매체(잘못된 URL)를 1개 포함하고 나머지 정상 매체 2개를 등록한 뒤 수집을 실행하여, 정상 매체의 기사만 반환되고 실패 정보가 로그에 남으면 독립 검증 가능하다.

**Acceptance Scenarios**:

1. **Given** 활성 매체 3개 중 1개의 RSS URL이 응답 불가 상태일 때, **When** 수집 모듈이 실행되면, **Then** 실패한 매체는 스킵되고 나머지 2개 매체의 기사는 정상 반환된다.
2. **Given** 매체 fetch 실패가 발생할 때, **When** 수집이 완료되면, **Then** 실패한 매체명과 실패 사유가 파이프라인 실행 로그(`pipeline_logs`)에 기록된다.
3. **Given** 모든 활성 매체 fetch가 실패할 때, **When** 수집 모듈이 실행되면, **Then** 빈 기사 목록을 반환하고 전체 실패 사실을 로그에 기록하며, 파이프라인은 정상적으로 다음 단계(빈 입력 처리)로 진행된다.

---

### User Story 3 - 운영자가 수집 결과를 로그로 확인한다 (Priority: P3)

파이프라인 실행 후 운영자는 매체별 수집 건수, 중복 제거 건수, 실패 매체 목록을 로그를 통해 파악할 수 있어야 한다.

**Why this priority**: 파이프라인 품질 모니터링과 문제 진단에 필요하나, 수집 자체가 동작하면 후속 개선 가능하다.

**Independent Test**: 수집 실행 후 `pipeline_logs`에 매체별 수집 건수 요약이 포함된 레코드가 생성되면 독립 검증 가능하다.

**Acceptance Scenarios**:

1. **Given** 수집이 완료된 후, **When** 파이프라인 로그를 조회하면, **Then** 매체별 수집 기사 건수와 중복 제거 건수가 기록되어 있다.
2. **Given** 특정 매체에서 당일 기사가 0건 수집되었을 때, **When** 로그를 확인하면, **Then** 해당 매체는 "수집 건수 0"으로 기록되며 오류로 분류되지 않는다.

---

### Edge Cases

- 매체의 RSS 피드가 당일 기사를 포함하지 않을 때 → 해당 매체 결과를 빈 배열로 처리, 오류가 아님
- 기사 발행일이 전날이지만 RSS 피드에 포함되어 있을 때 → 발행일(published_at) 기준 당일 필터 적용
- 동일 기사가 URL 쿼리 파라미터만 다르게 중복될 때 → URL 정규화 없이 exact match만 적용 (MVP 범위)
- RSS 피드 파싱에 성공했으나 기사 URL이 없는 항목 → 해당 항목 스킵
- 기사 body/description이 비어 있는 항목 → title만 있어도 수집 목록에 포함 (하류 모듈에서 처리)

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: 수집 모듈은 `media_sources` 테이블에서 `active=true`인 매체 목록을 읽어야 한다.
- **FR-002**: 각 활성 매체의 `rss_url`에서 RSS 피드를 fetch하고 파싱하여 기사 목록을 추출해야 한다.
- **FR-003**: 수집된 기사는 발행일(`published_at`) 기준으로 당일(파이프라인 실행 기준일, KST) 기사만 필터링해야 한다.
- **FR-004**: 기사 URL을 기준으로 중복을 제거하고 단일 기사 목록을 반환해야 한다.
- **FR-005**: 반환되는 기사 항목은 최소 `url`, `title`, `body`(description), `source_name` 필드를 포함해야 한다.
- **FR-006**: 개별 매체 fetch 또는 파싱 실패 시 해당 매체를 스킵하고 나머지 매체 수집을 계속해야 한다.
- **FR-007**: 수집 완료 후 매체별 수집 건수, 실패 매체 목록, 중복 제거 건수를 `pipeline_logs`에 기록해야 한다.
- **FR-008**: 수집 모듈은 파이프라인 오케스트레이터(#11 Cron 엔드포인트)에서 함수 호출 방식으로 사용 가능해야 한다.

### Key Entities

- **Media Source**: 화이트리스트 매체 (`media_sources` 테이블). 매체명(`name`), RSS 피드 URL(`rss_url`), 활성 여부(`active`) 보유.
- **Article**: 수집된 기사 항목. URL(고유 식별자), 제목(`title`), 본문/요약(`body`), 발행일(`published_at`), 매체명(`source_name`) 보유.
- **Collection Result**: 수집 완료 결과. 기사 목록, 매체별 수집 건수, 실패 매체 목록, 중복 제거 건수 포함.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 활성 매체 10개 기준 수집 실행 완료까지 60초를 초과하지 않는다.
- **SC-002**: 동일 URL이 여러 매체에서 수집되더라도 최종 기사 목록에는 1건만 포함된다.
- **SC-003**: 활성 매체 중 일부가 fetch 실패하더라도 성공한 매체의 기사는 누락 없이 반환된다.
- **SC-004**: 매 수집 실행마다 매체별 수집 건수와 실패 매체 정보가 운영 로그에 남아 추적 가능하다.
- **SC-005**: 활성 매체가 0개이거나 당일 기사가 전혀 없을 때에도 파이프라인이 에러 없이 빈 목록으로 완료된다.

---

## Assumptions

- RSS 피드는 `rss-parser`가 지원하는 표준 RSS/Atom 포맷을 따른다. 사이트맵 파싱은 MVP 범위 외.
- "당일" 기준은 파이프라인 실행 시점의 KST(UTC+9) 날짜다.
- URL 정규화(trailing slash 제거, 쿼리 파라미터 무시 등)는 MVP에서 적용하지 않는다. Exact URL match만 적용.
- RSS 피드에서 추출한 description/summary 수준의 본문으로 Claude 카드 생성(#13)에 충분하다고 가정. 전체 페이지 스크래핑은 MVP 범위 외.
- `media_sources` 테이블은 이미 존재하며 운영자가 직접 DB에 매체를 등록한다 (Admin UI #10은 별도 이슈).
- `pipeline_logs` 테이블은 #11(Cron 엔드포인트)에서 이미 정의·생성되었다.
