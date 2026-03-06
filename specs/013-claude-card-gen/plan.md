# Implementation Plan: Claude 카드 생성 모듈

**Branch**: `013-claude-card-gen` | **Date**: 2026-03-06 | **Spec**: [spec.md](./spec.md)

---

## Summary

기존 파이프라인에는 `src/lib/pipeline/generate.ts`가 skeleton 형태로 존재하나 두 가지 핵심 갭이 있다.

1. **프롬프트 품질**: system prompt가 없고 user prompt가 매우 단순하다. 카드 타입 정의·필드 규칙·투자 유도 금지 지시가 없어 Claude가 올바른 구조의 카드를 생성하기 어렵다.
2. **맥락 카드 생성 경로 없음**: 코스피·나스닥·USD/KRW 지수/환율 카드는 SRS에서 "별도 호출"로 명시됐으나 현재 구현이 없다.

구현 방향:
- `generateIssues()`: system prompt 추가 + 카드 타입별 필드 규칙 기술 + 채널 기본값 `'v1'` 수정
- `generateContextIssues()`: 시장 맥락 지표 전용 신규 함수
- 기존 `parseCards()` 검증 레이어(Zod) 재사용 — 수정 없음

---

## Technical Context

**Language/Version**: TypeScript 5.4+ / Node.js 20+
**Primary Dependencies**: `@anthropic-ai/sdk` (기존 설치), `zod` ^4.3 (기존), `@supabase/supabase-js` ^2.0 (기존)
**Storage**: Supabase PostgreSQL — `issues` (cards_data JSONB), `feeds` (기존 테이블, 변경 없음)
**Testing**: Vitest (기존 환경), 단위 테스트 + 기존 integration 테스트 유지
**Target Platform**: Vercel 서버리스 (Next.js Route Handler 호출 컨텍스트)
**Project Type**: 내부 파이프라인 모듈 (라이브러리 형태, 외부 노출 API 없음)
**Performance Goals**: 단일 파이프라인 실행에서 수십 건 기사 처리, 전체 생성 60초 이내
**Constraints**: `ANTHROPIC_API_KEY` 환경변수 필수, 없을 시 즉시 오류. Vercel 서버리스 제약 내 동작.
**Scale/Scope**: 일 1회 Cron 실행, 일일 기사 수십~수백 건, 이슈 최대 10개/일

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| 원칙 | 평가 | 비고 |
|------|------|------|
| I. Code Quality | ✅ PASS | 기존 코드 패턴 유지. `generate.ts` 모듈 수정, 신규 함수 추가 |
| II. Tests Define Correctness | ✅ PASS | 기존 unit test 3개 유지 + 신규 케이스 추가 (system prompt 포함 여부, context 이슈 생성) |
| III. UX Consistency | ✅ N/A | 내부 파이프라인 모듈, UI 없음 |
| IV. Performance | ✅ PASS | 0건 early exit 유지, AI 호출 최소화 로직 유지 |
| V. Small & Reversible | ✅ PASS | `generate.ts` 단일 파일 수정 + 신규 함수 추가. 기존 파이프라인 흐름 변경 없음 |

**Constitution Check 결과**: 위반 없음. 진행 가능.

---

## Project Structure

### Documentation (this feature)

```text
specs/013-claude-card-gen/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── checklists/
│   └── requirements.md
└── tasks.md             # /speckit.tasks 실행 후 생성
```

### Source Code (repository root)

```text
src/
└── lib/
    └── pipeline/
        ├── generate.ts       # 핵심 수정: system prompt, generateContextIssues, channel 'v1'
        └── index.ts          # generateContextIssues 재내보내기 추가

tests/
└── unit/
    └── lib/
        └── pipeline-generate.test.ts  # 신규 케이스 추가
```

**Structure Decision**: 기존 파이프라인 모듈 구조(`src/lib/pipeline/`) 유지. 신규 파일 없이 `generate.ts` 수정 + `index.ts` 재내보내기만 추가.

---

## Complexity Tracking

> 헌법 위반 없음 — 해당 없음.
