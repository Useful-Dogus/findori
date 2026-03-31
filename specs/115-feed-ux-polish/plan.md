# Implementation Plan: 유저 피드 화면 UX 폴리싱

**Branch**: `115-feed-ux-polish` | **Date**: 2026-03-31 | **Spec**: [/Users/chanheepark/dev/laboratory/findori/specs/115-feed-ux-polish/spec.md](/Users/chanheepark/dev/laboratory/findori/specs/115-feed-ux-polish/spec.md)
**Input**: Feature specification from `/specs/115-feed-ux-polish/spec.md`

## Summary

공개 피드 화면에서 카드보다 앞서는 설명성 UI와 저가치 메타 정보를 줄이고, 카드 자체의 가독성·로딩 일관성·데스크톱 읽기 밀도를 개선한다. 구현은 `FeedView`, `FeedCardStack`, 공개 레이아웃, 관련 단위 테스트를 중심으로 진행하며 파이프라인이나 카드 생성 규칙은 변경하지 않는다.

## Technical Context

**Language/Version**: TypeScript 5.4+, Node.js 20+, React 19, Next.js 15  
**Primary Dependencies**: Next.js App Router, Tailwind CSS v4, React Testing Library, Vitest  
**Storage**: N/A, 기존 공개 피드 API 응답 읽기만 사용  
**Testing**: Vitest + React Testing Library + `npm run validate` + `npm run build`  
**Target Platform**: 모바일/데스크톱 웹 브라우저  
**Project Type**: 웹 애플리케이션 프론트엔드  
**Performance Goals**: 첫 화면에서 카드 소비 진입부를 즉시 인지 가능해야 하고, 카드 전환 시 시각적 플리커가 눈에 띄지 않아야 한다  
**Constraints**: 파이프라인/DB 스키마 수정 없이 공개 피드 렌더링 레이어 안에서 해결해야 함, 기존 SSR 경로와 analytics 이벤트를 깨지 않아야 함  
**Scale/Scope**: 공개 피드 레이아웃 1개, 피드 주요 컴포넌트 2개, 면책 컴포넌트 1개, 관련 단위 테스트 2-3개 파일

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Code Quality Is a Release Gate**: PASS. 변경 범위는 공개 피드 컴포넌트와 테스트로 한정하며 중복 스타일/조건부 렌더링은 보조 함수로 정리한다.
- **Tests Define Correctness**: PASS. UI 동작 변경에 대한 단위 테스트를 추가/수정하고 `npm run validate`, `npm run test`, `npm run build`를 실행한다.
- **User Experience Consistency Over Local Preference**: PASS. 기존 공개 피드의 다크 톤과 컴포넌트 구조는 유지하되, 설명성 UI를 줄이고 접근성/대비를 강화한다.
- **Performance Is a First-Class Requirement**: PASS. 로딩 상태 제어와 조건부 렌더링 추가는 작은 범위이며, 불필요한 렌더와 큰 자산 변경 없이 진행한다.
- **Small, Verifiable, and Reversible Delivery**: PASS. 파이프라인과 데이터 구조는 건드리지 않고 렌더링 레이어에서 되돌리기 쉬운 UI 개선만 포함한다.

## Project Structure

### Documentation (this feature)

```text
specs/115-feed-ux-polish/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
└── tasks.md
```

### Source Code (repository root)

```text
src/
├── app/
│   └── (public)/
│       └── layout.tsx
├── components/
│   └── features/
│       └── feed/
│           ├── FeedCardStack.tsx
│           ├── FeedDisclaimer.tsx
│           └── FeedView.tsx
└── lib/
    └── analytics.ts

tests/
└── unit/
    └── components/
        ├── FeedCardStack.test.tsx
        └── FeedView.test.tsx
```

**Structure Decision**: 공개 피드 컴포넌트와 공개 레이아웃에 구현을 집중하고, 기존 단위 테스트 파일을 확장해 회귀를 막는다. 별도 계약 문서는 만들지 않는다. 이번 기능은 외부 인터페이스 변경보다 UI 표현 규칙 변경이 핵심이기 때문이다.

## Phase 0: Research

- `research.md`에서 이번 범위의 핵심 결정을 정리한다.
- 빈 컨텍스트 슬롯 숨김, 카드 외부 설명성 UI 제거, 렌더링 레이어 중심 보정, 데스크톱 밀도 완화, 면책 하단 이동을 구현 원칙으로 확정한다.

## Phase 1: Design

- `data-model.md`에 헤더 상태, 컨텍스트 요약, 이슈 메타, 카드 표현 상태, 면책 배치 정책을 정리한다.
- `quickstart.md`에 모바일/데스크톱 검수 시나리오를 정의한다.
- 공개 피드에서는 카드 밖 정보보다 카드 자체를 우선 노출하는 구조로 조정한다.

## Phase 2: Implementation Strategy

1. 레이아웃과 `FeedView`에서 상단 정보 위계를 재정렬한다.
2. `FeedView`에서 빈 컨텍스트 슬롯, 태그, 메타 정보 노출 기준을 조정한다.
3. `FeedCardStack`에서 안내 문구 제거, 단어 단위 줄바꿈, 말줄임 완화, 이미지/텍스트 동시 표시, 오버레이 강화, 데스크톱 밀도 보정을 적용한다.
4. 단위 테스트를 갱신해 새 UX 기준을 고정한다.

## Complexity Tracking

해당 없음.
