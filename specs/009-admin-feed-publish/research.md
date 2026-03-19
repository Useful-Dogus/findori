# Research: Admin 피드 발행 워크플로우 (009)

**Date**: 2026-03-17
**Branch**: 009-admin-feed-publish

## 1. 기존 코드 패턴 분석

### Decision: API Route 구조
- **What**: `POST /api/admin/feeds/[date]/publish` 스텁이 이미 존재함
- **Pattern**: 기존 `PATCH /api/admin/issues/[id]/route.ts` 동일 패턴 사용
  - `requireAdminSession(request)` → 인증 검증
  - `createAdminClient()` → Supabase 관리자 클라이언트 (RLS 우회)
  - `NextResponse.json(...)` → 표준 응답
- **Rationale**: 프로젝트 내 일관된 Admin API 패턴 유지
- **Alternatives considered**: 직접 Supabase RPC 사용 → 기존 패턴과 불일치, 기각

### Decision: 비즈니스 로직 위치
- **What**: `src/lib/admin/feeds.ts`에 `publishFeed(date: string)` 함수 추가
- **Rationale**: 기존 `updateIssueStatus()`, `updateIssueCards()`가 `src/lib/admin/issues.ts`에 있는 것처럼, Feed 관련 로직은 `src/lib/admin/feeds.ts`에서 관리
- **Error classes**: 기존 `IssueNotFoundError` 패턴을 따라 도메인별 에러 클래스 추가
  - `FeedNotFoundError`
  - `FeedAlreadyPublishedError`
  - `NoApprovedIssuesError`

### Decision: UI 컴포넌트 구조
- **What**: `PublishFeedButton` Client Component 신규 생성
- **Pattern**: 기존 `IssueListItem` 패턴 참조
  - `useState`로 로컬 상태(loading, error, success) 관리
  - `fetch()` API 호출 후 `useRouter().refresh()`로 Server Component 재렌더링
- **Rationale**: 발행 버튼은 독립된 관심사이므로 별도 컴포넌트로 분리 → 테스트·재사용 용이
- **Integration point**: `/admin/feed/[date]/page.tsx` Server Component에서 `PublishFeedButton`을 포함

### Decision: 발행 조건 검증
- **What**: 서버 사이드에서 검증 (클라이언트 검증은 UX 보조용으로만)
- **Rationale**: 보안상 클라이언트 검증만으로 데이터 무결성을 보장할 수 없음
- **Logic**:
  1. date로 feed 조회 → 없으면 404
  2. `feed.status !== 'draft'` → 409 already_published
  3. 해당 feed_id의 approved 이슈 수 카운트 → 0이면 422 no_approved_issues
  4. 모두 통과 시 `status = 'published'`, `published_at = NOW()` 업데이트

### Decision: 에러 코드 체계
| HTTP | error 코드 | 상황 |
|------|-----------|------|
| 401 | `unauthorized` | 세션 없음/만료 |
| 404 | `not_found` | 해당 날짜 피드 없음 |
| 409 | `already_published` | 이미 published 상태 |
| 422 | `no_approved_issues` | 승인된 이슈 0건 |
| 500 | `internal_error` | 예외 처리 불가 오류 |

### Decision: 발행 후 UI 갱신 방식
- **What**: `router.refresh()` (Next.js App Router 내장)
- **Rationale**: Server Component 데이터를 재패치하여 최신 상태 표시. 별도 클라이언트 상태 동기화 불필요
- **Alternatives considered**: 낙관적 업데이트(optimistic update) → 간단한 1회성 액션에 과도함, 기각

## 2. 기존 코드 재사용 목록

| 재사용 대상 | 위치 | 용도 |
|-----------|------|------|
| `requireAdminSession` | `src/lib/admin/session.ts` | 인증 검증 |
| `createAdminClient` | `src/lib/supabase/admin.ts` | DB 쓰기 클라이언트 |
| `getAdminFeedByDate` | `src/lib/admin/feeds.ts` | 피드 + 이슈 조회 (조회용 재사용) |
| `StatusBadge` | `src/components/features/admin/StatusBadge.tsx` | 발행 상태 표시 |

## 3. 테스트 전략

### Unit Tests (Vitest)
- `publishFeed()` 함수:
  - happy path: draft 피드 + approved 이슈 → published 전환 확인
  - `FeedNotFoundError`: 존재하지 않는 date
  - `FeedAlreadyPublishedError`: 이미 published 피드
  - `NoApprovedIssuesError`: approved 이슈 0건

### Integration Tests
- `POST /api/admin/feeds/[date]/publish`:
  - 세션 없음 → 401
  - 없는 날짜 → 404
  - already published → 409
  - no approved issues → 422
  - 정상 발행 → 200 + body `{ date, status: 'published', publishedAt }`

### Manual Verification
- Admin UI에서 draft 피드의 발행 버튼 클릭 후 상태 전환 확인
- 공개 피드 API(`/api/feeds/[date]`)에서 해당 날짜 이슈 조회 확인
