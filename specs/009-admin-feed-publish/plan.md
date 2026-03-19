# Implementation Plan: Admin 피드 발행 워크플로우

**Branch**: `009-admin-feed-publish` | **Date**: 2026-03-17 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/009-admin-feed-publish/spec.md`

## Summary

Admin UI에서 운영자가 검토 완료한 피드를 `draft`에서 `published`로 전환하는 발행 워크플로우를 구현한다. 기존 `PATCH /api/admin/issues/[id]` 패턴을 따라 `POST /api/admin/feeds/[date]/publish` API Route를 완성하고, 피드 날짜 페이지에 `PublishFeedButton` Client Component를 추가한다.

## Technical Context

**Language/Version**: TypeScript 5.4+ / Node.js 20+
**Primary Dependencies**: Next.js 15 (App Router, Route Handlers), React 19, `@supabase/supabase-js` ^2.0, `@supabase/ssr` ^0.5, Zod (입력 검증 불필요 — path param만 사용)
**Storage**: Supabase PostgreSQL — `feeds` 테이블 (status, published_at 업데이트), `issues` 테이블 (approved count 조회)
**Testing**: Vitest (기존 설정)
**Target Platform**: Vercel (Next.js 서버리스 함수)
**Project Type**: web-service (Admin UI + API Route Handler)
**Performance Goals**: 발행 응답 3초 이내 (SC-002)
**Constraints**: 발행 원자성 보장 (부분 발행 없음), 인증 필수
**Scale/Scope**: 1인 운영자, 일 1회 실행

## Constitution Check

| 원칙 | 준수 여부 | 근거 |
|------|---------|------|
| I. Code Quality | PASS | 기존 패턴 일관 적용, 도메인 에러 클래스 분리 |
| II. Tests | PASS | `publishFeed()` unit test + API integration test 포함 |
| III. UX Consistency | PASS | 기존 Admin UI 컴포넌트 패턴 (StatusBadge, 버튼 스타일) 준수 |
| IV. Performance | PASS | DB 쿼리 2회 (feed 조회 + approved count) → N+1 없음 |
| V. Small & Verifiable | PASS | 3개 파일 수정 + 1개 신규 컴포넌트, 독립적으로 배포 가능 |

## Project Structure

### Documentation (this feature)

```text
specs/009-admin-feed-publish/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── contracts/
│   └── api.md           # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (변경 대상)

```text
src/
├── lib/
│   └── admin/
│       └── feeds.ts            # publishFeed() 추가 + 에러 클래스 3종
├── app/
│   ├── api/
│   │   └── admin/
│   │       └── feeds/
│   │           └── [date]/
│   │               └── publish/
│   │                   └── route.ts   # 501 스텁 → 완성
│   └── (admin)/
│       └── admin/
│           └── feed/
│               └── [date]/
│                   └── page.tsx       # PublishFeedButton 추가
└── components/
    └── features/
        └── admin/
            └── PublishFeedButton.tsx  # 신규 Client Component

tests/
└── unit/
    └── lib/
        └── admin/
            └── feeds.publish.test.ts  # publishFeed() 단위 테스트 (신규)
```

## Implementation Breakdown

### Step 1: `publishFeed()` 비즈니스 로직 (src/lib/admin/feeds.ts)

추가 내용:
- `FeedNotFoundError`, `FeedAlreadyPublishedError`, `NoApprovedIssuesError` 에러 클래스
- `publishFeed(date: string): Promise<PublishFeedResult>` 함수
  1. `feeds` 조회 by date → `FeedNotFoundError` (없으면)
  2. `status !== 'draft'` → `FeedAlreadyPublishedError`
  3. `issues` approved count → `NoApprovedIssuesError` (0이면)
  4. `UPDATE feeds SET status='published', published_at=now() WHERE id=$id AND status='draft'`

### Step 2: API Route 완성 (src/app/api/admin/feeds/[date]/publish/route.ts)

501 스텁을 완전한 구현으로 교체:
- `requireAdminSession` → 401
- `isValidDate(date)` 검증 → 400 (잘못된 날짜 형식)
- `publishFeed(date)` 호출
- 에러 클래스별 HTTP 코드 매핑

### Step 3: PublishFeedButton 컴포넌트 (신규)

`src/components/features/admin/PublishFeedButton.tsx`:
- `'use client'`
- props: `date: string`, `isPublished: boolean`
- 상태: `isLoading`, `error`
- 발행 버튼: `isPublished` 시 비활성화 (published 배지 표시)
- 클릭 → `POST /api/admin/feeds/{date}/publish` → 성공 시 `router.refresh()`
- 에러 메시지: `no_approved_issues` → "승인된 이슈가 없습니다", `already_published` → "이미 발행된 피드입니다"

### Step 4: 피드 날짜 페이지에 버튼 연결

`src/app/(admin)/admin/feed/[date]/page.tsx`:
- `<PublishFeedButton date={feed.date} isPublished={feed.status === 'published'} />` 추가
- 헤더 영역 (h1 + StatusBadge 옆)에 배치

### Step 5: 단위 테스트

`tests/unit/lib/admin/feeds.publish.test.ts`:
- `publishFeed()` happy path
- `FeedNotFoundError` 발생 케이스
- `FeedAlreadyPublishedError` 발생 케이스
- `NoApprovedIssuesError` 발생 케이스

## Complexity Tracking

해당 없음 — 모든 Constitution 원칙 통과, 단순 패턴 확장 구현.
