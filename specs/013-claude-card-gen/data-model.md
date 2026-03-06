# Data Model: Claude 카드 생성 모듈

**Phase**: 1 (Design & Contracts)
**Date**: 2026-03-06
**Branch**: `013-claude-card-gen`

---

## 개요

이 기능은 신규 DB 테이블이나 스키마 변경 없이, 기존 `issues.cards_data` JSONB 컬럼에 올바른 구조의 데이터를 채우는 것이 목적이다. 데이터 모델 변경은 **TypeScript 타입** 레벨에만 존재한다.

---

## 신규 TypeScript 타입

### `ContextMarketData` (`src/types/pipeline.ts`에 추가)

```
ContextMarketData {
  entityId: string          // 지수/환율 식별자 (예: 'KOSPI', 'NASDAQ', 'USD-KRW')
  entityName: string        // 표시명 (예: '코스피', '나스닥', '달러-원')
  entityType: 'index' | 'currency'
  value: string             // 현재 수치 (예: '2,650.25')
  change: string            // 변동값 (예: '+12.50')
  changePercent: string     // 변동률 (예: '+0.47%')
}
```

---

## 기존 타입 (변경 없음)

### `CollectedArticle` (`src/types/pipeline.ts`)

`generateIssues()` 입력. 기존 타입 그대로 사용.

```
CollectedArticle {
  sourceId: string
  sourceName: string
  sourceUrl: string
  url: string
  title: string
  summary: string
  content: string
  publishedAt: string | null
}
```

### `GeneratedIssueDraft` (`src/types/pipeline.ts`)

두 생성 함수(`generateIssues`, `generateContextIssues`)의 공통 출력 타입. 변경 없음.

```
GeneratedIssueDraft {
  entityId: string
  entityName: string
  entityType: 'stock' | 'index' | 'currency' | 'theme'
  title: string
  cards: Card[]                 // parseCards()로 검증된 배열
  changeValue: string | null
  channel: string               // MVP: 'v1'
}
```

### `Card` 유니온 타입 (`src/types/cards.ts`)

7개 타입의 discriminated union. 수정 없음.

| type | 필수 필드 | sources 필수 |
|------|-----------|-------------|
| `cover` | id, type, tag, title, sub, visual | 없음 |
| `reason` | id, type, tag, title, body, visual, sources | ✅ 1개+ |
| `bullish` | id, type, tag, title, body, visual, sources | ✅ 1개+ |
| `bearish` | id, type, tag, title, body, visual, sources | ✅ 1개+ |
| `community` | id, type, tag, title, quotes, visual | 없음 |
| `stats` | id, type, tag, title, items, visual | 없음 |
| `source` | id, type, tag, sources, visual | 없음 |

### `CardVisual`

```
CardVisual {
  bg_from: string   // hex (#RGB 또는 #RRGGBB)
  bg_via: string    // hex
  bg_to: string     // hex
  accent: string    // hex
}
```

---

## 함수 인터페이스

### `generateIssues()` (수정)

```
generateIssues(
  articles: CollectedArticle[],
  deps?: { anthropic?: AnthropicClientLike }
) → Promise<{ issues: GeneratedIssueDraft[], errors: PipelineError[] }>
```

- `articles`가 빈 배열이면 AI 호출 없이 즉시 `{ issues: [], errors: [] }` 반환
- 내부적으로 `buildSystemPrompt()` + `buildPrompt(articles)` 조합으로 AI 호출
- 각 생성 이슈의 channel 기본값: `'v1'`

### `generateContextIssues()` (신규)

```
generateContextIssues(
  contextData: ContextMarketData[],
  deps?: { anthropic?: AnthropicClientLike }
) → Promise<{ issues: GeneratedIssueDraft[], errors: PipelineError[] }>
```

- `contextData`가 빈 배열이면 AI 호출 없이 즉시 `{ issues: [], errors: [] }` 반환
- `generateIssues()`와 동일한 tool_use 패턴, 다른 user prompt 사용
- 각 생성 이슈의 `entityType`은 반드시 `'index'` 또는 `'currency'`

---

## 검증 레이어 (변경 없음)

`parseCards()` (`src/lib/cards.ts`) — Zod 기반 런타임 검증. 두 생성 함수 모두 공통으로 사용.

검증 규칙 요약:
- cards 배열 길이: 3~7장
- cards[0].type === 'cover'
- cards[last].type === 'source'
- visual 모든 필드: `/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/` 매칭
- reason/bullish/bearish: sources 배열 최소 1개

---

## DB 스키마 변경 없음

`issues` 테이블의 `cards_data: jsonb` 컬럼, `entity_type`, `channel` 등 기존 컬럼 그대로 사용.
`store.ts`의 `insertDraftIssues()`는 `GeneratedIssueDraft`를 받아 저장 — 수정 불필요.

---

## 상태 전이

```
[기사 수집 완료] → generateIssues() → [GeneratedIssueDraft[]]
                                           ↓
                                    parseCards() 검증
                                    ├── 통과 → issues[]에 추가
                                    └── 실패 → errors[]에 추가 (해당 이슈 스킵)
                                           ↓
                                    insertDraftIssues() → DB issues 테이블 (status: 'draft')

[맥락 지표 데이터] → generateContextIssues() → [GeneratedIssueDraft[]]
                                                      ↓ (동일 흐름)
```
