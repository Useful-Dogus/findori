# Data Model: Admin 이슈 편집/순서조정/승인·반려 (Feature 008)

**Generated**: 2026-03-04
**Branch**: `008-admin-issue-review`

---

## 1. DB 엔티티 (기존, 수정 없음)

### 1.1 issues 테이블

```
issues {
  id            : UUID (PK)
  feed_id       : UUID (FK → feeds.id)
  title         : TEXT
  entity_id     : TEXT
  entity_name   : TEXT
  entity_type   : TEXT  -- 'stock' | 'index' | 'fx' | 'theme'
  status        : TEXT  -- 'draft' | 'approved' | 'rejected'
  display_order : INTEGER  -- 피드 내 이슈 순서 (이 기능 Out of Scope)
  cards_data    : JSONB    -- Card[] 직렬화 (null 가능)
  change_value  : TEXT (nullable)
  channel       : TEXT
  created_at    : TIMESTAMPTZ
}
```

이 기능에서 업데이트되는 컬럼:
- `status`: PATCH 엔드포인트로 변경
- `cards_data`: PUT 엔드포인트로 갱신 (카드 텍스트 수정 + 순서 변경 모두 cards_data 전체 교체)

---

## 2. 애플리케이션 레이어 타입

### 2.1 기존 (수정 없음)

```typescript
// src/lib/admin/feeds.ts — 읽기 전용
export type AdminIssueSummary = {
  id: string
  title: string
  entityName: string
  entityType: 'stock' | 'index' | 'fx' | 'theme'
  status: 'draft' | 'approved' | 'rejected'
  displayOrder: number
  cardCount: number
  cardsData: Card[] | null
  cardsParseError: boolean
}
```

### 2.2 신규 (src/lib/admin/issues.ts)

```typescript
// 상태 변경 함수 시그니처
export async function updateIssueStatus(
  id: string,
  status: 'draft' | 'approved' | 'rejected',
): Promise<void>

// 카드 데이터 갱신 함수 시그니처
export async function updateIssueCards(
  id: string,
  cards: Card[],
): Promise<void>
```

---

## 3. Card 스키마 (src/types/cards.ts — 수정 금지)

```
Card (discriminatedUnion on 'type')
├── CoverCard    : { id, type:'cover',     tag, title, sub,                visual }
├── ReasonCard   : { id, type:'reason',    tag, title, body, stat?,        visual, sources[] }
├── BullishCard  : { id, type:'bullish',   tag, title, body, stat?,        visual, sources[] }
├── BearishCard  : { id, type:'bearish',   tag, title, body, stat?,        visual, sources[] }
├── CommunityCard: { id, type:'community', tag, title, quotes[],           visual }
├── StatsCard    : { id, type:'stats',     tag, title, items[],            visual }
└── SourceCard   : { id, type:'source',    tag,        sources[],          visual }
```

### MVP 편집 가능 텍스트 필드 (카드 타입별)

| 카드 타입 | 편집 가능 | 읽기 전용 |
|-----------|----------|----------|
| cover | tag, title, sub | visual |
| reason | tag, title, body, stat | visual, sources |
| bullish | tag, title, body, stat | visual, sources |
| bearish | tag, title, body, stat | visual, sources |
| community | tag, title | visual, quotes (읽기 전용 표시) |
| stats | tag, title | visual, items (읽기 전용 표시) |
| source | tag | visual, sources (읽기 전용 표시) |

> **Note**: `visual` 필드(색상코드)는 MVP 편집 범위 외. `sources`, `quotes`, `items` 내부 복합 구조는 MVP에서 편집 불가 (읽기 전용으로만 표시).

---

## 4. 상태 전이

### 4.1 이슈 상태 머신

```
         approve         approve
  draft ──────────► approved ◄──────── rejected
    ▲                   │                  ▲
    │                   │ reject            │
    │                   ▼                  │
    └───────────── rejected ───────────────┘
                        │ approve
                        ▼
                     approved
```

허용 전이: `draft → approved`, `draft → rejected`, `approved → rejected`, `rejected → approved`

서버 사이드: 입력값(`status` 열거형)이 유효하면 전이 무조건 허용 (상태 기반 제한 없음 — 스펙 FR-003).

### 4.2 카드 순서 변경

카드 순서는 `cards_data` 배열의 인덱스로 결정된다.

- UI에서 위/아래 버튼으로 인접 카드와 교환
- "저장" 버튼 클릭 시 현재 카드 배열 전체를 PUT 엔드포인트로 전송
- 서버: `parseCards()` 검증 통과 시 `cards_data` 컬럼 전체 교체

---

## 5. API 요청/응답 타입

### 5.1 PATCH (상태 변경) 요청

```typescript
type PatchIssueStatusBody = {
  status: 'draft' | 'approved' | 'rejected'
}
```

### 5.2 PUT (카드 갱신) 요청

```typescript
type PutIssueCardsBody = {
  cards: Card[]
}
```

### 5.3 공통 오류 응답

```typescript
// 401 Unauthorized
{ error: 'unauthorized' }

// 400 Bad Request
{ error: 'invalid_body', message: string }

// 404 Not Found
{ error: 'not_found' }

// 500 Internal Server Error
{ error: 'internal_error' }
```

---

## 6. 컴포넌트 상태 모델

### 6.1 IssueListItem 로컬 상태

```typescript
type IssueListItemState = {
  // 기존
  open: boolean

  // 신규
  localStatus: 'draft' | 'approved' | 'rejected'  // 낙관적 업데이트
  isStatusChanging: boolean                         // 버튼 비활성화 플래그

  // 카드 편집 (카드별)
  cardsState: Card[]                               // 현재 카드 배열 (순서 포함)
  editingCardId: number | null                     // 현재 편집 중인 카드 ID
  cardDraft: Partial<Card> | null                  // 편집 중인 카드 임시값
  cardSaveError: string | null                     // 저장 실패 메시지
  isSavingCard: boolean                            // 카드 저장 진행 중
}
```
