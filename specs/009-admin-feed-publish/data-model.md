# Data Model: Admin 피드 발행 워크플로우 (009)

**Date**: 2026-03-17

## 관련 엔티티 (기존 스키마)

### Feed (`feeds` 테이블)

| 필드 | 타입 | 변경 여부 | 설명 |
|------|------|---------|------|
| `id` | uuid | 읽기 전용 | 피드 식별자 |
| `date` | date | 읽기 전용 | 날짜 (YYYY-MM-DD) |
| `status` | text | **쓰기** | `'draft'` → `'published'` |
| `published_at` | timestamptz | **쓰기** | 발행 시각 (null → now()) |
| `created_at` | timestamptz | 읽기 전용 | 생성 시각 |

**상태 전이**:
```
draft ──[publishFeed()]──▶ published
(이미 published 상태에서 publishFeed() 호출 시 FeedAlreadyPublishedError)
```

### Issue (`issues` 테이블)

| 필드 | 타입 | 변경 여부 | 설명 |
|------|------|---------|------|
| `id` | uuid | 읽기 전용 | 이슈 식별자 |
| `feed_id` | uuid | 읽기 전용 | 소속 피드 FK |
| `status` | text | 읽기 전용 (이 기능에서) | `'draft'`, `'approved'`, `'rejected'` |

**발행 가능 조건**: 해당 피드에 `status = 'approved'`인 이슈가 1건 이상 존재

## 비즈니스 로직: publishFeed(date)

```
Input: date (YYYY-MM-DD)

1. SELECT id, status FROM feeds WHERE date = $date
   → 없으면: throw FeedNotFoundError
   → status !== 'draft': throw FeedAlreadyPublishedError

2. SELECT COUNT(*) FROM issues WHERE feed_id = $feed.id AND status = 'approved'
   → count === 0: throw NoApprovedIssuesError

3. UPDATE feeds
   SET status = 'published', published_at = now()
   WHERE id = $feed.id AND status = 'draft'  ← 낙관적 잠금 조건
   RETURNING id, status, published_at
```

> **낙관적 잠금**: UPDATE WHERE 절에 `status = 'draft'` 조건을 포함하여 동시 발행 시 한 번만 성공하도록 보장. affected rows가 0이면 이미 발행된 것으로 처리.

## API 응답 형태

### POST /api/admin/feeds/[date]/publish

**성공 응답 (200)**:
```json
{
  "date": "2026-03-17",
  "status": "published",
  "publishedAt": "2026-03-17T13:45:00.000Z"
}
```

**오류 응답**:
```json
{ "error": "not_found" }                  // 404
{ "error": "already_published" }          // 409
{ "error": "no_approved_issues" }         // 422
{ "error": "internal_error" }             // 500
```

## 타입 정의 (TypeScript)

`src/lib/admin/feeds.ts`에 추가:

```typescript
export class FeedNotFoundError extends Error { ... }
export class FeedAlreadyPublishedError extends Error { ... }
export class NoApprovedIssuesError extends Error { ... }

export type PublishFeedResult = {
  date: string
  status: 'published'
  publishedAt: string // ISO 8601
}

export async function publishFeed(date: string): Promise<PublishFeedResult>
```
