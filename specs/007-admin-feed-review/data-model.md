# Data Model: Admin 피드 목록/날짜별 이슈 검토 화면

**Branch**: `007-admin-feed-review` | **Date**: 2026-03-03

---

## 기존 DB 스키마 (읽기 전용)

이 기능은 신규 테이블을 생성하지 않는다. 기존 `feeds`, `issues` 테이블을 읽기 전용으로 조회한다.

### feeds 테이블

```
feeds
├── id: uuid (PK)
├── date: date (unique, YYYY-MM-DD)
├── status: string  — 'draft' | 'published'
├── published_at: timestamptz | null
└── created_at: timestamptz
```

### issues 테이블

```
issues
├── id: uuid (PK)
├── feed_id: uuid (FK → feeds.id)
├── title: string
├── entity_type: string  — 'stock' | 'index' | 'fx' | 'theme'
├── entity_id: string
├── entity_name: string
├── channel: string      — 'v1' (MVP 기본값)
├── status: string       — 'draft' | 'approved' | 'rejected'
├── display_order: number
├── cards_data: Json | null  — Card[] 직렬화
├── change_value: string | null
└── created_at: timestamptz
```

---

## 응용 레이어 타입 (이 기능에서 신규 정의)

### `AdminFeedSummary` — 피드 목록 항목

```typescript
type AdminFeedSummary = {
  id: string
  date: string           // 'YYYY-MM-DD'
  status: 'draft' | 'published'
  publishedAt: string | null  // ISO 8601
  issueCount: number
}
```

**출처**: `feeds` 테이블 + `COUNT(issues)` 집계

### `AdminIssueSummary` — 이슈 목록 항목

```typescript
type AdminIssueSummary = {
  id: string
  title: string
  entityName: string
  entityType: 'stock' | 'index' | 'fx' | 'theme'
  status: 'draft' | 'approved' | 'rejected'
  displayOrder: number
  cardCount: number        // cards_data 배열 길이
  cardsData: Card[] | null // parseCards 결과 (null if invalid)
  cardsParseError: boolean // cards_data 있으나 파싱 실패 시 true
}
```

**출처**: `issues` 테이블, `cards_data`는 `parseCards()` (기존 `src/lib/cards.ts`)로 검증

---

## API 응답 타입 (contracts와 동기화)

### `GET /api/admin/feeds` 응답

```typescript
type AdminFeedsResponse = {
  feeds: AdminFeedSummary[]
}
```

### `GET /api/admin/feeds/[date]` 응답

```typescript
type AdminFeedsDateResponse = {
  date: string              // 요청한 날짜 'YYYY-MM-DD'
  feed: AdminFeedSummary | null  // 해당 날짜 피드 (없으면 null)
  issues: AdminIssueSummary[]
}
```

---

## 상태 전이 (읽기 전용 — 이 기능에서는 변경 없음)

```
Feed 상태:
  draft ──(#9 발행)──► published

Issue 상태:
  draft ──(#8 승인)──► approved ──(#9 발행 후)──► (published feed에 포함)
       ──(#8 반려)──► rejected
```

이 기능(#7)에서는 상태를 읽기만 하며 변경하지 않는다.

---

## 쿼리 설계

### 피드 목록 쿼리 (`GET /api/admin/feeds`)

```typescript
const { data } = await supabase
  .from('feeds')
  .select(`
    id,
    date,
    status,
    published_at,
    issues(count)
  `)
  .order('date', { ascending: false })
  .limit(30)
```

Supabase 집계: `issues(count)` → `[{ count: N }]` 형태로 반환됨.

### 날짜별 이슈 목록 쿼리 (`GET /api/admin/feeds/[date]`)

```typescript
// Step 1: 피드 조회
const { data: feed } = await supabase
  .from('feeds')
  .select('id, date, status, published_at')
  .eq('date', date)
  .single()

// Step 2: 이슈 조회 (feed.id 사용)
const { data: issues } = await supabase
  .from('issues')
  .select('id, title, entity_name, entity_type, status, display_order, cards_data')
  .eq('feed_id', feed.id)
  .order('display_order', { ascending: true })
```

Step 1, 2를 병렬로 실행하거나 단일 join 쿼리로 대체 가능하나, 피드 존재 여부를 명확히 처리하기 위해 순차 실행을 선택한다.

---

## 날짜 유효성 검증

```typescript
function isValidDate(dateStr: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false
  const d = new Date(dateStr)
  return !isNaN(d.getTime()) && d.toISOString().startsWith(dateStr)
}
```

유효하지 않은 경우: 안내 UI + `/admin` 링크 노출. 404 처리 금지.
