# Data Model: 공개 피드 API

## 기존 DB 스키마 (읽기 전용)

이 기능은 기존 테이블을 읽기 전용으로 사용한다. 스키마 변경 없음.

### 관련 테이블

```
feeds
├── id: uuid (PK)
├── date: date (unique)
├── status: 'draft' | 'published'     ← 공개 조건: 'published'
└── published_at: timestamptz | null

issues
├── id: uuid (PK)
├── feed_id: uuid → feeds.id
├── channel: string                    (MVP: 'v1' 고정)
├── entity_type: 'stock'|'index'|'fx'|'theme'
├── entity_id: string
├── entity_name: string
├── title: string
├── change_value: string | null
├── status: 'draft'|'approved'|'rejected'  ← 공개 조건: 'approved'
├── display_order: int                 (피드 내 노출 순서, 오름차순)
├── cards_data: jsonb                  (Card[] 배열)
└── created_at: timestamptz

tags
├── id: uuid (PK)
├── name: string (unique)
└── created_by: 'ai' | 'operator'

issue_tags (N:M 조인)
├── issue_id: uuid → issues.id
└── tag_id: uuid → tags.id
```

---

## 애플리케이션 레이어 타입 (`src/lib/public/feeds.ts`)

### `PublicIssueSummary`

`/api/feeds/[date]` 응답의 각 이슈 항목:

```typescript
type PublicIssueSummary = {
  id: string
  entityType: 'stock' | 'index' | 'fx' | 'theme'
  entityId: string
  entityName: string
  title: string
  changeValue: string | null
  channel: string
  displayOrder: number
  cardsData: Card[] | null   // parseCards 성공 시 Card[], 실패/null이면 null
  tags: string[]              // 태그 이름 배열
}
```

### `PublicIssueDetail`

`/api/issues/[id]` 응답:

```typescript
type PublicIssueDetail = {
  id: string
  feedDate: string             // 이슈가 속한 피드 날짜 (YYYY-MM-DD)
  entityType: 'stock' | 'index' | 'fx' | 'theme'
  entityId: string
  entityName: string
  title: string
  changeValue: string | null
  channel: string
  cardsData: Card[] | null
  tags: string[]
}
```

---

## 공개 노출 조건 요약

```
공개 이슈 = feeds.status = 'published'
           AND issues.status = 'approved'
           AND issues.feed_id = feeds.id
```

이 조건을 코드 레이어에서 명시적으로 적용하여 RLS 설정과 무관하게 안전성 보장.
