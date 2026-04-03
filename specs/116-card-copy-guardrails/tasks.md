# Tasks: 카드 카피 편집 가드레일

**Input**: Design documents from `specs/116-card-copy-guardrails/`
**Prerequisites**: plan.md ✓, spec.md ✓, research.md ✓, data-model.md ✓

**Organization**: 유저 스토리별로 그룹화되어 각 스토리를 독립적으로 구현·검증 가능.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 병렬 실행 가능 (다른 파일, 의존성 없음)
- **[Story]**: 유저 스토리 레이블 (US1/US2/US3)

---

## Phase 1: Foundational (블로킹 선행 작업)

**Purpose**: 모든 유저 스토리 구현의 전제 타입을 추가

**⚠️ CRITICAL**: 이 Phase 완료 전에는 어떤 유저 스토리도 시작 불가

- [x] T001 `GuardrailViolation` 타입을 `src/types/pipeline.ts`에 추가 (data-model.md 스펙 기준: entityId, cardId, cardType, field, actual, limit, violationType)
- [x] T00X `generateIssues()` 반환 타입에 `violations: GuardrailViolation[]` 필드 추가 (`src/lib/pipeline/generate.ts` 타입 선언부)
- [x] T00X `generateContextIssues()` 반환 타입에 동일하게 `violations: GuardrailViolation[]` 필드 추가 (`src/lib/pipeline/generate.ts`)

**Checkpoint**: 타입 추가 완료 → `npx tsc --noEmit` 통과 → 유저 스토리 구현 시작 가능

---

## Phase 2: User Story 1 - 텍스트 잘림 없는 카드 읽기 (Priority: P1) 🎯 MVP

**Goal**: 파이프라인 생성 카드의 텍스트 필드가 기준을 초과하면 경고 로그를 남기고 저장은 허용

**Independent Test**: 파이프라인 실행 후 위반이 있을 때 `pipeline_logs` 테이블의 해당 실행 레코드에 `guardrail_violations` 배열이 포함되는지 확인

### Implementation for User Story 1

- [x] T00X [US1] `src/lib/pipeline/guardrails.ts` 파일 생성 — `CARD_FIELD_CONSTRAINTS` 상수 정의 (data-model.md의 카드 타입별 필드 제약 테이블 기준: delta/delta-intro/cause/stat/compare/verdict/question 각 필드 maxChars/maxSentences)
- [x] T00X [US1] `guardrails.ts`에 `validateCardGuardrails(entityId: string, cards: Card[]): GuardrailViolation[]` 함수 구현 — 각 카드를 순회하며 CARD_FIELD_CONSTRAINTS 대조, 위반 항목을 GuardrailViolation 배열로 반환
- [x] T00X [P] [US1] `guardrails.test.ts` 유닛 테스트 작성 — 위반 없는 카드 세트는 빈 배열, delta 카드 context 초과는 위반, cause 카드 result 초과는 위반, verdict 카드 verdict 초과는 위반, 경계값(기준 = 한계)은 통과, 문장 수 위반(delta-intro.whatDesc) 감지 (프로젝트 표준 테스트 경로 사용)
- [x] T00X [US1] `src/lib/pipeline/generate.ts`의 `generateIssues()` 내에서 `parseCards()` 성공 후 `validateCardGuardrails()` 호출, violations 수집하여 반환값에 포함
- [x] T00X [US1] `src/lib/pipeline/generate.ts`의 `generateContextIssues()`에도 동일하게 `validateCardGuardrails()` 호출 + violations 반환 적용
- [x] T00X [US1] `src/lib/pipeline/index.ts`의 `runPipeline()`에서 `generated.violations` 수집, `finishPipelineRun()` 호출 시 전달 — `finishPipelineRun()` 파라미터 타입 및 구현부도 함께 수정 (`src/lib/pipeline/log.ts`)

**Checkpoint**: `npm run build` + 유닛 테스트 통과 → US1 완료. 파이프라인 실행 로그에 violations 배열 포함됨

---

## Phase 3: User Story 2 - 고유명사의 자연스러운 표현 (Priority: P2)

**Goal**: 생소한 주체 첫 등장 시 소개 포함, 이후 약칭 사용, 영문 약어 첫 등장 시 한국어 설명 포함

**Independent Test**: `is_subject_unfamiliar: true` 인 이슈로 파이프라인 실행 시 생성된 첫 번째 카드에 whatDesc(소개 텍스트)가 포함되는지 확인. 동일 이슈 2번째 이후 카드에서 전체 이름 대신 약칭이 쓰이는지 확인.

### Implementation for User Story 2

- [x] T01X [US2] `src/lib/pipeline/generate.ts`의 `buildSystemPrompt()`에 고유명사 처리 규칙 추가 — "첫 등장 시 괄호 설명 필수", "2번째 이후 약칭 또는 대명사 사용", "영문 약어(ETF, FOMC 등) 첫 등장 시 한국어 풀네임 병기" 를 **말투 금지 패턴** 섹션 아래 **고유명사 처리 원칙** 섹션으로 신설
- [x] T01X [US2] `buildSystemPrompt()`의 delta-intro 카드 카탈로그 설명에 `whatDesc` 용도 명확화 — "독자에게 생소한 주체일 때 2문장 이내 소개. `is_subject_unfamiliar: true` 이면 반드시 포함" 명시

**Checkpoint**: 시스템 프롬프트 변경 후 수동 파이프라인 실행으로 고유명사 처리 동작 확인

---

## Phase 4: User Story 3 - 카드당 하나의 명확한 메시지 (Priority: P2)

**Goal**: 본문 필드 최대 3문장, verdict 단일 문장, 아키타입별 어미 스타일 일관성 보장

**Independent Test**: EDUCATION 아키타입 이슈 생성 시 모든 카드 어미가 경어체, BREAKING 아키타입 이슈 생성 시 모든 카드 어미가 문어체인지 확인

### Implementation for User Story 3

- [x] T01X [US3] `src/lib/pipeline/guardrails.ts`의 `CARD_FIELD_CONSTRAINTS`에 문장 수 제약 추가 — delta-intro의 whatDesc(maxSentences: 2), trigger(maxSentences: 1), verdict의 verdict(maxSentences: 1) (T004 확장)
- [x] T01X [US3] `guardrails.test.ts`에 문장 수 위반 케이스 추가 — whatDesc 3문장은 위반, 2문장은 통과 / verdict 2문장은 위반, 1문장은 통과
- [x] T01X [US3] `src/lib/pipeline/generate.ts`의 `buildSystemPrompt()`에 어미 아키타입 규칙 추가 — 스토리 아키타입 테이블에 "어미 스타일" 컬럼 추가 (BREAKING/EARNINGS/MACRO/THEME → 문어체, EDUCATION → 경어체), 기존 "어미 혼용 금지" 규칙을 이 테이블 참조로 대체
- [x] T01X [US3] `buildSystemPrompt()`의 카드 타입 카탈로그 전체 필드 글자 수 수치 통일 — research.md 확정 기준 적용 (현재 "3줄"로만 표현된 항목을 글자 수로 명시)

**Checkpoint**: 전체 빌드 통과 + 유닛 테스트 통과 → 모든 유저 스토리 완료

---

## Phase 5: Polish & Cross-Cutting Concerns

- [x] T01X [P] `npx tsc --noEmit` 타입 검사 통과 확인
- [x] T01X [P] `npm run lint` 린트 통과 확인
- [x] T01X `npm run build` 프로덕션 빌드 통과 확인

---

## Dependencies & Execution Order

### Phase 의존 관계

- **Phase 1 (Foundational)**: 즉시 시작 가능 — 모든 Phase 블로킹
- **Phase 2 (US1)**: Phase 1 완료 후 시작. T004, T005, T006은 병렬 가능
- **Phase 3 (US2)**: Phase 1 완료 후 시작 (US1과 독립적 — 다른 파일)
- **Phase 4 (US3)**: Phase 2 완료 후 시작 (guardrails.ts에 문장 수 제약 추가)
- **Phase 5 (Polish)**: 원하는 스토리 완료 후

### 유저 스토리 의존 관계

- **US1 (P1)**: T001-T003 완료 후 독립 시작 가능
- **US2 (P2)**: T001 완료 후 독립 시작 가능 (US1과 다른 파일)
- **US3 (P2)**: T004-T005 완료 후 시작 (guardrails.ts 확장)

### 병렬 실행 기회

- T002, T003: 같은 파일이므로 순차 실행
- T004, T005, T006 (US1): T004 완료 후 T005/T006 병렬 실행 가능
- T007, T010: 다른 함수 수정이나 같은 파일 — 순차 권장
- T016, T017: 독립적으로 병렬 실행 가능

---

## Parallel Example: User Story 1

```
T004 완료 후 병렬 시작:
  Task A: T005 validateCardGuardrails() 구현 (guardrails.ts)
  Task B: T006 guardrails.test.ts 유닛 테스트 작성

T005 완료 후:
  Task: T007 generateIssues() 연동 (generate.ts)
  Task: T008 generateContextIssues() 연동 (generate.ts)
```

---

## Implementation Strategy

### MVP (User Story 1만)

1. Phase 1 완료 (T001-T003)
2. Phase 2 완료 (T004-T009)
3. **검증**: 파이프라인 실행 → 로그에 violations 배열 확인
4. 필요 시 배포

### Incremental Delivery

1. US1 → 런타임 위반 감지 + 로그 기록
2. US2 → 고유명사 처리 품질 향상
3. US3 → 문장 수·어미 일관성 보장

---

## Notes

- `guardrails.ts`는 저장 차단 없음 — 경고만 반환 (스펙 Assumption 참조)
- DB 마이그레이션 없음 — 기존 pipeline_logs의 JSONB 필드 활용
- 적용 범위: 신규 생성 카드만 (기존 저장 카드 소급 없음)
- `cards.ts` Zod 스키마 수정 없음 — 구조 검증 역할 유지
