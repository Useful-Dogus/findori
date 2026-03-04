# Implementation Plan: Admin 이슈 편집/순서조정/승인·반려

**Branch**: `008-admin-issue-review` | **Date**: 2026-03-04 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/008-admin-issue-review/spec.md`

## Summary

Admin이 AI 생성 이슈 초안을 개별 승인/반려하고, 이슈 내 카드의 텍스트를 수정하며, 카드 순서를 조정할 수 있도록 기존 `IssueListItem` 아코디언 UI를 확장하고, 스텁 상태의 `PATCH`/`PUT /api/admin/issues/[id]` 핸들러를 완성한다. 카드 단위 저장, 낙관적 상태 업데이트, 중복 요청 방지를 포함한다.

## Technical Context

**Language/Version**: TypeScript 5.4+, Node.js 20+
**Primary Dependencies**: Next.js 15 (App Router, Route Handlers), React 19, Tailwind CSS v4, @supabase/supabase-js ^2.0, @supabase/ssr ^0.5, Zod v3
**Storage**: Supabase PostgreSQL — `issues` 테이블 (`status`, `cards_data` 컬럼 업데이트)
**Testing**: Vitest (unit)
**Target Platform**: Web (Admin 대시보드, 브라우저)
**Project Type**: web-service (Next.js 풀스택)
**Performance Goals**: 상태 변경 UI 반영 <2초 (SC-001), 카드 저장 확인 <2초 (SC-002)
**Constraints**: 카드별 독립 저장, last-write-wins(동시편집 잠금 없음), visual 필드 편집 불가
**Scale/Scope**: 운영자 1인, MVP

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Gate | Status | Notes |
|------|--------|-------|
| I. Code Quality — lint + format pass | ✅ PASS | 기존 ESLint flat config + Prettier 적용, 신규 파일도 동일 준수 |
| II. Tests — unit + integration required | ✅ PASS | `updateIssueStatus`, `updateIssueCards`, PATCH/PUT 핸들러 단위 테스트 계획 |
| III. UX Consistency — design system 준수 | ✅ PASS | 기존 `IssueListItem` Tailwind 다크테마 컨벤션 유지, 버튼/배지 패턴 재사용 |
| IV. Performance — N+1 방지, 최소 렌더링 | ✅ PASS | DB 업데이트 단건, 클라이언트 낙관적 업데이트로 리로드 없음 |
| V. Small Delivery — P1→P2→P3 단계 구현 | ✅ PASS | 3단계 분리, 각 단계 독립 테스트 가능 |

**Post-design re-check**: Phase 1 완료 후 동일 게이트 재확인 — 신규 컴포넌트 및 API 핸들러 모두 통과.

## Project Structure

### Documentation (this feature)

```text
specs/008-admin-issue-review/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/
│   └── api.md           # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
src/
├── app/api/admin/issues/[id]/
│   └── route.ts                        # 수정: PATCH(status) + PUT(cards) 구현
├── components/features/admin/
│   ├── IssueListItem.tsx               # 수정: 상태 버튼 + 카드 편집 통합
│   ├── IssueStatusActions.tsx          # 신규: 승인/반려 버튼 컴포넌트
│   └── CardEditForm.tsx                # 신규: 카드 인라인 편집 폼
└── lib/admin/
    ├── feeds.ts                        # 기존 (수정 없음 — 읽기 전용)
    └── issues.ts                       # 신규: updateIssueStatus, updateIssueCards

tests/
├── unit/lib/admin/
│   └── issues.test.ts                  # updateIssueStatus, updateIssueCards
└── unit/api/admin/
    ├── issues-patch.test.ts            # PATCH 핸들러 단위 테스트
    └── issues-put.test.ts              # PUT 핸들러 단위 테스트
```

**Structure Decision**: 단일 프로젝트(Next.js monolith). 쓰기 전용 서버 함수는 `lib/admin/issues.ts`로 분리하여 `feeds.ts`(읽기 전용) 불변성 유지. 신규 UI 컴포넌트는 기존 `components/features/admin/` 디렉터리에 병치.

## Phase 0: Research Summary

→ 상세 내용: [research.md](./research.md)

**핵심 결정:**
1. `PATCH` = status 변경, `PUT` = cards_data 전체 교체 (기존 스텁 의도 반영)
2. `requireAdminSession` 패턴 동일 적용 (프로젝트 컨벤션)
3. 카드 저장 시 전체 배열 교체 (`parseCards()` 기존 검증 함수 재사용)
4. 낙관적 업데이트로 SC-001 (<2초) 충족
5. MVP 카드 편집 범위: `tag`, `title`, `sub`(cover), `body`(reason/bullish/bearish) — `quotes`, `items`, `sources` 내부는 읽기 전용

## Phase 1: Design Artifacts

→ [data-model.md](./data-model.md) | [contracts/api.md](./contracts/api.md) | [quickstart.md](./quickstart.md)

**데이터 변경**: DB 스키마 변경 없음. `issues.status`, `issues.cards_data` 컬럼 업데이트만.

**API 계약**:
- `PATCH /api/admin/issues/[id]` — `{ status }` → 200 `{ id, status }` | 400 | 401 | 404
- `PUT /api/admin/issues/[id]` — `{ cards: Card[] }` → 200 `{ id, cards }` | 400 | 401 | 404

**구현 순서**: `lib/admin/issues.ts` → `route.ts` → `IssueStatusActions` → `IssueListItem(P1)` → `CardEditForm` → `IssueListItem(P2)` → `IssueListItem(P3)` → 테스트

## Complexity Tracking

> 위반 없음 — Constitution Check 모두 통과.
