# API Contracts: Findori MVP

**Branch**: `002-tech-baseline-setup` | **Date**: 2026-02-27
**Source**: `docs/mvp/srs.md § 7`

모든 API는 Next.js Route Handlers로 구현. 응답 형식: JSON. 인증 방식: 세션 쿠키 (Admin API).

---

## 공개 API (인증 불필요)

### GET /api/feeds/latest

최신 발행 피드 날짜 조회.

**응답**

```json
{
  "date": "2026-02-27"
}
```

**에러**

```json
// 발행된 피드 없음
{ "error": "no_published_feed" }  // 404
```

---

### GET /api/feeds/[date]

날짜별 피드 (이슈 목록 + 카드 데이터).

**파라미터**: `date` — `YYYY-MM-DD` 형식

**응답**

```json
{
  "date": "2026-02-27",
  "status": "published",
  "issues": [
    {
      "id": "uuid",
      "entity_type": "stock",
      "entity_id": "005930",
      "entity_name": "삼성전자",
      "title": "삼성전자, 외국인 순매도로 -2.1%",
      "change_value": "-2.1%",
      "order": 1,
      "tags": ["반도체", "외국인"],
      "cards_data": [
        {
          "id": 1,
          "type": "cover",
          "tag": "속보",
          "title": "삼성전자\n오늘 -2.1%",
          "sub": "외국인 순매도 · 2026-02-27",
          "visual": {
            "bg_from": "#0f172a",
            "bg_via": "#1e3a5f",
            "bg_to": "#0f172a",
            "accent": "#3B82F6"
          }
        }
      ]
    }
  ]
}
```

**에러**

```json
// 날짜 형식 오류
{ "error": "invalid_date" }  // 400

// 해당 날짜 피드 없음
{ "error": "feed_not_found" }  // 404
```

---

### GET /api/issues/[id]

특정 이슈 조회 (공유 링크 진입용).

**파라미터**: `id` — issue UUID

**응답**

```json
{
  "id": "uuid",
  "feed_date": "2026-02-27",
  "entity_type": "stock",
  "entity_name": "삼성전자",
  "title": "삼성전자, 외국인 순매도로 -2.1%",
  "change_value": "-2.1%",
  "tags": ["반도체", "외국인"],
  "cards_data": [ /* Card[] */ ]
}
```

**에러**

```json
{ "error": "issue_not_found" }  // 404
```

---

### GET /api/og/issue/[id]

OG 이미지 동적 생성 (SNS 공유 썸네일).

**파라미터**: `id` — issue UUID

**응답**: `Content-Type: image/png`, 1200×630

---

## Admin API (세션 쿠키 인증 필요)

모든 `/api/admin/*` 경로는 Next.js Middleware에서 세션 쿠키를 검증한다.
인증 실패 시 `401 Unauthorized` 반환.

### POST /api/admin/auth/login

비밀번호 검증 후 세션 쿠키 발급.

**요청**

```json
{ "password": "string" }
```

**응답**

```json
// 성공
{ "ok": true }  // 200 + Set-Cookie: session=...; HttpOnly; Secure; SameSite=Strict; Max-Age=604800

// 실패
{ "error": "invalid_password" }  // 401
```

---

### POST /api/admin/auth/logout

세션 쿠키 삭제.

**응답**: `200 OK` (쿠키 삭제)

---

### GET /api/admin/feeds

피드 목록 (날짜, 상태).

**응답**

```json
{
  "feeds": [
    {
      "date": "2026-02-27",
      "status": "published",
      "issue_count": 5,
      "published_at": "2026-02-27T10:00:00Z"
    }
  ]
}
```

---

### GET /api/admin/feeds/[date]

날짜별 이슈 목록 (draft 포함).

**응답**: 공개 API 응답 구조와 동일하나, `status: 'draft' | 'approved' | 'rejected'` 포함.

---

### POST /api/admin/feeds/[date]/publish

해당 날짜 피드 발행. `approved` 상태 이슈만 묶어서 `published` 전환.

**응답**

```json
// 성공
{ "ok": true, "published_at": "2026-02-27T10:00:00Z" }

// 승인된 이슈 없음
{ "error": "no_approved_issues" }  // 422
```

---

### PATCH /api/admin/issues/[id]

이슈 상태 변경.

**요청**

```json
{ "status": "approved" }  // 또는 "rejected"
```

**응답**: `{ "ok": true }` | `{ "error": "..." }`

---

### PUT /api/admin/issues/[id]

이슈 내용 수정 (텍스트, cards_data, 순서).

**요청**

```json
{
  "title": "string",
  "change_value": "string",
  "order": 1,
  "cards_data": [ /* Card[] */ ]
}
```

**응답**: `{ "ok": true }` | `{ "error": "..." }`

---

### GET /api/admin/sources

화이트리스트 매체 목록.

**응답**

```json
{
  "sources": [
    { "id": "uuid", "name": "한국경제", "rss_url": "https://...", "active": true }
  ]
}
```

---

### POST /api/admin/sources

매체 추가.

**요청**: `{ "name": "string", "rss_url": "string" }`

**응답**: `{ "id": "uuid", "name": "...", "rss_url": "...", "active": true }` | `{ "error": "..." }`

---

### PATCH /api/admin/sources/[id]

매체 활성/비활성.

**요청**: `{ "active": false }`

**응답**: `{ "ok": true }` | `{ "error": "..." }`

---

### POST /api/admin/pipeline/run

파이프라인 수동 트리거.

**응답**

```json
// 성공
{ "ok": true, "job_id": "uuid" }

// 이미 실행 중
{ "error": "pipeline_running" }  // 409
```

---

### GET /api/admin/pipeline/logs

파이프라인 실행 로그 목록.

**응답**

```json
{
  "logs": [
    {
      "id": "uuid",
      "started_at": "2026-02-27T13:00:00Z",
      "finished_at": "2026-02-27T13:03:45Z",
      "status": "success",
      "issues_created": 8,
      "errors": []
    }
  ]
}
```

---

## Cron 엔드포인트

### GET /api/cron/pipeline

Vercel Cron 자동 호출 (매일 KST 22:00 = UTC 13:00).

**인증**: `Authorization: Bearer <CRON_SECRET>` 헤더 필수.

**요청 헤더**

```
Authorization: Bearer <CRON_SECRET>
```

**응답**

```json
// 성공
{ "ok": true, "issues_created": 8, "duration_ms": 45231 }

// 인증 실패
{ "error": "unauthorized" }  // 401

// 이미 실행 중 (중복 방지)
{ "error": "pipeline_running" }  // 409
```

---

## 공통 오류 형식

```json
{
  "error": "error_code",
  "message": "사람이 읽을 수 있는 설명 (선택적)"
}
```

| HTTP 코드 | 의미 |
|-----------|------|
| 400 | 잘못된 요청 (파라미터 형식 오류 등) |
| 401 | 인증 실패 |
| 404 | 리소스 없음 |
| 409 | 상태 충돌 (중복 실행 등) |
| 422 | 처리 불가 (승인 이슈 없이 발행 시도 등) |
| 500 | 서버 오류 |
