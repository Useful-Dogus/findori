# Feature Specification: DB 스키마 마이그레이션 구축

**Feature Branch**: `004-db-schema-migration`
**Created**: 2026-02-27
**Status**: Draft
**Input**: User description: "#4 — DB 스키마 마이그레이션 구축 (feeds/issues/tags/issue_tags/media_sources)"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - 파이프라인이 데이터를 저장할 수 있다 (Priority: P1)

콘텐츠 파이프라인(Cron)이 뉴스를 수집하고 AI가 생성한 이슈 카드 초안을 데이터베이스에 저장한다. 저장된 데이터는 Admin UI와 공개 피드 API에서 즉시 조회 가능해야 한다.

**Why this priority**: 파이프라인 → Admin → 공개 피드 전체 흐름의 데이터 기반이므로, 이 테이블 없이는 어떤 기능도 구현 불가.

**Independent Test**: 마이그레이션 적용 후 Supabase SQL 에디터에서 각 테이블에 샘플 데이터를 삽입/조회하여 제약 조건과 관계가 올바르게 작동하는지 확인.

**Acceptance Scenarios**:

1. **Given** 빈 데이터베이스, **When** 마이그레이션을 실행, **Then** `feeds`, `issues`, `tags`, `issue_tags`, `media_sources` 5개 테이블이 모두 생성된다.
2. **Given** `feeds` 테이블에 같은 날짜로 두 번 행을 삽입하려 할 때, **When** 두 번째 삽입 시도, **Then** UNIQUE 제약 위반 오류가 발생한다.
3. **Given** `feeds`에 날짜 행이 존재할 때, **When** `issues`에 해당 `feed_id`로 이슈를 삽입, **Then** 이슈가 정상 저장되고 `feeds`와 조인 조회가 가능하다.

---

### User Story 2 - 운영자가 이슈를 검토하고 상태를 변경할 수 있다 (Priority: P2)

운영자는 `draft` 상태의 이슈를 검토한 후 `approved` 또는 `rejected`로 상태를 변경한다. 승인된 이슈만 공개 피드에 노출된다.

**Why this priority**: Admin 워크플로우의 핵심 — 상태 제약이 없으면 미검토 초안이 공개 피드에 노출될 위험이 있다.

**Independent Test**: `status` 필드가 정의된 값(`draft`, `approved`, `rejected`) 외 다른 값을 거부하는지 확인.

**Acceptance Scenarios**:

1. **Given** `issues` 테이블에 `draft` 상태 이슈, **When** `status`를 `approved`로 업데이트, **Then** 업데이트가 성공한다.
2. **Given** `issues` 테이블에 이슈, **When** `status`를 정의되지 않은 값(예: `pending`)으로 설정, **Then** CHECK 제약 위반 오류가 발생한다.
3. **Given** `feeds` 테이블에 이슈, **When** `feeds.status`를 `published`로 변경, **Then** `published_at` 타임스탬프를 함께 기록할 수 있다.

---

### User Story 3 - 이슈에 태그를 붙이고 조회할 수 있다 (Priority: P3)

AI 또는 운영자가 이슈에 카테고리 태그를 부여하여 주제별 필터링과 노출 제어에 활용한다.

**Why this priority**: 태그 기반 카테고리 UI(이슈 #21)에 필요하지만, 피드 기본 렌더링은 태그 없이도 작동 가능.

**Independent Test**: `tags` → `issue_tags` → `issues` 조인 쿼리로 특정 태그의 이슈 목록을 조회.

**Acceptance Scenarios**:

1. **Given** `tags`에 "반도체" 태그, **When** `issue_tags`에 이슈-태그 연결 행 삽입, **Then** 해당 이슈를 태그로 조회할 수 있다.
2. **Given** `tags` 테이블에 동일한 이름으로 두 번 삽입 시, **When** 두 번째 삽입, **Then** UNIQUE 제약 오류가 발생한다.
3. **Given** `issue_tags`에 연결된 이슈, **When** 해당 이슈 삭제, **Then** `issue_tags`의 관련 행도 자동으로 삭제된다(CASCADE).

---

### User Story 4 - 화이트리스트 매체를 등록하고 관리할 수 있다 (Priority: P4)

운영자는 뉴스 수집 대상 매체(RSS/사이트맵 URL)를 DB에 등록·비활성화한다. 파이프라인은 `active=true`인 매체만 대상으로 수집한다.

**Why this priority**: 파이프라인 실행에 필요하지만, 초기 운영에서는 직접 DB에 삽입하는 방식으로도 가능.

**Independent Test**: `media_sources`에 매체를 삽입하고 `active` 필드 값 변경 조회.

**Acceptance Scenarios**:

1. **Given** 빈 `media_sources`, **When** 매체 정보(name, rss_url, active=true) 삽입, **Then** 행이 정상 저장된다.
2. **Given** 활성 매체, **When** `active=false`로 업데이트, **Then** 파이프라인 쿼리(`WHERE active=true`)에서 제외된다.

---

### Edge Cases

- `issues.cards_data`가 빈 배열(`[]`)이나 `null`로 저장될 경우 — 파이프라인 실패 시 draft 상태로 빈 채 저장 허용.
- 동일 `entity_id`에 대해 같은 날짜의 이슈가 이미 존재하는 경우 — 중복 방지 정책 필요(Upsert 또는 UNIQUE 제약).
- `issues`를 삭제할 때 `issue_tags` 연결 행 처리 — CASCADE DELETE 필수.
- `feeds` 행 삭제 시 연결된 `issues` 처리 — CASCADE DELETE 또는 RESTRICT 명시 필요.
- `issue_tags`에 존재하지 않는 `issue_id` 또는 `tag_id` 참조 시도 — FK 제약으로 차단.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: 시스템은 `feeds`, `issues`, `tags`, `issue_tags`, `media_sources` 5개 테이블을 단일 마이그레이션으로 생성할 수 있어야 한다.
- **FR-002**: `feeds.date`는 날짜별 UNIQUE 제약을 가져야 한다(하루 1개 피드).
- **FR-003**: `issues.status`는 `draft`, `approved`, `rejected` 세 값만 허용해야 한다(CHECK 제약).
- **FR-004**: `feeds.status`는 `draft`, `published` 두 값만 허용해야 한다(CHECK 제약).
- **FR-005**: `issues.cards_data`는 카드 배열 JSON을 저장할 수 있어야 하며, null 또는 빈 배열도 허용해야 한다.
- **FR-006**: `issues`는 `feeds`에 FK로 연결되어야 하며, 피드 삭제 시 연결된 이슈도 함께 삭제(CASCADE)되어야 한다.
- **FR-007**: `issue_tags`는 `issues`와 `tags`에 FK로 연결되어야 하며, 이슈 또는 태그 삭제 시 연결 행도 함께 삭제(CASCADE)되어야 한다.
- **FR-008**: `tags.name`은 UNIQUE 제약을 가져야 한다.
- **FR-009**: `issues.order`는 피드 내 노출 순서를 나타내는 정수여야 한다.
- **FR-010**: `issues.channel`은 카드 스키마 식별자를 저장하며 기본값은 `'v1'`이어야 한다.
- **FR-011**: `issues.entity_type`은 `stock`, `index`, `fx`, `theme` 네 값만 허용해야 한다(CHECK 제약).
- **FR-012**: `tags.created_by`는 `ai`, `operator` 두 값만 허용해야 한다(CHECK 제약).
- **FR-013**: 마이그레이션은 멱등(idempotent)해야 한다 — 이미 테이블이 존재하면 오류 없이 건너뜀.
- **FR-014**: 생성된 Supabase TypeScript 타입(`database.types.ts`)이 실제 스키마와 일치해야 한다.

### Key Entities

- **feeds**: 일별 피드. 하루 한 개, 날짜 식별. 상태는 draft/published.
- **issues**: 피드에 속하는 개별 이슈 카드 세트. AI가 생성한 카드 JSON을 보유. 종목/지수/환율/테마 타입 구분. 상태는 draft/approved/rejected. 피드 내 노출 순서 보유.
- **tags**: 이슈 분류용 태그. AI 자동 생성 또는 운영자 수동 생성. 이름 고유.
- **issue_tags**: issues와 tags의 다대다 연결 테이블. 양방향 CASCADE DELETE.
- **media_sources**: 뉴스 수집 대상 화이트리스트 매체. RSS URL 보유. 활성/비활성 상태 관리.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 마이그레이션 실행 후 5개 테이블이 모두 존재하며, 각 테이블의 컬럼·제약·인덱스가 SRS 데이터 모델과 100% 일치한다.
- **SC-002**: 모든 FK 제약과 CASCADE 규칙이 올바르게 동작하여, 참조 무결성 위반 삽입 시 오류가 발생하고 CASCADE DELETE 시 관련 행이 함께 삭제된다.
- **SC-003**: 정의된 CHECK 제약(`status`, `entity_type`, `created_by`)이 유효하지 않은 값을 100% 거부한다.
- **SC-004**: 마이그레이션을 두 번 연속 실행해도 오류 없이 완료된다(멱등성).
- **SC-005**: `npm run db:types` 실행 결과 생성된 TypeScript 타입이 빌드(`npm run validate`) 시 오류 없이 통과한다.

## Assumptions

- Supabase PostgreSQL을 사용하며, 마이그레이션 파일은 `supabase/migrations/` 디렉토리에 `.sql` 파일로 관리한다.
- 기본 키는 모두 UUID 타입이며 `gen_random_uuid()`로 자동 생성된다.
- `created_at`은 모든 테이블에 `timestamptz DEFAULT now()`로 포함된다.
- Row-Level Security(RLS)는 이 이슈 범위에 포함하지 않는다 — Admin 인증 이슈(#6)에서 별도 처리.
- `issues.cards_data`의 JSON 스키마 유효성 검증은 애플리케이션 레벨에서 처리하며, DB 레벨 JSON Schema CHECK는 MVP 범위 밖.
- Supabase CLI(`supabase db push` 또는 `supabase migration up`)를 통해 마이그레이션을 적용한다.

## Dependencies

- **선행**: #2 기술 베이스라인 셋업 (✅ 완료) — Supabase 프로젝트 연결, `@supabase/supabase-js` 설치
- **선행**: #3 환경변수/시크릿 체계 (✅ 완료) — `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` 환경변수
- **후행**: #5 카드 스키마 타입/검증 레이어 — `issues.cards_data` 구조에 의존
- **후행**: #6 Admin 인증 — RLS 정책에서 이 스키마를 참조
- **후행**: #11 Cron 파이프라인 — `feeds`, `issues`, `media_sources` 테이블에 데이터 저장
