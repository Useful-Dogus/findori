# API Contract: Admin 피드 발행

## POST /api/admin/feeds/{date}/publish

피드를 `draft`에서 `published`로 전환한다.

### 인증
- Admin 세션 쿠키 필수 (`admin_session`)
- 없거나 만료 시 401

### Path Parameters
| 파라미터 | 타입 | 예시 | 설명 |
|---------|------|------|------|
| `date` | string (YYYY-MM-DD) | `2026-03-17` | 발행할 피드 날짜 |

### Request Body
없음 (빈 POST)

### Success Response (200 OK)
```json
{
  "date": "2026-03-17",
  "status": "published",
  "publishedAt": "2026-03-17T13:45:00.000Z"
}
```

### Error Responses

| HTTP | error 코드 | 상황 |
|------|-----------|------|
| 401 | `unauthorized` | 세션 없음 또는 만료 |
| 404 | `not_found` | 해당 날짜 피드 없음 |
| 409 | `already_published` | 피드가 이미 published 상태 |
| 422 | `no_approved_issues` | 승인된 이슈(approved)가 0건 |
| 500 | `internal_error` | 서버 내부 오류 |

```json
{ "error": "<error_code>" }
```

### 멱등성
멱등하지 않음. 동일 date로 두 번 호출 시 두 번째는 409 응답.
