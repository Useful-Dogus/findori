# Implementation Plan: 카드 스키마(cards[]) 타입/검증 레이어 구현

**Branch**: `005-cards-schema-types` | **Date**: 2026-02-27 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/005-cards-schema-types/spec.md`

## Summary

`issues.cards_data`(jsonb)에 저장된 AI 생성 cards[] JSON을 렌더링 코드와 파이프라인 코드에서 안전하게 사용할 수 있도록 런타임 검증 레이어를 추가한다. 기존 `src/types/cards.ts`의 TypeScript 타입 정의는 변경하지 않고, `src/lib/cards.ts`에 Zod 스키마 기반 `parseCards()` 함수와 7가지 카드 타입 가드 함수를 구현한다.

## Technical Context

**Language/Version**: TypeScript 5.4+ / Node.js 20+
**Primary Dependencies**: Zod ^3 (기존 설치), Vitest (기존 테스트 환경)
**Storage**: N/A — 이 이슈는 읽기/검증 전용. DB 쓰기 없음.
**Testing**: Vitest + jsdom (`tests/unit/lib/cards.test.ts`)
**Target Platform**: Next.js 15 App Router — 클라이언트/서버 양측에서 import 가능해야 함
**Project Type**: Web application (내부 유틸리티 모듈)
**Performance Goals**: 검증은 동기 호출, 카드 1세트(최대 7장) 기준 sub-millisecond
**Constraints**: Node.js 전용 API 사용 금지 (브라우저 호환 필요). `src/types/cards.ts` 수정 금지.
**Scale/Scope**: MVP 단일 채널(`v1`). 향후 채널 추가 시 스키마만 교체 가능한 구조.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| 원칙 | 준수 여부 | 근거 |
|------|-----------|------|
| I. Code Quality Is a Release Gate | ✅ | 단일 책임 모듈, 명확한 naming |
| II. Tests Define Correctness | ✅ | FR 요구사항 전체를 단위 테스트로 커버 |
| III. UX Consistency | ✅ | UI 변경 없음 — 내부 라이브러리만 추가 |
| IV. Performance Is First-Class | ✅ | 검증이 렌더링 경로에 있으므로 동기/경량 필수. Zod safeParse는 sub-ms 수준. |
| V. Small, Verifiable, Reversible | ✅ | 새 파일 추가만. 기존 파일 변경 없음. 롤백 = 파일 삭제. |

**위반 없음. 진행 가능.**

## Project Structure

### Documentation (this feature)

```text
specs/005-cards-schema-types/
├── plan.md              # This file
├── research.md          # Phase 0 output ✅
├── data-model.md        # Phase 1 output ✅
├── quickstart.md        # Phase 1 output ✅
└── tasks.md             # Phase 2 output (/speckit.tasks — not yet created)
```

### Source Code (repository root)

```text
src/
├── types/
│   └── cards.ts              # 기존 TypeScript 타입 정의 (변경 없음)
└── lib/
    └── cards.ts              # 신규: Zod 스키마 + parseCards() + 타입 가드

tests/
└── unit/
    └── lib/
        └── cards.test.ts     # 신규: 단위 테스트
```

**Structure Decision**: 프로젝트 기존 패턴(`src/lib/env.ts` → `tests/unit/lib/env.test.ts`)을 그대로 따른다. 디렉토리 추가 없이 단일 파일로 충분하다.

## Implementation Design

### `src/lib/cards.ts` 내부 구성

```text
1. hexColor 스키마       — #RGB / #RRGGBB 정규식
2. cardVisualSchema      — 4개 hex 필드
3. cardSourceSchema      — title, url, domain
4. communityQuoteSchema  — text, mood
5. statsItemSchema       — label, value, change?
6. 카드별 스키마 (7개)
   - coverCardSchema     — cover 전용 필드
   - reasonCardSchema    — sources 최소 1개
   - bullishCardSchema   — sources 최소 1개
   - bearishCardSchema   — sources 최소 1개
   - communityCardSchema — quotes 최소 1개
   - statsCardSchema
   - sourceCardSchema
7. cardSchema            — z.discriminatedUnion('type', [...])
8. cardsArraySchema      — 배열 + min/max + refine(순서 제약)
9. ParseCardsResult 타입 (export)
10. parseCards()         — null 처리 + safeParse 래핑 (export)
11. 타입 가드 7개        — isCoverCard, isReasonCard, ... (export)
```

### `tests/unit/lib/cards.test.ts` 테스트 구성

```text
describe('parseCards')
  ✅ 유효한 3장 최소 배열 통과
  ✅ 유효한 7장 최대 배열 통과
  ✅ null 입력 → { success: true, data: null }
  ❌ 카드 수 2장 → failure
  ❌ 카드 수 8장 → failure
  ❌ 첫 카드가 cover 아님 → failure
  ❌ 마지막 카드가 source 아님 → failure
  ❌ visual.bg_from에 Tailwind 클래스 → failure
  ❌ visual.bg_to에 잘못된 값 → failure
  ❌ reason 카드 sources 누락 → failure
  ❌ bullish 카드 sources 빈 배열 → failure
  ❌ bearish 카드 sources 누락 → failure
  ❌ community 카드 quotes 빈 배열 → failure
  ❌ 배열이 아닌 객체 입력 → failure
  ✅ errors 배열에 위반 항목 문자열 포함 확인

describe('타입 가드')
  isCoverCard: 각 7종 카드에 대해 자신만 true
  isReasonCard: 동일 패턴
  ... (7개 타입 가드 × 해당 타입 true / 다른 타입 false)
```

## Phase 0: Research

**상태**: 완료 — [research.md](./research.md) 참조

핵심 결정 사항:
- Zod `discriminatedUnion` + `safeParse` 패턴 사용
- `src/lib/cards.ts` 단일 파일에 스키마 + 함수 배치
- hex 검증: `/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/` 정규식

## Phase 1: Design & Contracts

**상태**: 완료

- [data-model.md](./data-model.md) — 엔티티 및 Zod 스키마 설계
- [quickstart.md](./quickstart.md) — 개발자 사용 가이드
- **contracts/**: 해당 없음 — 내부 유틸리티 모듈이므로 외부 API 계약 없음

## Agent Context Update

- `docs/agent-guidelines.md` 업데이트 필요 없음: 기존 Zod, TypeScript 기술 스택 항목에 포함됨.
- 추가 기술 없음.
