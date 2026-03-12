# Implementation Plan: 공개 피드 API

**Branch**: `015-public-feed-api` | **Date**: 2026-03-12 | **Spec**: [spec.md](./spec.md)

## Summary

`GET /api/feeds/latest`, `GET /api/feeds/[date]`, `GET /api/issues/[id]` 세 공개 Route Handler의 스텁을 실제 Supabase DB 조회로 교체한다. 데이터 접근 로직은 `src/lib/public/feeds.ts`에 분리하고, 각 핸들러는 HTTP 계층(파라미터 검증, 상태 코드)만 담당한다. 공개 노출 조건(`feeds.status = 'published'`, `issues.status = 'approved'`)을 코드 레이어에서 명시적으로 적용한다.

## Technical Context

**Language/Version**: TypeScript 5.4+ / Node.js 20+
**Primary Dependencies**: Next.js 15 (App Router Route Handlers), `@supabase/supabase-js` ^2.0, `@supabase/ssr` ^0.5, `zod` ^4.3 (날짜 파라미터 검증용)
**Storage**: Supabase PostgreSQL — `feeds`, `issues`, `issue_tags`, `tags` 테이블 (읽기 전용)
**Testing**: Vitest — `vi.mock('@/lib/supabase/server')` 패턴
**Target Platform**: Vercel (Next.js App Router)
**Project Type**: web-service
**Performance Goals**: 피드 첫 화면 LCP 2.5초 이하 (SRS 8.1 기준)
**Constraints**: N+1 쿼리 금지, `display_order` 오름차순 정렬, `published`/`approved` 필터 코드 레이어 적용
**Scale/Scope**: 초기 수십 명 규모, 단일 Vercel 인프라

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| 원칙 | 상태 | 비고 |
|------|------|------|
| I. Code Quality | ✅ | lib/route 분리, Admin 패턴과 일관된 네이밍 |
| II. Tests | ✅ | lib 함수 단위 테스트 + route handler 테스트 필수 |
| III. UX Consistency | ✅ | HTTP 상태 코드 일관성 (400/404/500), 오류 메시지 형식 통일 |
| IV. Performance | ✅ | 2-step 쿼리로 N+1 방지, 태그 batch fetch |
| V. Small & Verifiable | ✅ | 기존 스텁 파일 교체 단위의 좁은 범위 |

## Project Structure

### Documentation (this feature)

```text
specs/015-public-feed-api/
├── plan.md              # This file
├── research.md          # Phase 0 output ✅
├── data-model.md        # Phase 1 output ✅
├── quickstart.md        # Phase 1 output ✅
├── contracts/
│   └── public-feed-api.md  # Phase 1 output ✅
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
src/
├── lib/
│   └── public/
│       └── feeds.ts              # NEW: 공개 피드 데이터 접근 함수
└── app/
    └── api/
        ├── feeds/
        │   ├── latest/
        │   │   └── route.ts      # MODIFY: 스텁 → 실제 구현
        │   └── [date]/
        │       └── route.ts      # MODIFY: 스텁 → 실제 구현
        └── issues/
            └── [id]/
                └── route.ts      # MODIFY: 스텁 → 실제 구현

tests/
└── unit/
    ├── lib/
    │   └── public-feeds.test.ts                  # NEW
    └── api/
        ├── public-feeds-latest-route.test.ts      # NEW
        ├── public-feeds-date-route.test.ts        # NEW
        └── public-issues-id-route.test.ts         # NEW
```

**Structure Decision**: Admin과 동일한 lib/route 분리 패턴. `src/lib/public/` 네임스페이스를 신설하여 admin과 명확히 구분.
