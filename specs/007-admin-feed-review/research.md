# Research: Admin 피드 목록/날짜별 이슈 검토 화면

**Branch**: `007-admin-feed-review` | **Date**: 2026-03-03

NEEDS CLARIFICATION 없음 — 모든 기술 결정이 기존 코드베이스와 SRS에서 확인됨.

---

## Decision 1: Server Component 데이터 패칭 전략

**Decision**: Admin 페이지는 Server Component에서 Supabase 서버 클라이언트를 직접 호출한다. API 라우트를 경유하지 않는다.

**Rationale**:
- 미들웨어(`src/middleware.ts`)가 `/admin` 경로 진입 시 세션 검증을 이미 수행한다. Server Component에서 재검증이 불필요하다.
- Next.js 15 App Router의 Server Component는 동일 서버에서 DB를 직접 쿼리하므로 불필요한 HTTP 왕복이 없다.
- `src/lib/supabase/server.ts`의 `createClient()`가 이미 타입-세이프한 서버 클라이언트를 제공한다.

**Alternatives considered**:
- Server Component → API Route → Supabase: 불필요한 HTTP 왕복, 복잡도 증가. 기각.
- Client Component + SWR: 초기 데이터 없이 로딩 플리커 발생. Admin 내부 도구에서 SSR이 더 적합. 기각.

**Impact**: `GET /api/admin/feeds`, `GET /api/admin/feeds/[date]` stub도 구현하여 일관성 유지 (향후 클라이언트 재검증용).

---

## Decision 2: 카드 미리보기 인터랙션 — Client Component 범위

**Decision**: 이슈 카드 확장/축소(accordion)는 Client Component(`IssueCardPreview`)로 구현한다. 페이지 자체는 Server Component를 유지한다.

**Rationale**:
- FR-008은 클릭으로 카드 내용을 펼치는 인터랙션을 요구한다. `useState`가 필요하다.
- 페이지 전체를 Client Component로 만들면 서버 데이터 패칭 이점을 잃는다.
- Next.js 15 권장 패턴: 상태가 필요한 최소 단위만 `'use client'`로 분리.

**Alternatives considered**:
- HTML `<details>/<summary>` 네이티브 accordion: JavaScript 없이 동작하지만 상태 동기화(여러 개 중 하나만 열기 등)가 어렵다. 단순성 우선으로 MVP에서 허용 가능하나, 추후 확장성을 위해 Client Component 선택.

---

## Decision 3: 날짜 유효성 검증 위치

**Decision**: `YYYY-MM-DD` 형식 검증은 Server Component(`page.tsx`)에서 수행한다. 미들웨어에서 처리하지 않는다.

**Rationale**:
- 미들웨어는 인증 게이트 역할에 집중해야 한다(현재 설계 원칙).
- 잘못된 날짜는 404가 아닌 안내 메시지 + 피드 목록 이동 링크로 처리한다(FR-012, edge case).
- 정규식: `/^\d{4}-\d{2}-\d{2}$/` 검사 후 `Date` 파싱으로 실제 유효 날짜 여부 확인.

---

## Decision 4: 피드 목록 페이지네이션

**Decision**: MVP에서는 최근 30일 기준으로 DB 쿼리에 `limit(30)`을 적용한다. 페이지네이션 UI는 구현하지 않는다.

**Rationale**:
- spec 가정: "피드 목록은 최근 30일 이내 항목을 기본으로 표시한다."
- 운영 초기 (수십 명 규모)에서 30건 이하 항목이 예상된다.
- SC-001 기준 3초 내 표시 — 30건은 충분히 빠르다.

---

## Decision 5: Admin API 라우트 구현 방식

**Decision**: 기존 stub(`/api/admin/feeds`, `/api/admin/feeds/[date]`)에 실제 Supabase 쿼리를 구현한다. `requireAdminSession`은 유지한다.

**Rationale**:
- `GET /api/admin/feeds`는 이미 `requireAdminSession`이 적용된 stub으로 존재한다.
- API 라우트가 있어야 향후 클라이언트 사이드 재검증(SWR, React Query 등)이 가능하다.
- 일관된 데이터 접근 계층을 유지한다.

**`GET /api/admin/feeds` 쿼리 설계**:
```sql
SELECT
  feeds.id,
  feeds.date,
  feeds.status,
  feeds.published_at,
  COUNT(issues.id) AS issue_count
FROM feeds
LEFT JOIN issues ON issues.feed_id = feeds.id
GROUP BY feeds.id
ORDER BY feeds.date DESC
LIMIT 30
```

**`GET /api/admin/feeds/[date]` 쿼리 설계**:
```sql
SELECT
  issues.id,
  issues.title,
  issues.entity_name,
  issues.entity_type,
  issues.status,
  issues.display_order,
  issues.cards_data
FROM issues
JOIN feeds ON issues.feed_id = feeds.id
WHERE feeds.date = :date
ORDER BY issues.display_order ASC
```

---

## Decision 6: 이슈 상태 배지 색상

**Decision**: 상태별 배지를 Tailwind CSS v4 유틸리티로 구현한다.

| 상태       | 배지 의미         | 색상 방향       |
| ---------- | ----------------- | --------------- |
| `draft`    | 검토 대기         | 중립(gray)      |
| `approved` | 승인 완료         | 긍정(green)     |
| `rejected` | 반려              | 경고(red)       |

피드 상태:

| 상태        | 배지 의미         | 색상 방향       |
| ----------- | ----------------- | --------------- |
| `draft`     | 발행 전           | 중립(gray)      |
| `published` | 발행 완료         | 긍정(blue/green)|

---

## Decision 7: N+1 쿼리 방지

**Decision**: 피드 목록에서 이슈 수를 표시할 때 별도 N개의 쿼리가 아닌 집계 쿼리(COUNT + GROUP BY)를 사용한다. 이슈 목록에서 cards_data는 목록 레벨에서 전부 로드하되, 미리보기는 클라이언트 상태로 제어한다.

**Rationale**: SC-001/SC-002 3초 기준을 충족하려면 페이지 당 단일 쿼리로 충분한 데이터를 가져와야 한다. MVP 규모(30건 피드, ~10건 이슈)에서 cards_data 풀 로드는 허용 가능하다.
