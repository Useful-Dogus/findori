# Implementation Plan: 공개 라우팅/SSR 진입 플로우

**Branch**: `016-public-routing-ssr` | **Date**: 2026-03-19 | **Spec**: [spec.md](./spec.md)

## Summary

비로그인 공개 사용자가 `/`, `/feed/[date]`, `/feed/[date]/issue/[id]` 경로로 진입할 때 SSR로 피드 데이터를 사전 로드하여 즉시 렌더링되는 진입 플로우를 구현한다. 이미 완성된 공개 피드 API 함수들(`getLatestPublishedDate`, `getPublicFeedByDate`, `getPublicIssueById`)을 Server Component에서 직접 호출하고, 각 라우트 stub을 실구현으로 교체하며, 빈 상태/에러 상태 컴포넌트를 추가한다.

## Technical Context

**Language/Version**: TypeScript 5.4+ / Node.js 20+
**Primary Dependencies**: Next.js 15 (App Router, Server Components, generateMetadata), React 19, Tailwind CSS v4, `@supabase/supabase-js` ^2.0, `@supabase/ssr` ^0.5
**Storage**: Supabase PostgreSQL — `feeds`, `issues`, `issue_tags`, `tags` 테이블 (읽기 전용)
**Testing**: Vitest (기존 설치)
**Target Platform**: Web (Vercel)
**Project Type**: web-service
**Performance Goals**: 공유 링크 SSR TTFB ≤ 1s, 홈 리다이렉트 ≤ 2s
**Constraints**: 비인증 접근, `await cookies()` 필수(Next.js 15), `params: Promise<{...}>` async params
**Scale/Scope**: 수십 명 규모 MVP

## Constitution Check

| 원칙 | 검증 결과 | 비고 |
|------|-----------|------|
| I. 코드 품질 | ✅ PASS | Server Component 직접 패칭, 명확한 상태 분기 |
| II. 테스트 | ✅ PASS | `isValidDate` 단위 테스트, 상태 컴포넌트 렌더링 확인 |
| III. UX 일관성 | ✅ PASS | loading/empty/error 세트 전체 구현, 홈 CTA 일관 제공 |
| IV. 성능 | ✅ PASS | SSR로 초기 HTML에 데이터 삽입, 클라이언트 fetch 없음 |
| V. 소규모 점진 | ✅ PASS | 기존 stub 파일 교체 방식, 롤백 용이 |

**Constitution violations**: 없음

## Project Structure

### Documentation (this feature)

```text
specs/016-public-routing-ssr/
├── plan.md              ← 이 파일
├── research.md          ← Phase 0 완료
├── data-model.md        ← Phase 1 완료
├── contracts/
│   └── page-contracts.md  ← Phase 1 완료
└── tasks.md             ← /speckit.tasks 명령으로 생성
```

### Source Code (변경/신규 파일)

```text
src/
├── app/
│   ├── page.tsx                                      ← 수정: server-side redirect 구현
│   └── (public)/
│       └── feed/
│           ├── latest/
│           │   └── page.tsx                          ← 신규: /feed/latest alias
│           └── [date]/
│               ├── page.tsx                          ← 수정: SSR 데이터 패칭 + generateMetadata
│               ├── loading.tsx                       ← 신규: 스켈레톤 로딩 UI
│               └── issue/
│                   └── [id]/
│                       ├── page.tsx                  ← 수정: SSR 데이터 패칭 + generateMetadata
│                       └── loading.tsx               ← 신규: 스켈레톤 로딩 UI
└── components/
    └── features/
        └── feed/
            ├── FeedView.tsx                          ← 신규: 피드 렌더링 컨테이너 (Client Component stub)
            ├── FeedEmptyState.tsx                    ← 신규: 빈 상태 UI
            └── FeedErrorState.tsx                    ← 신규: 에러 상태 UI

tests/
└── unit/
    └── public/
        └── isValidDate.test.ts                       ← 신규: 날짜 검증 유틸 단위 테스트
```

**Structure Decision**: Next.js App Router 규약(라우트 파일은 `app/`, 재사용 컴포넌트는 `components/features/`)을 유지하며, 기존 stub을 교체하는 최소 변경 방식으로 구현한다.

## Implementation Steps

### Step 1: 단위 테스트 작성 (`isValidDate`)
- `tests/unit/public/isValidDate.test.ts` 작성
- 케이스: 유효 날짜, 잘못된 형식, 실존하지 않는 날짜, 경계값
- 기존 함수가 이미 구현되어 있으므로 테스트만 추가

### Step 2: 상태 컴포넌트 구현
- `src/components/features/feed/FeedEmptyState.tsx` — 빈 상태 UI, 홈 CTA 포함
- `src/components/features/feed/FeedErrorState.tsx` — 에러 UI, 새로고침/홈 CTA 포함

### Step 3: FeedView 클라이언트 컴포넌트 stub 생성
- `src/components/features/feed/FeedView.tsx` — Client Component stub
- Props: `{ date: string; issues: PublicIssueSummary[]; initialIssueId?: string }`
- 이 스펙에서는 이슈 목록 표시 수준의 최소 stub. 카드 렌더링은 #17/#18에서 구현.

### Step 4: 루트 페이지 (`/`) 교체
- `src/app/page.tsx` 수정
- Server Component: `getLatestPublishedDate()` 호출 → redirect 또는 empty/error 상태 반환

### Step 5: `/feed/latest` 라우트 신규 생성
- `src/app/(public)/feed/latest/page.tsx` 생성
- 루트 페이지와 동일한 로직: 최신 날짜로 redirect

### Step 6: `/feed/[date]` 페이지 교체
- `src/app/(public)/feed/[date]/page.tsx` 수정
- `isValidDate` → `notFound()` / `getPublicFeedByDate` 호출 → 상태 분기
- `generateMetadata` 추가

### Step 7: `/feed/[date]` loading.tsx 생성
- 스켈레톤 로딩 UI

### Step 8: `/feed/[date]/issue/[id]` 페이지 교체
- `src/app/(public)/feed/[date]/issue/[id]/page.tsx` 수정
- `getPublicIssueById(id)` → null 체크 → `feedDate` vs URL `date` 대조
- `getPublicFeedByDate(date)` 호출 → `initialIssueId` 포함 FeedView 렌더링
- `generateMetadata` 추가

### Step 9: `/feed/[date]/issue/[id]` loading.tsx 생성
- 스켈레톤 로딩 UI

### Step 10: 품질 게이트
- `npm run validate` (typecheck + lint + format:check)
- `npm run test` (Vitest)
- `npm run build`

## Key Design Decisions

1. **Server Component 직접 패칭**: Server Component에서 `getPublicFeedByDate()` 등을 직접 `await` 호출. 별도 Route Handler를 거치지 않아 불필요한 레이어 제거.

2. **notFound() vs 상태 컴포넌트 분기**:
   - 유효하지 않은 날짜 형식, 존재하지 않는 이슈 ID → `notFound()` (HTTP 404)
   - 발행된 피드 없는 날짜, API 오류 → 상태 컴포넌트 렌더링 (HTTP 200, 사용자 친화적 UI)

3. **FeedView stub**: 이 스펙에서 FeedView는 최소 stub이다. `initialIssueId` prop을 받는 인터페이스만 확정하고, 실제 카드 렌더링/스와이프는 #17/#18에서 구현한다.

4. **OG 태그 og:image**: 정적 `/og-default.png` 사용. 동적 OG 이미지는 #25에서 구현.
