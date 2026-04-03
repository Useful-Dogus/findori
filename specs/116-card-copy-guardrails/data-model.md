# Data Model: 카드 카피 편집 가드레일

**Feature**: 116-card-copy-guardrails
**Date**: 2026-04-03

## 신규 타입: GuardrailViolation

파이프라인이 생성한 카드에서 텍스트 필드 기준 위반을 표현하는 타입.

```typescript
// src/types/pipeline.ts에 추가
export type GuardrailViolation = {
  entityId: string      // 이슈 엔티티 ID
  cardId: number        // 위반 카드 ID
  cardType: string      // 카드 타입 (예: 'cause', 'verdict')
  field: string         // 위반 필드명 (예: 'cause', 'verdict')
  actual: number        // 실제 글자 수 또는 문장 수
  limit: number         // 기준 글자 수 또는 문장 수
  violationType: 'max_chars' | 'max_sentences'
}
```

## 신규 모듈: src/lib/pipeline/guardrails.ts

### FieldConstraint (내부 타입)

```typescript
type FieldConstraint = {
  maxChars?: number
  maxSentences?: number
}

type CardFieldConstraints = {
  [cardType: string]: {
    [field: string]: FieldConstraint
  }
}
```

### CARD_FIELD_CONSTRAINTS (상수)

카드 타입별 필드 제약 테이블. research.md의 "확정 기준" 열 기반.

```
delta:
  context: maxChars 80

delta-intro:
  whatDesc: maxChars 100, maxSentences 2
  trigger:  maxChars 60, maxSentences 1

cause:
  result: maxChars 30
  cause:  maxChars 120

stat:
  reveal: maxChars 80

compare:
  q:      maxChars 40
  footer: maxChars 60

verdict:
  verdict: maxChars 50

question:
  q:    maxChars 50
  hint: maxChars 60
```

### validateCardGuardrails() 함수

```typescript
function validateCardGuardrails(
  entityId: string,
  cards: Card[]
): GuardrailViolation[]
```

- 각 카드를 순회하며 CARD_FIELD_CONSTRAINTS 테이블과 대조
- 위반 항목마다 GuardrailViolation 객체 생성
- 결과 배열 반환 (빈 배열이면 위반 없음)
- 글자 수: `string.length` (한국어 한 글자 = 1자)
- 문장 수: `。!？.!?` 기준 split + 빈 문자열 제거 후 count

## generateIssues() 반환 타입 변경

```typescript
// 기존
{ issues: GeneratedIssueDraft[], errors: PipelineError[], usage: TokenUsage | null }

// 변경 후
{ issues: GeneratedIssueDraft[], errors: PipelineError[], violations: GuardrailViolation[], usage: TokenUsage | null }
```

## PipelineRunResult 로그 변경

`src/types/pipeline.ts`의 완료 결과 타입에 `guardrailViolations?: GuardrailViolation[]` 추가.
`finishPipelineRun()`의 파라미터에도 동일 필드 추가.

## 변경 없는 기존 타입

- `cards.ts`의 Zod 스키마: 구조 검증 역할 유지, 글자 수 제약 추가 없음
- `PipelineError`: 기존 저장 차단 오류 전용으로 유지
