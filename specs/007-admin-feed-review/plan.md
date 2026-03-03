# Implementation Plan: Admin 피드 목록/날짜별 이슈 검토 화면

**Branch**: `007-admin-feed-review` | **Date**: 2026-03-03 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `specs/007-admin-feed-review/spec.md`

---

## Summary

Admin 인증(#6) 위에서 `/admin` 피드 목록 화면과 `/admin/feed/[date]` 날짜별 이슈 검토 화면을 구현한다. 이 기능은 읽기 전용이며, 기존 `feeds`·`issues` DB 테이블을 조회하여 상태 표시, 카드 미리보기 확장/축소를 제공한다. 이슈 편집·승인·발행은 #8/#9에서 구현한다.

---

## Technical Context

**Language/Version**: TypeScript 5.4+ / Node.js 20+
**Primary Dependencies**: Next.js 15 (App Router, Server Components, Route Handlers), React 19, Tailwind CSS v4, @supabase/supabase-js, @supabase/ssr, Zod v3
**Storage**: Supabase PostgreSQL (`feeds`, `issues` 테이블 — 읽기 전용)
**Testing**: Vitest (unit: API 로직·컴포넌트, integration: 피드 목록→이슈 흐름)
**Target Platform**: Vercel (server-rendered, 데스크톱 기준)
**Project Type**: Web application (full-stack Next.js, Admin internal tool)
**Performance Goals**: SC-001/SC-002: 3초 이내 화면 표시
**Constraints**: 세션 쿠키 인증 필수, 읽기 전용, 데스크톱 기준 UI, 피드 30건 limit
**Scale/Scope**: 운영자 1인, 최근 30일 피드, 이슈 ~10건/day

---

## Constitution Check

*GATE: 구현 전 통과 확인 완료*

| 헌법 원칙 | 상태 | 근거 |
| --------- | ---- | ---- |
| I. 코드 품질 (읽기 가능, 모듈화) | ✅ | Server Component + 최소 Client Component 분리, 함수 단위 분리 |
| II. 테스트 필수 | ✅ | API 라우트 로직 단위 테스트 + 카드 미리보기 컴포넌트 테스트 + 통합 흐름 테스트 |
| III. UX 일관성 | ✅ | 기존 `bg-surface`, 레이아웃 패턴 준수, 상태별 배지 일관 적용 |
| IV. 성능 | ✅ | N+1 방지 (COUNT 집계 쿼리), 단일 쿼리로 이슈 목록 조회, SC-001/SC-002 3초 기준 |
| V. 작고 가역적인 변경 | ✅ | 읽기 전용 기능, 기존 stub 확장, 신규 테이블 없음 |

*Constitution Check — 위반 없음. Complexity Tracking 불필요.*

---

## Project Structure

### Documentation (this feature)

```text
specs/007-admin-feed-review/
├── plan.md              ← 이 파일
├── spec.md
├── research.md          ← Phase 0 완료
├── data-model.md        ← Phase 1 완료
├── quickstart.md        ← Phase 1 완료
├── contracts/
│   └── admin-feeds-api.md  ← Phase 1 완료
└── tasks.md             ← /speckit.tasks 실행 후 생성
```

### Source Code (repository root)

```text
src/
├── app/
│   ├── (admin)/
│   │   ├── layout.tsx                     # 내비게이션 추가
│   │   └── admin/
│   │       ├── page.tsx                   # 피드 목록 화면 (Server Component)
│   │       └── feed/
│   │           └── [date]/
│   │               └── page.tsx           # 날짜별 이슈 검토 화면 (Server Component)
│   └── api/
│       └── admin/
│           └── feeds/
│               ├── route.ts               # GET /api/admin/feeds (구현)
│               └── [date]/
│                   └── route.ts           # GET /api/admin/feeds/[date] (구현)
├── components/
│   └── features/
│       └── admin/
│           ├── FeedList.tsx               # 피드 목록 컴포넌트 (Server)
│           ├── FeedListItem.tsx           # 피드 항목 컴포넌트 (Server)
│           ├── IssueList.tsx              # 이슈 목록 컴포넌트 (Server)
│           ├── IssueListItem.tsx          # 이슈 항목 + 카드 미리보기 (Client)
│           └── StatusBadge.tsx            # 상태 배지 컴포넌트 (Server)
└── lib/
    └── admin/
        └── feeds.ts                       # Admin 피드/이슈 조회 함수 (신규)

tests/
├── unit/
│   └── lib/
│       └── admin-feeds.test.ts            # feeds.ts 단위 테스트
└── integration/
    └── admin-feed-review.test.ts          # API 라우트 통합 테스트
```

**Structure Decision**: Next.js App Router 단일 레포 구조. 기존 `(admin)` 라우트 그룹 내 확장. Admin 전용 컴포넌트는 `src/components/features/admin/`에 위치. DB 조회 로직은 `src/lib/admin/feeds.ts`로 분리하여 API 라우트·Server Component 양쪽에서 재사용.

---

## Phase 0: Research 완료

→ [research.md](research.md) 참조. NEEDS CLARIFICATION 없음. 7개 결정 문서화 완료.

---

## Phase 1: Design 완료

→ [data-model.md](data-model.md): 엔티티 타입, 쿼리 설계, 상태 전이 정의
→ [contracts/admin-feeds-api.md](contracts/admin-feeds-api.md): API 계약 (요청/응답/에러 형식)
→ [quickstart.md](quickstart.md): 개발 환경 설정, 체크포인트, 파일 참조

---

## 구현 순서 (tasks.md 선행)

1. `src/lib/admin/feeds.ts` — DB 조회 함수 (`getAdminFeeds`, `getAdminFeedByDate`)
2. `GET /api/admin/feeds` — route.ts stub 구현
3. `GET /api/admin/feeds/[date]` — route.ts stub 구현
4. `StatusBadge` 컴포넌트
5. `FeedList`, `FeedListItem` 컴포넌트
6. `/admin` 피드 목록 페이지
7. `IssueList`, `IssueListItem` (Client Component — 카드 미리보기 accordion)
8. `/admin/feed/[date]` 날짜별 이슈 페이지
9. `AdminLayout` 내비게이션 추가
10. 단위 테스트 + 통합 테스트
11. `npm run validate` + `npm run test` 통과 확인
