# Tasks: 카드 스키마(cards[]) 타입/검증 레이어 구현

**Input**: Design documents from `/specs/005-cards-schema-types/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅

**Tests**: 명시적으로 포함 — Constitution II 및 SC-005 요구사항

**Organization**: User Story별 단계로 구성하여 각 스토리를 독립적으로 구현·테스트 가능

## Format: `[ID] [P?] [Story?] Description with file path`

- **[P]**: 다른 파일, 의존 없음 — 병렬 실행 가능
- **[Story]**: 어느 User Story에 속하는지 (US1/US2/US3)

---

## Phase 1: Setup

**Purpose**: 신규 파일 초기 생성 (프로젝트 의존성·설정 변경 없음)

- [x] T001 Create `src/lib/cards.ts` with file header comment referencing `src/types/cards.ts` and import statement for Card types

---

## Phase 2: Foundational (모든 카드 스키마의 공통 기반)

**Purpose**: 모든 카드 타입이 공유하는 Zod 서브 스키마 구현. 이 단계 완료 전에는 카드별 스키마 작성 불가.

**⚠️ CRITICAL**: Phase 3~5 작업은 이 단계 완료 후에 시작해야 함

- [x] T002 Implement `hexColorSchema` Zod schema in `src/lib/cards.ts` (`/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/` regex, covers SRS § 4.2 hex constraint)
- [x] T003 Implement `cardVisualSchema` Zod schema in `src/lib/cards.ts` (4 fields: bg_from, bg_via, bg_to, accent — each using hexColorSchema)
- [x] T004 Implement `cardSourceSchema`, `communityQuoteSchema`, `statsItemSchema` Zod schemas in `src/lib/cards.ts` (sub-entity schemas for card types)

**Checkpoint**: 공통 Zod 서브 스키마 완성 — 카드별 스키마 작업 시작 가능

---

## Phase 3: User Story 1 — 카드 데이터 파싱 및 검증 (Priority: P1) 🎯 MVP

**Goal**: `parseCards(json: unknown): ParseCardsResult` 함수를 통해 DB raw JSON을 타입 보장 `Card[]`로 검증·변환

**Independent Test**: `parseCards(validSample)` → `{ success: true, data: Card[] }` / `parseCards(invalidSample)` → `{ success: false, errors: string[] }` 확인

### Implementation for User Story 1

- [x] T005 [US1] Implement 7 card-specific Zod schemas in `src/lib/cards.ts` (coverCardSchema, reasonCardSchema with min 1 sources, bullishCardSchema with min 1 sources, bearishCardSchema with min 1 sources, communityCardSchema with min 1 quotes, statsCardSchema, sourceCardSchema) using `z.object` with `type` literal field
- [x] T006 [US1] Implement `cardSchema` as `z.discriminatedUnion('type', [...])` and `cardsArraySchema` with `.min(CARD_COUNT_MIN).max(CARD_COUNT_MAX).refine()` for first-cover and last-source order constraints in `src/lib/cards.ts`
- [x] T007 [US1] Export `ParseCardsResult` discriminated union type and `parseCards(json: unknown): ParseCardsResult` function (null-safe: returns `{ success: true, data: null }` for null input, uses `safeParse`, maps ZodError issues to string[] errors) in `src/lib/cards.ts`

### Tests for User Story 1

- [x] T008 [US1] Create `tests/unit/lib/cards.test.ts` with `describe('parseCards')` block — write tests for valid cases: null input → data:null, 3-card minimum valid array, 7-card maximum valid array
- [x] T009 [US1] Add failure-case tests to `tests/unit/lib/cards.test.ts`: card count < 3, card count > 8, first card not cover, last card not source, visual.bg_from with Tailwind class string, visual.accent with invalid hex, reason card missing sources, bullish card with empty sources array, bearish card missing sources, community card with empty quotes array, non-array object input

**Checkpoint**: `parseCards()` 완전 동작 확인 — `npm run test` 통과

---

## Phase 4: User Story 2 — 파이프라인 저장 전 검증 (Priority: P2)

**Goal**: 파이프라인이 `parseCards()`로 스키마 위반 데이터를 저장 전에 감지하고, 에러 상세를 확인할 수 있음을 검증

**Independent Test**: `result.errors` 배열이 위반 필드명/규칙을 포함한 문자열을 반환하는지 확인

### Tests for User Story 2

- [x] T010 [US2] Add `describe('parseCards - pipeline rejection')` block to `tests/unit/lib/cards.test.ts`: verify `result.errors` is non-empty and contains identifiable violation info (field path or rule name) for each failure case — covers acceptance criteria SC-002 (10 violation types) and US2 pipeline rejection scenario

**Checkpoint**: 파이프라인 거부 시나리오 검증 완료

---

## Phase 5: User Story 3 — 타입 안전한 카드 타입 가드 (Priority: P3)

**Goal**: 7가지 카드 타입 가드 함수 제공으로 렌더링 코드가 안전하게 카드 타입을 좁힘

**Independent Test**: 각 타입 가드 함수가 자신의 타입에만 `true`, 나머지에 `false` 반환

### Implementation for User Story 3

- [x] T011 [P] [US3] Export 7 type guard functions in `src/lib/cards.ts`: `isCoverCard(card: Card): card is CoverCard`, `isReasonCard`, `isBullishCard`, `isBearishCard`, `isCommunityCard`, `isStatsCard`, `isSourceCard` — each using `card.type === 'literal'` comparison

### Tests for User Story 3

- [x] T012 [US3] Add `describe('type guards')` block to `tests/unit/lib/cards.test.ts`: for each of the 7 guards, test that it returns true for its own card type and false for the other 6 types (7 × 7 = 49 assertions, use a sample Card fixture per type)

**Checkpoint**: 모든 타입 가드 동작 확인 — `npm run test` 통과

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: 코드 품질 게이트 통과 및 최종 검증

- [x] T013 Run `npm run validate` (type-check + lint + format:check) and fix any issues in `src/lib/cards.ts` and `tests/unit/lib/cards.test.ts`
- [x] T014 Run `npm run test` to confirm all cards tests pass and no regressions in existing tests (`tests/unit/lib/env.test.ts`, `tests/unit/lib/utils.test.ts`)

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1 (Setup)
  └─→ Phase 2 (Foundational) ─ BLOCKS ALL
        └─→ Phase 3 (US1) ──────────┐
              └─→ Phase 4 (US2)     ├─ 완료 후
        └─→ Phase 5 (US3) ──────────┘
              └─→ Phase 6 (Polish)
```

- **Phase 1**: 즉시 시작 가능
- **Phase 2**: Phase 1 완료 후 — 모든 US 작업 블로킹
- **Phase 3 (US1)**: Phase 2 완료 후 시작
- **Phase 4 (US2)**: Phase 3 완료 후 시작 (parseCards 존재 전제)
- **Phase 5 (US3)**: Phase 2 완료 후 시작 (US1과 독립)
- **Phase 6**: 모든 US 완료 후

### User Story Dependencies

- **US1 (P1)**: Phase 2 완료 후 시작 — 다른 US에 의존 없음
- **US2 (P2)**: Phase 3(US1) 완료 후 시작 — parseCards() 함수 필요
- **US3 (P3)**: Phase 2 완료 후 시작 — US1과 **병렬 시작 가능**

### Within-Story Order

- T005 → T006 → T007 (src/lib/cards.ts 내 순서 의존)
- T007 완료 후 T008 시작 (parseCards export 필요)
- T008 → T009 (같은 파일 순서)
- T011과 T007은 병렬 가능 (다른 파일: cards.ts의 독립 섹션 vs 별도 작업 없음 — 실제로는 같은 파일이므로 순서 있음)

---

## Parallel Opportunities

### Phase 2 내부

T002 → T003, T004 순서 (hexColor 먼저, 그 다음 T003·T004 병렬 가능)

```bash
# T002 완료 후:
Task A: "Implement cardVisualSchema in src/lib/cards.ts"     # T003
Task B: "Implement cardSourceSchema, communityQuoteSchema, statsItemSchema in src/lib/cards.ts"  # T004
# 단, 같은 파일이므로 실제 편집은 순차적으로 진행
```

### US1 완료 후 US3 병렬

Phase 3(US1)과 Phase 5(US3) 구현은 Phase 2 완료 후 동시 시작 가능:

```bash
Task A: "US1 — T005, T006, T007 (card schemas + parseCards)"
Task B: "US3 — T011 (type guards in src/lib/cards.ts)"
# 단, 같은 파일에 편집하므로 실제로는 순차 실행 권장
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1: T001 (Setup)
2. Phase 2: T002→T003→T004 (Base schemas)
3. Phase 3: T005→T006→T007→T008→T009 (parseCards + tests)
4. **STOP and VALIDATE**: `npm run test` 통과 확인
5. **MVP 완성**: parseCards()로 렌더링 코드가 안전하게 카드 사용 가능

### Incremental Delivery

1. Phase 1+2 완료 → 공통 기반 준비
2. Phase 3(US1) 완료 → parseCards() 사용 가능, 렌더링 코드에 즉시 통합 가능
3. Phase 4(US2) 완료 → 파이프라인 통합 준비 완료 (에러 상세 검증)
4. Phase 5(US3) 완료 → 타입 가드로 안전한 분기 코드 작성 가능
5. Phase 6 → 품질 게이트 통과, PR 준비

---

## Notes

- **[P]**: 다른 파일이거나 미완성 작업에 의존하지 않음 — 단, `src/lib/cards.ts`는 단일 파일이므로 실제 편집은 순차적으로 진행
- `src/types/cards.ts`는 이 태스크에서 **수정하지 않음** (주석 "스키마 구조 변경 금지" 준수)
- 각 Checkpoint에서 `npm run test` 실행으로 단계 독립 검증
- `CARD_COUNT_MIN`, `CARD_COUNT_MAX` 상수는 이미 `src/types/cards.ts`에 정의됨 — import하여 사용
- 모든 export는 `src/lib/cards.ts`의 named export — default export 없음
