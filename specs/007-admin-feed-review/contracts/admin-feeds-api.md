# API Contract: Admin Feeds

**Branch**: `007-admin-feed-review`
**Auth**: 세션 쿠키 (`admin_session`) 필수 — 미들웨어에서 1차 검증, API 라우트에서 `requireAdminSession` 재검증

---

## GET /api/admin/feeds

피드 목록을 최신 날짜 우선으로 반환한다.

### Request

```
GET /api/admin/feeds
Cookie: admin_session=<token>
```

Query parameters: 없음 (기본 limit=30)

### Response — 200 OK

```typescript
{
  feeds: Array<{
    id: string            // uuid
    date: string          // "YYYY-MM-DD"
    status: "draft" | "published"
    publishedAt: string | null  // ISO 8601 또는 null
    issueCount: number
  }>
}
```

**Example**:
```json
{
  "feeds": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "date": "2026-03-03",
      "status": "draft",
      "publishedAt": null,
      "issueCount": 5
    },
    {
      "id": "660e8400-e29b-41d4-a716-446655440001",
      "date": "2026-03-02",
      "status": "published",
      "publishedAt": "2026-03-02T14:00:00Z",
      "issueCount": 6
    }
  ]
}
```

### Response — 401 Unauthorized

```json
{ "error": "unauthorized" }
```

### Response — 500 Internal Server Error

```json
{ "error": "internal_error" }
```

---

## GET /api/admin/feeds/[date]

날짜별 피드와 이슈 목록을 반환한다. `[date]`는 `YYYY-MM-DD` 형식.

### Request

```
GET /api/admin/feeds/2026-03-03
Cookie: admin_session=<token>
```

### Response — 200 OK

```typescript
{
  date: string              // 요청한 날짜 "YYYY-MM-DD"
  feed: {
    id: string
    date: string
    status: "draft" | "published"
    publishedAt: string | null
    issueCount: number
  } | null                  // 해당 날짜 피드가 없으면 null
  issues: Array<{
    id: string              // uuid
    title: string
    entityName: string
    entityType: "stock" | "index" | "fx" | "theme"
    status: "draft" | "approved" | "rejected"
    displayOrder: number
    cardCount: number
    cardsData: Card[] | null   // parseCards 성공 시 Card[], 실패 또는 null이면 null
    cardsParseError: boolean   // cards_data가 있으나 파싱 실패 시 true
  }>
}
```

**Example** (피드 있음):
```json
{
  "date": "2026-03-03",
  "feed": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "date": "2026-03-03",
    "status": "draft",
    "publishedAt": null,
    "issueCount": 2
  },
  "issues": [
    {
      "id": "abc-001",
      "title": "삼성전자 +3.2% 급등",
      "entityName": "삼성전자",
      "entityType": "stock",
      "status": "draft",
      "displayOrder": 1,
      "cardCount": 5,
      "cardsData": [...],
      "cardsParseError": false
    }
  ]
}
```

**Example** (피드 없음):
```json
{
  "date": "2026-01-01",
  "feed": null,
  "issues": []
}
```

### Response — 400 Bad Request (날짜 형식 오류)

```json
{ "error": "invalid_date", "message": "날짜 형식은 YYYY-MM-DD여야 합니다" }
```

### Response — 401 Unauthorized

```json
{ "error": "unauthorized" }
```

### Response — 500 Internal Server Error

```json
{ "error": "internal_error" }
```

---

## 공통 규칙

- 모든 Admin API는 세션 쿠키 미보유 또는 만료/손상 시 `401`을 반환한다.
- `cards_data`는 서버에서 `parseCards()`로 검증 후 반환한다. 파싱 실패 시 `cardsData: null`, `cardsParseError: true`로 클라이언트에 전달한다.
- DB 오류 시 `500`을 반환하며 세부 오류 메시지를 클라이언트에 노출하지 않는다.
