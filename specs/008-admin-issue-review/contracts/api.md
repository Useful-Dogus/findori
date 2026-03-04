# API Contracts: Admin 이슈 편집/순서조정/승인·반려 (Feature 008)

**Generated**: 2026-03-04
**Base path**: `/api/admin/issues/[id]`

---

## 공통 사항

### 인증
모든 엔드포인트는 `admin_session` 쿠키가 유효해야 한다. 없거나 만료된 경우:
```
HTTP 401 Unauthorized
{ "error": "unauthorized" }
```

### Content-Type
요청: `application/json`
응답: `application/json`

---

## PATCH /api/admin/issues/[id]

이슈 상태(draft/approved/rejected)를 변경한다.

### 요청

```http
PATCH /api/admin/issues/{id}
Cookie: admin_session=<token>
Content-Type: application/json

{
  "status": "approved"
}
```

**Path parameters**
| 파라미터 | 타입 | 설명 |
|---------|------|------|
| id | string (UUID) | 이슈 ID |

**Body**
| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| status | `"draft"` \| `"approved"` \| `"rejected"` | 필수 | 변경할 상태 |

### 응답

**200 OK** — 상태 변경 성공
```json
{
  "id": "uuid",
  "status": "approved"
}
```

**400 Bad Request** — status 값이 유효하지 않음
```json
{
  "error": "invalid_body",
  "message": "status는 draft, approved, rejected 중 하나여야 합니다"
}
```

**401 Unauthorized** — 인증 없음
```json
{ "error": "unauthorized" }
```

**404 Not Found** — 해당 id의 이슈 없음
```json
{ "error": "not_found" }
```

**500 Internal Server Error**
```json
{ "error": "internal_error" }
```

---

## PUT /api/admin/issues/[id]

이슈의 카드 데이터(cards_data) 전체를 갱신한다.
카드 텍스트 수정과 카드 순서 변경 모두 이 엔드포인트로 처리한다.

### 요청

```http
PUT /api/admin/issues/{id}
Cookie: admin_session=<token>
Content-Type: application/json

{
  "cards": [
    {
      "id": 1,
      "type": "cover",
      "tag": "반도체",
      "title": "삼성전자 주가 5% 상승",
      "sub": "AI 수혜 기대감에 외국인 순매수 유입",
      "visual": {
        "bg_from": "#0f172a",
        "bg_via": "#1e3a5f",
        "bg_to": "#0c4a6e",
        "accent": "#38bdf8"
      }
    }
  ]
}
```

**Path parameters**
| 파라미터 | 타입 | 설명 |
|---------|------|------|
| id | string (UUID) | 이슈 ID |

**Body**
| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| cards | Card[] | 필수 | 갱신할 카드 배열 전체 (순서 포함) |

**cards 검증 규칙** (서버 사이드, `parseCards()` 함수 적용)
- 최소 3장, 최대 7장
- 첫 번째 카드 type = 'cover' 필수
- 마지막 카드 type = 'source' 필수
- 각 카드의 type별 필수 필드 완비
- visual 필드: 4개 hex 색상 필수 (`#RGB` 또는 `#RRGGBB`)

### 응답

**200 OK** — 카드 갱신 성공
```json
{
  "id": "uuid",
  "cards": [ /* 저장된 cards_data */ ]
}
```

**400 Bad Request** — cards 배열이 유효하지 않음
```json
{
  "error": "invalid_body",
  "message": "0.title: 값이 필요합니다"
}
```

**401 Unauthorized**
```json
{ "error": "unauthorized" }
```

**404 Not Found**
```json
{ "error": "not_found" }
```

**500 Internal Server Error**
```json
{ "error": "internal_error" }
```

---

## 클라이언트 소비 패턴

### P1: 이슈 상태 변경 (승인/반려)

```typescript
// 낙관적 업데이트 패턴
const handleStatusChange = async (newStatus: 'approved' | 'rejected' | 'draft') => {
  const prevStatus = localStatus
  setLocalStatus(newStatus)      // 즉시 UI 반영
  setIsStatusChanging(true)       // 버튼 비활성화

  try {
    const res = await fetch(`/api/admin/issues/${issue.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
    if (!res.ok) throw new Error()
  } catch {
    setLocalStatus(prevStatus)   // 롤백
    // 실패 알림 표시
  } finally {
    setIsStatusChanging(false)   // 버튼 활성화
  }
}
```

### P2/P3: 카드 저장 (텍스트 수정 또는 순서 변경 후)

```typescript
// 단일 카드 저장 (해당 카드만 수정 후 전체 배열 전송)
const handleCardSave = async (cardId: number, updatedCard: Card) => {
  const updatedCards = cardsState.map(c => c.id === cardId ? updatedCard : c)
  setIsSavingCard(true)

  try {
    const res = await fetch(`/api/admin/issues/${issue.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cards: updatedCards }),
    })
    if (!res.ok) throw new Error()
    setCardsState(updatedCards)  // 성공 시 로컬 상태 갱신
    setEditingCardId(null)       // 편집 모드 종료
  } catch {
    setCardSaveError('저장에 실패했습니다. 다시 시도해주세요.')
  } finally {
    setIsSavingCard(false)
  }
}
```
