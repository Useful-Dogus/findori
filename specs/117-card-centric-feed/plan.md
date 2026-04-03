# Implementation Plan: 카드 중심 피드 리디자인

**Branch**: `117-card-centric-feed` | **Date**: 2026-04-03 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/117-card-centric-feed/spec.md`

## Summary

피드 페이지(`FeedView.tsx`)의 이슈 섹션 레이아웃을 재구성한다. 이슈 컨테이너 박스를 완전히 제거하고, 카드 스택이 화면을 지배하는 구조로 변경한다. 엔티티명·제목·변화율·공유버튼 등 모든 메타 정보는 카드 아래 캡션 영역에 통합된다. `FeedCardStack.tsx`(슬라이드 로직, CardBody 렌더링)는 변경 없이 유지한다.

## Technical Context

**Language/Version**: TypeScript 5 (strict mode)
**Primary Dependencies**: Next.js 15 App Router, Tailwind CSS v4
**Storage**: N/A — 레이아웃 변경만, DB 변경 없음
**Testing**: vitest (기존 테스트 유지)
**Target Platform**: Web (모바일 375px + 데스크톱 1200px)
**Project Type**: Web application (UI component change)
**Performance Goals**: 렌더 성능 변화 없음 — 기존 컴포넌트 재활용
**Constraints**: FeedCardStack.tsx 내부 로직 변경 불가(FR-007, FR-008)
**Scale/Scope**: FeedView.tsx 단일 파일 변경

## Constitution Check

| Gate | Status | Notes |
|------|--------|-------|
| I. Code Quality | PASS | 단일 파일 변경, 기존 컴포넌트 재활용 |
| II. Tests | PASS | 기존 vitest 테스트 통과 여부 확인 필요. UI 레이아웃 테스트는 없으므로 기존 통과 기준 유지 |
| III. UX Consistency | PASS | 기존 상호작용(스와이프, 버튼) 100% 유지. 접근성(aria) 속성 유지 |
| IV. Performance | PASS | 추가 렌더링 없음. max-width wrapper 추가는 영향 없음 |
| V. Small & Reversible | PASS | 단일 컴포넌트 변경, git revert 가능 |

## Project Structure

### Documentation (this feature)

```text
specs/117-card-centric-feed/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
└── tasks.md             # /speckit.tasks output
```

### Source Code (변경 대상)

```text
src/components/features/feed/
└── FeedView.tsx          # 이슈 섹션 레이아웃 재구성 (유일한 변경 파일)
```

```text
src/components/features/feed/   (변경 없음)
├── FeedCardStack.tsx    # 슬라이드 로직·CardBody — NO CHANGES
├── FeedShareButton.tsx  # 공유 버튼 — NO CHANGES
├── FeedSourceLink.tsx   # 출처 링크 — NO CHANGES
├── FeedEmptyState.tsx   # 빈 상태 — NO CHANGES
├── FeedErrorState.tsx   # 에러 상태 — NO CHANGES
└── FeedDisclaimer.tsx   # 면책 고지 — NO CHANGES
```

## Implementation Strategy

### 변경 전 이슈 섹션 구조

```
<section class="rounded-[32px] border bg-white/3 p-4 backdrop-blur-sm">
  <div class="mb-4 flex ...">          <!-- 헤더: entityType배지 + changeValue + 공유버튼 -->
  <FeedCardStack />                     <!-- 카드 스택 -->
  <div class="mt-4 space-y-2">         <!-- 푸터: entityName + title + tags -->
</section>
```

### 변경 후 이슈 섹션 구조

```
<section class="w-full">               <!-- 컨테이너 제거, 여백만 -->
  <FeedCardStack />                     <!-- 카드 스택 (풀 폭) -->
  <div class="mt-3 flex ...">          <!-- 캡션: 좌(entityName+title+메타) / 우(공유버튼) -->
</section>
```

### 레이아웃 상세

**`<main>` 컨테이너**: `flex flex-col` + 이슈 간 여백 (구분선 없음)
- 모바일: `gap-12 px-4` (여백으로만 이슈 구분)
- 데스크톱: `gap-16 px-6`

**카드 스택 폭**: max-width 제한 + 중앙 정렬
- 모바일: `w-full` (뷰포트 90%+ 활용, px-4는 main에서 담당)
- 데스크톱: 단일 컬럼, `max-w-2xl mx-auto` (640px, 480px보다 넉넉)

**캡션 영역**: 카드 바로 아래, 좌우 분할
- 좌: entityName(xs, muted) → title(sm/base, medium) → [changeValue(xs, bold) + entityType(xs, muted)]
- 우: FeedShareButton (shrink-0)
- 데스크톱에서 텍스트 크기 한 단계 업스케일

**이슈 강조 링크 (initialIssueId)**: `ring` 클래스를 컨테이너 대신 FeedCardStack wrapper에 적용

## Complexity Tracking

해당 없음. 단순 레이아웃 재배치로 복잡도 증가 없음.
