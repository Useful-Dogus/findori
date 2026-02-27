# Quickstart: 카드 스키마 검증 레이어

**Feature**: 005-cards-schema-types

---

## 파일 위치

| 역할 | 경로 |
|------|------|
| 기존 타입 정의 (변경 없음) | `src/types/cards.ts` |
| Zod 스키마 + 검증 함수 + 타입 가드 | `src/lib/cards.ts` |
| 단위 테스트 | `tests/unit/lib/cards.test.ts` |

---

## 주요 exports (`src/lib/cards.ts`)

### `parseCards(json: unknown): ParseCardsResult`

DB에서 불러온 raw JSON(`cards_data`)을 검증하여 타입 보장 카드 배열을 반환합니다.

```ts
// 사용 예 — 서버 컴포넌트 또는 Route Handler
const result = parseCards(issue.cards_data)

if (!result.success) {
  // result.errors 에 위반 항목 목록이 있음
  console.error(result.errors)
  return null
}

const cards = result.data  // Card[] | null
```

- `cards_data`가 `null`이면 → `{ success: true, data: null }` 반환 (에러 없음)
- 유효하지 않으면 → `{ success: false, errors: string[] }` 반환
- 유효하면 → `{ success: true, data: Card[] }` 반환

---

### 타입 가드 함수

```ts
import { isCoverCard, isReasonCard, isBullishCard, isBearishCard,
         isCommunityCard, isStatsCard, isSourceCard } from '@/lib/cards'

// 렌더링 분기 예
for (const card of cards) {
  if (isCoverCard(card)) {
    // card는 CoverCard 타입으로 좁혀짐
  } else if (isReasonCard(card)) {
    // card는 ReasonCard
  }
  // ...
}
```

---

## 테스트 실행

```bash
npm run test                        # 전체 테스트
npx vitest run tests/unit/lib/cards # 카드 검증만
```

---

## 스키마 제약 요약

| 제약 | 규칙 |
|------|------|
| 카드 수 | 3 ≤ n ≤ 7 |
| 첫 번째 카드 | `type === 'cover'` |
| 마지막 카드 | `type === 'source'` |
| `visual.*` 색상 | `#RGB` 또는 `#RRGGBB` (hex만, Tailwind 클래스 불가) |
| `sources` (reason/bullish/bearish) | 최소 1개 이상 |
| `quotes` (community) | 최소 1개 이상 |
| `null` 입력 | 에러 없이 `data: null` 반환 |
