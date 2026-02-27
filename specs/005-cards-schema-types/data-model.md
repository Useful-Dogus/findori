# Data Model: 카드 스키마 타입/검증 레이어

**Feature**: 005-cards-schema-types
**Date**: 2026-02-27

---

## 기존 타입 정의 (src/types/cards.ts — 변경 없음)

아래 엔티티들은 `src/types/cards.ts`에 이미 정의되어 있으며, 이 이슈에서는 수정하지 않는다. Zod 스키마는 이 타입 구조와 1:1 대응되도록 설계한다.

### CardVisual

| 필드 | 타입 | 제약 |
|------|------|------|
| `bg_from` | string | 유효한 hex 색상값 (`#RGB` 또는 `#RRGGBB`) |
| `bg_via` | string | 유효한 hex 색상값 |
| `bg_to` | string | 유효한 hex 색상값 |
| `accent` | string | 유효한 hex 색상값 |

### CardSource

| 필드 | 타입 | 제약 |
|------|------|------|
| `title` | string | 필수 |
| `url` | string | 필수 |
| `domain` | string | 필수 |

### CommunityQuote

| 필드 | 타입 | 제약 |
|------|------|------|
| `text` | string | 필수 |
| `mood` | string | 필수 |

### StatsItem

| 필드 | 타입 | 제약 |
|------|------|------|
| `label` | string | 필수 |
| `value` | string | 필수 |
| `change` | string | 선택적 |

---

## 카드 타입별 스키마

### CoverCard (`type: 'cover'`)

| 필드 | 타입 | 제약 |
|------|------|------|
| `id` | number | 필수, 정수 |
| `type` | `'cover'` | 리터럴 고정 |
| `tag` | string | 필수 |
| `title` | string | 필수 |
| `sub` | string | 필수 |
| `visual` | CardVisual | 필수, 모든 하위 필드 hex 검증 |

### ReasonCard (`type: 'reason'`)

| 필드 | 타입 | 제약 |
|------|------|------|
| `id` | number | 필수, 정수 |
| `type` | `'reason'` | 리터럴 고정 |
| `tag` | string | 필수 |
| `title` | string | 필수 |
| `body` | string | 필수 |
| `stat` | string | **선택적** |
| `visual` | CardVisual | 필수, hex 검증 |
| `sources` | CardSource[] | 필수, **최소 1개** |

### BullishCard (`type: 'bullish'`)

ReasonCard와 동일한 필드 구조, `type: 'bullish'` 고정.

### BearishCard (`type: 'bearish'`)

ReasonCard와 동일한 필드 구조, `type: 'bearish'` 고정.

### CommunityCard (`type: 'community'`)

| 필드 | 타입 | 제약 |
|------|------|------|
| `id` | number | 필수, 정수 |
| `type` | `'community'` | 리터럴 고정 |
| `tag` | string | 필수 |
| `title` | string | 필수 |
| `quotes` | CommunityQuote[] | 필수, **최소 1개** |
| `visual` | CardVisual | 필수, hex 검증 |

### StatsCard (`type: 'stats'`)

| 필드 | 타입 | 제약 |
|------|------|------|
| `id` | number | 필수, 정수 |
| `type` | `'stats'` | 리터럴 고정 |
| `tag` | string | 필수 |
| `title` | string | 필수 |
| `items` | StatsItem[] | 필수 |
| `visual` | CardVisual | 필수, hex 검증 |

### SourceCard (`type: 'source'`)

| 필드 | 타입 | 제약 |
|------|------|------|
| `id` | number | 필수, 정수 |
| `type` | `'source'` | 리터럴 고정 |
| `tag` | string | 필수 |
| `sources` | CardSource[] | 필수 |
| `visual` | CardVisual | 필수, hex 검증 |

---

## 배열 레벨 제약 (cards[])

| 제약 | 값 |
|------|----|
| 최소 카드 수 | 3 |
| 최대 카드 수 | 7 |
| 첫 번째 카드 타입 | `cover` |
| 마지막 카드 타입 | `source` |

---

## 검증 결과 타입 (신규)

```text
ParseCardsResult =
  | { success: true;  data: Card[] }     ← 유효한 배열
  | { success: true;  data: null }       ← cards_data가 null
  | { success: false; errors: string[] } ← 위반 항목 목록
```

---

## Zod 스키마 구성 전략

1. `hexColor` — 재사용 가능한 hex 검증 스키마 (`#RGB` / `#RRGGBB`)
2. `cardVisualSchema` — `hexColor` 4개 필드
3. `cardSourceSchema`, `communityQuoteSchema`, `statsItemSchema` — 보조 스키마
4. 개별 카드 스키마 (`coverCardSchema`, `reasonCardSchema`, …)
5. `cardSchema` — `z.discriminatedUnion('type', [...])` 로 7종 통합
6. `cardsArraySchema` — 배열 + min(3) + max(7) + 순서 제약 (`.refine()`)
7. `parseCards(json: unknown): ParseCardsResult` — 공개 검증 함수
8. 타입 가드: `isCoverCard`, `isReasonCard`, … (총 7개)

---

## 상태 전이

이 이슈는 저장소 쓰기 작업이 없다. 검증 결과는 호출 측에서 분기 처리한다.
