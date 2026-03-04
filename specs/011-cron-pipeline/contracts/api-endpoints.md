# API Contracts: Cron 파이프라인 엔드포인트

**Branch**: `011-cron-pipeline` | **Date**: 2026-03-03

---

## 1. `GET /api/cron/pipeline`

**목적**: Vercel Cron이 매일 KST 22:00(UTC 13:00)에 호출하는 자동 파이프라인 엔드포인트.

**인증**: `Authorization: Bearer <CRON_SECRET>` 헤더 필수

**요청**:
```
GET /api/cron/pipeline
Authorization: Bearer {CRON_SECRET}
```

**성공 응답** `200 OK`:
```json
{
  "ok": true,
  "date": "2026-03-03",
  "articles_collected": 24,
  "issues_created": 5,
  "errors": [],
  "duration_ms": 45230
}
```

**부분 성공 응답** `200 OK` (일부 실패 포함):
```json
{
  "ok": true,
  "date": "2026-03-03",
  "articles_collected": 18,
  "issues_created": 3,
  "errors": [
    { "source": "매경", "message": "RSS fetch timeout" },
    { "source": "AI generation", "message": "Claude API error for entity '카카오'" }
  ],
  "duration_ms": 62100
}
```

**인증 오류** `401 Unauthorized`:
```json
{ "error": "unauthorized" }
```

**중복 실행 거부** `409 Conflict`:
```json
{ "error": "pipeline_already_running", "started_at": "2026-03-03T13:00:12Z" }
```

**서버 오류** `500 Internal Server Error`:
```json
{ "error": "pipeline_failed", "message": "..." }
```

---

## 2. `POST /api/admin/pipeline/run`

**목적**: Admin이 수동으로 파이프라인을 트리거하는 엔드포인트.

**인증**: 세션 쿠키(`admin_session`) 필수

**요청**:
```
POST /api/admin/pipeline/run
Cookie: admin_session={session_token}
Content-Type: application/json

{}
```

**성공 응답** `202 Accepted` (비동기 실행 시작):
```json
{
  "ok": true,
  "log_id": "uuid",
  "date": "2026-03-03",
  "message": "파이프라인 실행이 시작되었습니다."
}
```

**인증 오류** `401 Unauthorized`:
```json
{ "error": "unauthorized" }
```

**중복 실행 거부** `409 Conflict`:
```json
{ "error": "pipeline_already_running", "started_at": "2026-03-03T13:00:12Z" }
```

---

## 3. `GET /api/admin/pipeline/logs`

**목적**: 파이프라인 실행 이력 목록 조회.

**인증**: 세션 쿠키(`admin_session`) 필수

**요청**:
```
GET /api/admin/pipeline/logs?limit=20&page=1
Cookie: admin_session={session_token}
```

**쿼리 파라미터**:
| 파라미터 | 타입 | 기본값 | 설명 |
|---------|------|--------|------|
| `limit` | int | 20 | 페이지당 항목 수 (최대 100) |
| `page` | int | 1 | 페이지 번호 (1부터 시작) |

**성공 응답** `200 OK`:
```json
{
  "logs": [
    {
      "id": "uuid",
      "date": "2026-03-03",
      "status": "success",
      "triggered_by": "cron",
      "started_at": "2026-03-03T13:00:05Z",
      "completed_at": "2026-03-03T13:00:51Z",
      "articles_collected": 24,
      "issues_created": 5,
      "errors": []
    },
    {
      "id": "uuid",
      "date": "2026-03-02",
      "status": "partial",
      "triggered_by": "admin",
      "started_at": "2026-03-02T09:15:30Z",
      "completed_at": "2026-03-02T09:16:42Z",
      "articles_collected": 15,
      "issues_created": 3,
      "errors": [
        { "source": "매경", "message": "RSS fetch timeout" }
      ]
    }
  ],
  "total": 42,
  "page": 1,
  "limit": 20
}
```

**인증 오류** `401 Unauthorized`:
```json
{ "error": "unauthorized" }
```

---

## 공통 규칙

- 모든 응답: `Content-Type: application/json`
- 날짜 형식: `YYYY-MM-DD` (KST 기준)
- 타임스탬프 형식: ISO 8601 UTC (`YYYY-MM-DDTHH:MM:SSZ`)
- HTTP 상태 코드 의미:
  - `200`: 완료 (성공 또는 부분 성공)
  - `202`: 비동기 실행 시작 수락
  - `401`: 인증 실패
  - `409`: 중복 실행 거부
  - `500`: 서버 내부 오류
