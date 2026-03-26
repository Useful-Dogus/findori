# Research: 카드뉴스 품질 개선 Phase 2

**Branch**: `092-card-type-redesign` | **Date**: 2026-03-26

---

## Q1: 기존 카드 타입과 신규 타입을 어떻게 전환할 것인가?

**Decision**: 점진적 확장 전략 — DB 마이그레이션 없이 신규 타입만 생성

**Rationale**:
- `cards_data`는 `jsonb` 컬럼이므로 스키마를 변경하지 않아도 새 구조를 저장 가능
- 기존 데이터는 구버전 스키마로 파싱 가능하도록 `community`를 Zod 스키마에서 제거하지 않고 `deprecated` 표시만 함
- 신규 생성분부터 새 타입 적용, 기존 피드는 그대로 표시

**Alternatives considered**:
- DB 마이그레이션으로 기존 데이터 변환: 필요 없음 (jsonb 유연성)
- 구버전 타입 즉시 제거: 기존 저장 데이터 파싱 실패 가능성 → 거부

---

## Q2: 2단계 LLM의 팩트 추출 단위는 무엇인가?

**Decision**: 이슈 배치 단위로 팩트 추출 — 기사 전체를 한 번에 Haiku에 전달

**Rationale**:
- 현재 파이프라인은 최대 10건의 기사를 Sonnet에 전달해 3개 이슈를 한 번에 생성
- 팩트 추출도 동일하게 10건 기사 → 이슈별 팩트 구조 3개를 한 번에 추출하는 방식
- 개별 기사 단위 추출보다 컨텍스트가 풍부하고 API 호출 횟수가 적음

**팩트 구조 출력 형식** (Haiku 추출 target):
```json
{
  "issues": [
    {
      "topic": "ARM Holdings 주가 +20%",
      "archetype": "BREAKING",
      "entity_id": "arm",
      "entity_name": "ARM Holdings",
      "entity_type": "stock",
      "change_value": "+20%",
      "delta": { "before": "$134", "after": "$162", "period": "하루 만에" },
      "cause": "ARM이 처음으로 직접 칩 설계(ARM AGI CPU) 발표",
      "key_stats": ["150억 달러 — 5년 내 칩 부문 연간 매출 목표", "분석가 28명 중 26명 매수"],
      "impact_items": [],
      "compare_rows": [],
      "risks": ["P/E 182배 — 엔비디아(50배) 대비 고평가"],
      "verdict": "비싸지만 월가는 사라고 한다",
      "source_articles": [0, 1]
    }
  ]
}
```

**Alternatives considered**:
- 기사별 개별 추출 후 합산: API 호출 3배 증가, 이슈 간 중복 제거 어려움 → 거부

---

## Q3: 아키타입 분류는 누가 담당하는가?

**Decision**: Haiku 팩트 추출 단계에서 아키타입 분류 포함

**Rationale**:
- Haiku가 팩트를 추출하면서 이슈 성격을 분류하면 Sonnet이 카드 시퀀스를 결정하는 맥락으로 활용 가능
- 아키타입 → 권장 카드 시퀀스 맵핑은 Sonnet system prompt에 정의

**아키타입 → 카드 시퀀스 맵핑**:

| 아키타입 | 권장 시퀀스 |
|---------|-----------|
| BREAKING | delta → cause → stat → verdict → source |
| EARNINGS | delta → cause → stat → compare → verdict → source |
| MACRO | delta → cause → compare → impact → verdict → source |
| THEME | delta-intro → cause → stat → verdict → source |
| EDUCATION | question → cause → stat → compare → verdict → source |

---

## Q4: `source` 카드 마지막 순서 제약 유지 여부

**Decision**: `source` 카드는 계속 마지막 카드로 유지. `verdict`는 source 바로 앞.

**Rationale**:
- 현재 Zod 스키마에 "마지막 카드는 source 타입" 제약이 있음
- 독자에게 원문 출처를 제공하는 것은 신뢰성의 핵심 요소
- `verdict`를 마지막으로 바꾸면 기존 제약 제거가 필요해 영향 범위 확대

**변경사항**: `source` 카드는 유지, `verdict`를 새 타입으로 추가

---

## Q5: `imgCategory` 도입 방식

**Decision**: 현재 스프린트에서는 도입하지 않음. 기존 `visual` (gradient 색상) 시스템 유지.

**Rationale**:
- 현재 앱은 Unsplash/이미지가 아닌 CSS gradient를 사용하며 이미 세련된 외관을 갖춤
- `imgCategory` 도입은 이미지 CDN, 큐레이션 작업을 수반하며 별도 스프린트가 적절
- 이번 스프린트의 핵심은 **카드 필드 구조 다양화**와 **2단계 LLM**이며 이미지는 별도 이슈

**Alternatives considered**:
- `imgCategory` 필드를 신규 카드 타입에 추가: 이미지 풀 미구성 상태에서 의미 없음 → 연기

---

## Q6: `community` 타입의 기존 데이터 처리

**Decision**: Zod 파서는 유지 (기존 DB 데이터 파싱 가능), 신규 생성만 금지

**Rationale**:
- 기존 저장된 카드 데이터에 `community` 타입이 있을 수 있음
- 파서 제거 시 기존 이슈 조회 실패 가능
- 렌더러에서도 `community` case는 유지 (기존 데이터 표시 가능)
- AI 생성 시스템 프롬프트에서만 `community` 금지

---

## Q7: 카드 수 제약 변경

**Decision**: CARD_COUNT_MIN=3, CARD_COUNT_MAX=7 유지. verdict 카드는 source 바로 앞에 위치.

**Rationale**:
- 아키타입에 따라 최소 4장(delta + cause + verdict + source)에서 최대 6장 생성
- 기존 제약 범위 내에 포함됨

---

## Q8: 기존 테스트 영향 분석

**Current state**: `npm run build`와 `npx tsc --noEmit`이 품질 게이트로 사용됨

**영향 파일**:
- `src/types/cards.ts`: 신규 타입 추가 → 기존 타입 그대로 유지되므로 영향 없음
- `src/lib/cards/index.ts`: 기존 스키마 위에 신규 스키마 추가 → 기존 파서 로직 유지
- `src/lib/pipeline/generate.ts`: system prompt + tool schema 변경 → 기존 generateContextIssues 함수 동일 패턴 유지
- `src/components/features/feed/FeedCardStack.tsx`: 신규 case 추가 → TypeScript exhaustive check로 누락 방지

**결론**: 기존 타입/함수 시그니처 변경 없이 확장하는 방향이므로 빌드 게이트는 통과 가능.
