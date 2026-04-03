# Implementation Plan: 카드 카피 편집 가드레일

**Branch**: `116-card-copy-guardrails` | **Date**: 2026-04-03 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `specs/116-card-copy-guardrails/spec.md`

## Summary

파이프라인이 LLM으로 생성한 카드의 텍스트 필드가 카드 타입별 글자 수 기준을 초과할 때 경고 로그를 남기고 저장을 허용한다. 구현은 두 축으로 나뉜다: (1) 신규 `guardrails.ts` 모듈 — 필드별 제약 테이블 + 위반 감지 함수, (2) `generate.ts` 시스템 프롬프트 강화 — 수치 통일 + 어미 아키타입 규칙 추가.

## Technical Context

**Language/Version**: TypeScript 5 (strict mode)
**Primary Dependencies**: Zod (기존), Anthropic SDK (기존)
**Storage**: N/A (신규 DB 컬럼 없음 — 파이프라인 로그의 기존 JSONB 필드 활용)
**Testing**: 기존 테스트 패턴 (Jest/Vitest 추정, 프로젝트 표준 따름)
**Target Platform**: Vercel / Node.js 서버 (파이프라인 런타임)
**Project Type**: 서버사이드 파이프라인 모듈
**Performance Goals**: 파이프라인은 일 1회 배치 실행 — 가드레일 검증은 동기 루프, 성능 임팩트 없음
**Constraints**: 저장 차단 없음. 위반 카드는 경고 포함 그대로 저장.
**Scale/Scope**: 이슈 최대 3개 × 카드 최대 7장 = 최대 21장/실행

## Constitution Check

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Code Quality | PASS | guardrails.ts는 단일 책임. 기존 cards.ts, generate.ts와 역할 분리 명확 |
| II. Tests | REQUIRED | guardrails.ts의 validateCardGuardrails() 유닛 테스트 필수 (각 카드 타입별) |
| III. UX Consistency | N/A | 파이프라인 내부 변경, 사용자 화면 없음 |
| IV. Performance | PASS | O(cards × fields) 동기 루프, 무시 가능한 오버헤드 |
| V. Small & Reversible | PASS | 신규 모듈 추가 + 기존 모듈 점진적 수정. 위반 감지 비활성화해도 기존 동작 유지 |

## Project Structure

### Documentation (this feature)

```text
specs/116-card-copy-guardrails/
├── plan.md              # 이 파일
├── research.md          # Phase 0 완료
├── data-model.md        # Phase 1 완료
└── tasks.md             # /speckit.tasks 로 생성 예정
```

### Source Code

```text
src/
├── lib/
│   └── pipeline/
│       ├── guardrails.ts     # NEW — 필드 제약 테이블 + validateCardGuardrails()
│       ├── generate.ts       # MODIFY — 시스템 프롬프트 강화, violations 반환
│       └── index.ts          # MODIFY — violations를 파이프라인 로그에 포함
├── types/
│   └── pipeline.ts           # MODIFY — GuardrailViolation 타입, 반환 타입 확장

tests/ (또는 프로젝트 표준 테스트 경로)
└── pipeline/
    └── guardrails.test.ts    # NEW — 카드 타입별 유닛 테스트
```

**Structure Decision**: 단일 프로젝트 구조. 신규 파일은 기존 `src/lib/pipeline/` 위치에 추가. DB 마이그레이션 없음.

## Implementation Phases

### Phase A: 신규 guardrails.ts 모듈 (독립적, 먼저 구현)

1. `GuardrailViolation` 타입을 `src/types/pipeline.ts`에 추가
2. `src/lib/pipeline/guardrails.ts` 생성:
   - `CARD_FIELD_CONSTRAINTS` 상수 (data-model.md 기준)
   - `validateCardGuardrails(entityId, cards)` 함수
3. `guardrails.test.ts` 유닛 테스트 작성:
   - 위반 없는 카드 세트 → 빈 배열 반환
   - 각 카드 타입별 위반 케이스 → GuardrailViolation 반환
   - 경계값 (한계 = 기준): 통과

### Phase B: generate.ts 연동

4. `generateIssues()` 반환 타입에 `violations: GuardrailViolation[]` 추가
5. `parseCards()` 성공 후 `validateCardGuardrails()` 호출, 결과 수집
6. 반환값에 포함

### Phase C: index.ts 파이프라인 로그 연동

7. `runPipeline()`에서 `generated.violations` 수집
8. `finishPipelineRun()` 호출 시 violations 전달
9. `PipelineRunResult` 타입에 반영

### Phase D: 시스템 프롬프트 강화

10. `buildSystemPrompt()`의 카드 타입 카탈로그 섹션 수정:
    - 필드별 글자 수를 수치로 통일 (research.md 확정 기준 적용)
    - 스토리 아키타입 테이블에 "어미 스타일" 컬럼 추가
    - 어미 일관성 규칙을 "말투 금지 패턴" 섹션에서 아키타입 테이블로 이동

### Phase E: generateContextIssues() 동일 적용

11. `generateContextIssues()`에도 동일하게 violations 반환 추가 (컨텍스트 이슈 경로)

## Complexity Tracking

해당 없음 — 신규 모듈 추가 + 기존 파일 점진적 수정. Constitution 위반 없음.
