# Implementation Plan: 카드뉴스 품질 개선 Phase 2 — 카드 타입 재설계

**Branch**: `092-card-type-redesign` | **Date**: 2026-03-26 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `specs/092-card-type-redesign/spec.md`

---

## Summary

현재 파이프라인은 7개 카드 타입이 모두 `tag + title + body + stat + sources` 구조를 공유해 AI가 반복적 패턴을 생성한다. 이번 Phase 2에서는 8개의 완전히 다른 필드 구조를 가진 카드 타입으로 교체하고, Haiku 팩트 추출 → Sonnet 카드 생성의 2단계 LLM 흐름을 도입한다. `community` 타입은 폐기한다.

---

## Technical Context

**Language/Version**: TypeScript 5 (strict mode)
**Primary Dependencies**: Next.js 15 App Router, Anthropic SDK (`@anthropic-ai/sdk`), Zod, Supabase JS
**Storage**: Supabase PostgreSQL — `cards_data` 컬럼은 `jsonb` 타입이므로 DB 마이그레이션 불필요
**Testing**: `npm run build` (타입 게이트) + `npx tsc --noEmit`
**Target Platform**: Vercel (Next.js 15 App Router, Node.js 18+)
**Project Type**: Web application (Next.js full-stack, API routes + frontend)
**Performance Goals**: 파이프라인 실행 시간 Phase 1 대비 +30% 이내 (팩트 추출 단계 추가 감안)
**Constraints**: Vercel cron 제한(max 60s for hobby / max 300s for pro), Anthropic API 동시 호출 제한
**Scale/Scope**: 하루 1회 실행, 이슈 최대 3개, 카드 이슈당 최대 7장

---

## Constitution Check

| 원칙 | 상태 | 근거 |
|------|------|------|
| I. Code Quality | ✅ | 새 카드 타입은 모듈화, 각 타입이 독립 파일/스키마를 갖도록 설계 |
| II. Tests Define Correctness | ✅ | Zod 스키마 변경에 따른 파서 단위 테스트 필수. `community` 폐기 시 기존 테스트 조정 필요 |
| III. UX Consistency | ✅ | `FeedCardStack.tsx`에 새 렌더러 추가, 기존 렌더러 제거 없이 점진적 확장 후 community 제거 |
| IV. Performance | ✅ | 팩트 추출(Haiku)은 비용이 낮고, 팩트 압축으로 Sonnet 입력 토큰 감소. 전체 비용 동등 이하 목표 |
| V. Small & Reversible | ✅ | `cards_data`가 jsonb이므로 DB 마이그레이션 없음. 구버전 카드 데이터는 그대로 읽힘 |

**Gate 결과**: 위반 없음. 진행 가능.

---

## Project Structure

### Documentation (this feature)

```text
specs/092-card-type-redesign/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── card-types.ts    # TypeScript interface contracts
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
src/
├── types/
│   └── cards.ts                    # 8개 신규 타입 추가, community 폐기 주석
├── lib/
│   ├── cards/
│   │   └── index.ts               # Zod 스키마 교체 (8개 신규 + source 유지)
│   └── pipeline/
│       ├── extract.ts             # NEW: Haiku 기반 팩트 구조화 단계
│       ├── generate.ts            # 수정: 신규 tool schema + system prompt
│       └── index.ts               # 수정: extract 단계 통합
└── components/features/feed/
    └── FeedCardStack.tsx          # 수정: 신규 카드 타입 렌더러 추가
```

**Structure Decision**: 단일 Next.js 풀스택 프로젝트 유지. 신규 파일은 `extract.ts` 하나만 추가. 나머지는 기존 파일 수정.

---

## Complexity Tracking

> 위반 없음 — 항목 없음

---
