# Research: Admin 이슈 편집/순서조정/승인·반려 (Feature 008)

**Generated**: 2026-03-04
**Branch**: `008-admin-issue-review`

---

## 1. Codebase Exploration

### 1.1 기존 구현 파악

#### 이슈 API 스텁
`src/app/api/admin/issues/[id]/route.ts`에 이미 PATCH, PUT 핸들러 스텁이 존재한다.

```typescript
// TODO(#8): Admin 이슈 편집/상태변경 구현
export async function PATCH(_request, { params }) → 501 not_implemented
export async function PUT(_request, { params })  → 501 not_implemented
```

- **Decision**: PATCH = 상태 변경(status), PUT = 카드 데이터 갱신(cards_data)으로 역할을 분리한다.
- **Rationale**: HTTP 의미론(PATCH = 부분 업데이트, PUT = 전체 교체)에 부합하며, 기존 스텁의 의도와 일치한다.

#### 세션 인증 패턴
`src/lib/admin/session.ts`의 `requireAdminSession(request)` 함수가 이미 존재한다.

```typescript
const session = await requireAdminSession(request)
if (!session.valid) return session.response  // 401 JSON
```

- **Decision**: 신규 핸들러 모두 동일 패턴으로 세션 검증을 선행한다.
- **Rationale**: `feeds/[date]/route.ts`와 완전히 동일한 패턴 — 프로젝트 컨벤션.

#### AdminIssueSummary 타입
`src/lib/admin/feeds.ts`에 정의된 애플리케이션 레이어 타입:

```typescript
export type AdminIssueSummary = {
  id: string
  status: 'draft' | 'approved' | 'rejected'
  cardsData: Card[] | null
  cardsParseError: boolean
  // ...
}
```

상태 변경 후 클라이언트에서 로컬 상태를 갱신하면 충분하다 (Server Component revalidation 불필요).

#### IssueListItem.tsx 확장 포인트
`src/components/features/admin/IssueListItem.tsx`는 Client Component(`'use client'`)다.

현재 구조:
- 헤더 영역 (status badge, title, entityName, cardCount)
- 아코디언 내부: 카드 목록 (읽기 전용 preview)

확장 필요 사항:
- 헤더에 승인/반려 버튼 추가
- 아코디언 내부 카드 행에 편집 UI 추가

#### Card 스키마 및 편집 가능 필드 분석

| 카드 타입 | 편집 가능 텍스트 필드 |
|-----------|----------------------|
| cover | tag, title, sub |
| reason | tag, title, body, stat? |
| bullish | tag, title, body, stat? |
| bearish | tag, title, body, stat? |
| community | tag, title, quotes[].text, quotes[].mood |
| stats | tag, title, items[].label, items[].value, items[].change? |
| source | tag (sources는 편집 불가 — URL 등 구조 데이터) |

MVP 편집 범위: `tag`, `title`, `sub`(cover), `body`(reason/bullish/bearish) 우선.
`quotes`, `items`, `sources` 내부 필드는 복잡도가 높아 MVP 보류 (스펙 Assumptions: 고정 스키마).

> **최종 결정**: MVP에서 카드 텍스트 편집 대상 = `tag` + type별 주요 텍스트 필드(`title`/`sub`/`body`/`stat`)만. `quotes`, `items`, `sources` 내부는 읽기 전용 표시.

### 1.2 데이터 모델 확인

DB 스키마 (`src/types/database.types.ts`):

```typescript
issues: {
  Row: {
    id: string
    status: string          // 'draft' | 'approved' | 'rejected'
    cards_data: Json | null // Card[] 직렬화
    display_order: number   // 피드 내 이슈 순서 (이 기능 Out of Scope)
    title: string
    ...
  }
}
```

카드 순서는 `cards_data` 배열 내 인덱스로 결정된다. `display_order`는 이슈 간 순서로 이 기능 범위 외.

---

## 2. 기술 결정 사항

### 2.1 API 분리 (PATCH vs PUT)

| 엔드포인트 | 용도 | 요청 바디 |
|-----------|------|----------|
| `PATCH /api/admin/issues/[id]` | 상태 변경 | `{ status: 'approved' \| 'rejected' \| 'draft' }` |
| `PUT /api/admin/issues/[id]` | 카드 데이터 갱신 | `{ cards: Card[] }` |

- **Rationale**: 단일 카드 저장 시에도 `cards_data` 전체 배열을 교체하는 방식 (PostgreSQL JSON 컬럼 특성상 부분 업데이트 불가). 클라이언트에서 현재 전체 배열 상태를 유지하고 저장 시 전송한다.

### 2.2 클라이언트 상태 관리

- `IssueListItem`은 이미 Client Component이며 `useState`를 사용한다.
- 상태 변경: 낙관적 업데이트(optimistic update) 적용 → API 완료 전 UI 즉시 반영, 실패 시 롤백.
- 카드 편집: 카드별 로컬 편집 상태(`editDraft`) 유지, 저장/취소로 확정/롤백.

### 2.3 서버 레이어 분리

새 데이터 접근 함수를 `src/lib/admin/issues.ts`에 분리:
- `updateIssueStatus(id, status)` — issues 테이블 status 컬럼 업데이트
- `updateIssueCards(id, cards)` — issues 테이블 cards_data 컬럼 업데이트

**Rationale**: `feeds.ts`가 읽기 전용으로 유지되어야 하며, 쓰기 로직은 별도 파일에 집중.

### 2.4 입력 검증 전략

- 상태 변경: Zod로 `status` 필드 열거형 검증
- 카드 갱신: `parseCards()` 함수(`src/lib/cards.ts` 기존 구현) 재사용 → 유효한 Card[] 배열만 저장
- 서버 사이드 검증 필수 (클라이언트 검증 우회 방지)

### 2.5 테스트 전략

- **Unit**: `updateIssueStatus`, `updateIssueCards` 함수 (Supabase 클라이언트 모킹)
- **Unit**: PATCH/PUT 핸들러 (세션 없음 → 401, 잘못된 바디 → 400, 정상 → 200)
- **Integration**: Vitest 환경에서 API 핸들러 동작 확인

---

## 3. 대안 검토

| 결정 | 채택 | 대안 | 대안 기각 이유 |
|------|------|------|--------------|
| 카드 순서 저장 방식 | cards_data 배열 전체 교체 | 카드별 순서 필드(DB) 추가 | 스키마 변경 없이 구현 가능, MVP 범위 최소화 |
| 상태 변경 UX | 낙관적 업데이트 | 저장 후 리로드 | SC-001 (2초 이내 반영) 충족 필요 |
| 카드 편집 모드 | 인라인 편집 (아코디언 내) | 모달/별도 페이지 | 스펙 Assumptions: 인라인 제공 명시 |
| 카드 복합 필드 편집 | MVP 제외 (quotes/items/sources) | 전체 편집 | 복잡도 대비 MVP 가치 낮음 |

---

## 4. 해결된 NEEDS CLARIFICATION

모두 `/speckit.clarify` 세션에서 해결됨:

- 저장 범위: **카드별 독립 저장** (이슈 단위 저장 아님)
- 태그 형식: **쉼표 구분 자유 텍스트** (MVP에서 필수 아님)
- 감사 로그: **MVP 제외** (DB `updated_at` 타임스탬프로 대체)
