# API Contract: 공개 피드 API

**Version**: 1.0 (MVP)
**Auth**: 없음 (공개 읽기 전용)
**Base URL**: `/api`

---

## GET /api/feeds/latest

최신 발행 피드의 날짜를 반환한다.

### Response 200

```json
{ "date": "2026-03-12" }
```

`published` 상태의 피드가 없으면:

```json
{ "date": null }
```

---

## GET /api/feeds/[date]

날짜별 발행 피드 및 `approved` 이슈 목록을 반환한다.

### Path Parameter

| 파라미터 | 형식 | 예시 |
|----------|------|------|
| `date` | `YYYY-MM-DD` | `2026-03-12` |

### Response 200

```json
{
  "date": "2026-03-12",
  "issues": [
    {
      "id": "uuid",
      "entityType": "stock",
      "entityId": "005930",
      "entityName": "삼성전자",
      "title": "삼성전자, 외국인 순매도로 -2.1%",
      "changeValue": "-2.1%",
      "channel": "v1",
      "displayOrder": 1,
      "cardsData": [
        {
          "id": 1,
          "type": "cover",
          "tag": "속보",
          "title": "삼성전자 -2.1%",
          "sub": "외국인 순매도",
          "visual": {
            "bg_from": "#0f172a",
            "bg_via": "#1e3a5f",
            "bg_to": "#0f172a",
            "accent": "#3B82F6"
          }
        }
      ],
      "tags": ["반도체", "외국인"]
    }
  ]
}
```

### Response 400 — 날짜 형식 오류

```json
{ "error": "invalid_date", "message": "날짜 형식은 YYYY-MM-DD여야 합니다" }
```

### Response 404 — 발행된 피드 없음

```json
{ "error": "not_found", "message": "해당 날짜의 발행된 피드가 없습니다" }
```

### Response 500

```json
{ "error": "internal_error" }
```

---

## GET /api/issues/[id]

단일 이슈 상세 조회. 공유 링크 진입용.

### Path Parameter

| 파라미터 | 형식 | 예시 |
|----------|------|------|
| `id` | UUID | `550e8400-e29b-41d4-a716-446655440000` |

### Response 200

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "feedDate": "2026-03-12",
  "entityType": "stock",
  "entityId": "005930",
  "entityName": "삼성전자",
  "title": "삼성전자, 외국인 순매도로 -2.1%",
  "changeValue": "-2.1%",
  "channel": "v1",
  "cardsData": [ /* Card[] */ ],
  "tags": ["반도체", "외국인"]
}
```

### Response 404 — 없거나 비공개 이슈

```json
{ "error": "not_found", "message": "이슈를 찾을 수 없습니다" }
```

- 존재하지 않는 ID
- `draft` 또는 `rejected` 상태 이슈
- `published`가 아닌 피드에 속한 이슈

### Response 500

```json
{ "error": "internal_error" }
```

---

## 공통 규칙

- 모든 응답 Content-Type: `application/json`
- `cardsData`가 null이거나 파싱 실패한 이슈도 응답에 포함 (null로 전달)
- 날짜는 항상 `YYYY-MM-DD` 문자열 형식
