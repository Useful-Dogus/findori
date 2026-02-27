# Feature Specification: 카드 스키마(cards[]) 타입/검증 레이어 구현

**Feature Branch**: `005-cards-schema-types`
**Created**: 2026-02-27
**Status**: Draft
**Input**: User description: "카드 스키마(cards[]) 타입/검증 레이어 구현 #5 이슈를 진행할래."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - 카드 데이터 파싱 및 검증 (Priority: P1)

카드 렌더링 시스템(프론트엔드, 어드민)은 DB에서 불러온 `cards_data` 원시 JSON을 신뢰할 수 있는 카드 배열로 파싱해야 한다. 검증 레이어가 있으면 잘못된 데이터가 UI에 도달하기 전에 차단되어 렌더링 오류를 예방할 수 있다.

**Why this priority**: 카드 데이터는 AI(Claude API)가 생성하므로, DB에 저장된 JSON이 스키마 규칙을 100% 준수한다고 보장할 수 없다. 렌더링 코드가 검증 없이 raw JSON을 사용하면 타입 불일치나 필드 누락으로 UI가 깨질 수 있다.

**Independent Test**: 유효한 cards[] JSON과 의도적으로 잘못된 JSON(필드 누락, 잘못된 hex, 순서 위반 등)을 파싱 함수에 입력해 결과를 확인한다. 유효한 경우 타입이 보장된 카드 배열을, 유효하지 않은 경우 명확한 에러 정보를 반환하면 통과.

**Acceptance Scenarios**:

1. **Given** DB에서 불러온 유효한 cards[] JSON이 주어졌을 때, **When** 검증 함수에 입력하면, **Then** 타입이 보장된 `Card[]` 배열을 반환한다.
2. **Given** 첫 번째 카드가 `cover` 타입이 아닌 JSON이 주어졌을 때, **When** 검증 함수에 입력하면, **Then** 에러 사유를 포함한 실패 결과를 반환한다.
3. **Given** 마지막 카드가 `source` 타입이 아닌 JSON이 주어졌을 때, **When** 검증 함수에 입력하면, **Then** 에러 사유를 포함한 실패 결과를 반환한다.
4. **Given** 카드 수가 3장 미만이거나 7장 초과인 JSON이 주어졌을 때, **When** 검증 함수에 입력하면, **Then** 에러 사유를 포함한 실패 결과를 반환한다.
5. **Given** `visual.bg_*` 필드에 유효하지 않은 hex 값(예: Tailwind 클래스 문자열)이 포함된 JSON이 주어졌을 때, **When** 검증 함수에 입력하면, **Then** 에러 사유를 포함한 실패 결과를 반환한다.
6. **Given** `reason`/`bullish`/`bearish` 타입 카드에 `sources` 배열이 없거나 빈 배열인 JSON이 주어졌을 때, **When** 검증 함수에 입력하면, **Then** 에러 사유를 포함한 실패 결과를 반환한다.

---

### User Story 2 - 콘텐츠 파이프라인 저장 전 검증 (Priority: P2)

AI 생성 카드 데이터를 DB에 저장하기 전, 운영 파이프라인이 스키마 규칙 준수 여부를 확인할 수 있어야 한다. 저장 전 검증을 통해 잘못된 데이터가 DB에 유입되는 것을 원천 차단한다.

**Why this priority**: 렌더링 시 검증도 중요하지만, DB에 저장되는 시점에 한 번 더 검증하면 데이터 신뢰성이 더 높아진다. 그러나 저장 전 검증이 없어도 렌더링 시 검증만으로 UI 안전성은 확보된다.

**Independent Test**: 파이프라인 저장 흐름에서 유효하지 않은 cards[] 데이터를 전달했을 때 저장이 거부되고 에러가 반환되면 통과.

**Acceptance Scenarios**:

1. **Given** 스키마를 준수하는 cards[] 데이터가 생성되었을 때, **When** 저장을 시도하면, **Then** DB에 정상 저장된다.
2. **Given** 스키마 위반 cards[] 데이터가 생성되었을 때, **When** 저장을 시도하면, **Then** 저장이 거부되고 위반 항목 정보가 반환된다.

---

### User Story 3 - 타입 안전한 카드 타입 가드 제공 (Priority: P3)

렌더링 코드와 파이프라인 코드는 공통으로 사용할 수 있는 타입 가드 함수를 통해 카드 `type` 필드로 각 카드 타입을 안전하게 구분할 수 있어야 한다.

**Why this priority**: 타입 가드 없이는 코드 전반에 불안전한 타입 캐스팅이 반복된다. 중앙화된 타입 가드는 코드 품질과 유지보수성을 높이고 향후 렌더링 구현(이슈 #6 이후)에 기반이 된다.

**Independent Test**: 각 카드 타입(cover, reason, bullish 등)의 샘플 객체를 타입 가드에 입력해 올바른 타입으로 좁혀지는지 테스트로 확인.

**Acceptance Scenarios**:

1. **Given** `type: 'cover'` 필드를 가진 Card 객체가 주어졌을 때, **When** cover 타입 가드를 호출하면, **Then** `true`를 반환하고 이후 코드에서 `CoverCard` 타입으로 좁혀진다.
2. **Given** `type: 'reason'` 필드를 가진 Card 객체가 주어졌을 때, **When** cover 타입 가드를 호출하면, **Then** `false`를 반환한다.

---

### Edge Cases

- `cards_data`가 `null`인 경우: 검증 오류 없이 명시적으로 null을 처리하여 null 결과를 반환한다.
- JSON이 파싱 가능하지만 배열이 아닌 객체 형태인 경우: 배열 형식 위반 에러를 반환한다.
- `visual` 객체의 일부 필드만 누락된 경우: 어느 필드가 누락/오류인지 필드 단위로 에러를 식별한다.
- `community` 타입 카드의 `quotes` 배열이 빈 배열인 경우: 최소 1개 이상의 quote가 필요하므로 검증 실패 처리한다.
- `stat` 필드는 선택적 필드이므로 누락되어도 유효 처리한다.
- 카드 `id` 중복은 MVP 범위 외 — 검증 대상에서 제외한다.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: 시스템은 DB에서 불러온 raw JSON(`cards_data`)을 입력받아 `Card[]` 스키마 준수 여부를 검증하는 함수를 제공해야 한다.
- **FR-002**: 검증 함수는 유효한 경우 타입이 보장된 카드 배열을 반환하고, 유효하지 않은 경우 구체적인 위반 항목(필드명, 위반 규칙)을 포함한 에러 결과를 반환해야 한다.
- **FR-003**: 시스템은 다음 스키마 제약 규칙을 모두 검증해야 한다:
  - 카드 배열 총 수: 최소 3장, 최대 7장
  - 첫 번째 카드 타입: 반드시 `cover`
  - 마지막 카드 타입: 반드시 `source`
  - `visual.bg_from`, `visual.bg_via`, `visual.bg_to`, `visual.accent`: 유효한 CSS hex 색상값(`#RGB`, `#RRGGBB` 형식)만 허용
  - `reason`, `bullish`, `bearish` 타입 카드의 `sources` 배열: 최소 1개 이상 필수
  - `community` 타입 카드의 `quotes` 배열: 최소 1개 이상 필수
- **FR-004**: 시스템은 7가지 카드 타입 각각(`cover`, `reason`, `bullish`, `bearish`, `community`, `stats`, `source`)에 대한 개별 타입 가드 함수를 제공해야 한다.
- **FR-005**: 검증 로직과 타입 정의는 프론트엔드 렌더링 코드와 백엔드 파이프라인 코드 양쪽에서 공통으로 재사용할 수 있어야 한다.
- **FR-006**: `cards_data`가 `null`인 경우, 검증 함수는 명시적으로 null을 처리하고 별도의 에러를 발생시키지 않으며 null 결과를 반환해야 한다.

### Key Entities

- **Card**: 카드 배열의 단위. `id`(정수), `type`(7종 리터럴), `visual`(4개 hex 색상 필드) 공통 필드를 가지며, 타입별 추가 필드를 가진다.
- **CardVisual**: 카드의 배경 그라데이션과 강조색을 정의하는 4개의 hex 색상 값 묶음.
- **CardSource**: 출처 정보. 제목, URL, 도메인 3개 필드로 구성.
- **ValidationResult**: 검증 결과 표현. 성공 시 타입 보장 카드 배열, 실패 시 위반 항목 목록을 담는다.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 유효한 cards[] JSON 샘플 5종을 검증 함수에 입력했을 때, 모두 타입 보장 카드 배열로 정상 반환된다.
- **SC-002**: 스키마 위반 케이스 10가지(필드 누락, hex 오류, 순서 위반, 카드 수 위반 등) 각각에 대해 검증 함수가 실패 결과와 위반 항목을 정확히 반환한다.
- **SC-003**: 7가지 카드 타입 각각에 대한 타입 가드 함수가 올바른 타입만 `true`로, 나머지는 `false`로 판별한다.
- **SC-004**: cards 관련 불안전한 타입 캐스팅 없이 렌더링 코드가 타입 가드 기반으로 분기할 수 있다.
- **SC-005**: 자동화된 단위 테스트를 통해 위 검증 케이스들이 CI에서 항상 통과된다.

## Assumptions

- `src/types/cards.ts`에 이미 정의된 TypeScript 타입 구조(`Card`, `CoverCard` 등)는 변경하지 않는다. 이 기능은 해당 타입 정의 위에 런타임 검증 레이어를 추가하는 것이다.
- `issues.cards_data` 컬럼은 DB에서 raw JSON으로 반환되며, 검증 레이어는 이를 입력으로 받는다.
- hex 색상 유효성은 `#RGB` 또는 `#RRGGBB` 형식(대소문자 무관)으로 검증한다. CSS 변수나 Tailwind 클래스는 유효하지 않은 것으로 처리한다.
- MVP에서 카드 `id` 중복 검증은 포함하지 않는다.
- 투자 유도 표현 금지는 프롬프트 레벨 제약이므로 검증 레이어 범위 밖이다.
- 검증 레이어는 렌더링 구현(이후 이슈)의 선행 작업이므로 UI 컴포넌트는 이 이슈에 포함되지 않는다.
