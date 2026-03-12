# Research: Claude 카드 생성 모듈

**Phase**: 0 (Outline & Research)
**Date**: 2026-03-06
**Branch**: `013-claude-card-gen`

---

## 현재 코드 상태 분석

### `src/lib/pipeline/generate.ts` — 현재 구현 갭

| 항목 | 현재 상태 | 갭 |
|------|-----------|-----|
| AI 호출 방식 | tool_use, `strict: true` | ✅ 적절 |
| cards tool 스키마 | `type: 'array', items: { type: 'object' }` — 제네릭 | ❌ 타입별 필드 정의 없음 |
| system prompt | 없음 | ❌ 카드 타입 정의, 규칙 없음 |
| user prompt | 기사 목록 나열 (최소) | ❌ 카드 구조 지시, 투자 유도 금지 없음 |
| 채널 기본값 | `'default'` | ❌ SRS 기준 `'v1'` 이어야 함 |
| 맥락 카드 생성 | 없음 | ❌ index/currency 전용 경로 필요 |
| parseCards() 호출 | ✅ 완전히 구현됨 | ✅ 재사용 |
| 부분 성공 처리 | ✅ 구현됨 | ✅ 재사용 |
| 0건 early exit | ✅ 구현됨 | ✅ 재사용 |

---

## Research Decision 1: Tool Schema 상세화 수준

**문제**: `cards` 필드를 tool 스키마에서 얼마나 상세하게 정의할 것인가?

**Option A**: tool 스키마에 7개 카드 타입을 `oneOf`/discriminated union으로 완전 정의
- 장점: 스키마 레벨 강제
- 단점: Anthropic tool_use의 `strict: true` 모드에서 `oneOf`가 지원되지 않음 (현재 `anyOf` 미지원). JSON Schema strict 제약으로 복잡한 중첩 조건부 스키마 불가.

**Option B**: tool 스키마에서 cards는 기존처럼 generic `array of objects` 유지, system prompt 텍스트로 각 타입의 필드를 상세 기술
- 장점: Anthropic tool_use strict mode 호환, system prompt가 Claude의 실제 생성 품질에 더 직접적 영향
- 단점: 스키마 레벨 강제 없음(그러나 `parseCards()`가 post-validation 담당)

**Decision**: **Option B** 채택

**Rationale**:
1. Anthropic의 tool_use `strict: true`는 `oneOf` 미지원. Option A는 현재 API 제약으로 불가.
2. `parseCards()` Zod 검증이 이미 완전한 post-validation을 제공 — schema 위반 이슈는 자동 스킵됨.
3. Claude는 텍스트 지시(system prompt의 카드 타입 정의)에서 더 효과적으로 구조를 학습. 스키마 강제보다 풍부한 컨텍스트가 생성 품질에 더 효과적.
4. 기존 코드 변경 최소화 — tool schema 함수는 유지, system prompt만 추가.

**Alternatives Considered**: Option A (Strict discriminated union) — API 제약으로 현재 불가능.

---

## Research Decision 2: System Prompt 구조

**문제**: system prompt에 무엇을 포함해야 카드 생성 품질이 높아지는가?

**Decision**: 다음 4개 섹션으로 구성된 system prompt

1. **역할 정의**: "금융 뉴스 편집 파이프라인, 한국 개인 투자자 대상"
2. **카드 타입 카탈로그** (7개 타입 × 각 타입의 필수 필드 + 설명):
   - `cover`: 이슈 첫 장. `tag`, `title`(줄바꿈 포함 강조), `sub`(수치+날짜), `visual`
   - `reason`: 변동 이유. `tag`, `title`, `body`, `stat`(선택), `visual`, `sources`(필수 1+)
   - `bullish`: 상승 논거. `tag`, `title`, `body`, `stat`(선택), `visual`, `sources`(필수 1+)
   - `bearish`: 하락/리스크 논거. 구조는 bullish와 동일, `sources`(필수 1+)
   - `community`: 커뮤니티 반응. `tag`, `title`, `quotes`(배열, 각 `text`+`mood`), `visual`
   - `stats`: 수치 집약. `tag`, `title`, `items`(배열, 각 `label`+`value`+`change`선택), `visual`
   - `source`: 출처 목록. `tag`, `sources`(배열), `visual`
3. **제약 규칙**:
   - cards: 3~7장, 첫 카드 = `cover`, 마지막 카드 = `source`
   - `visual.bg_*`, `visual.accent`: 반드시 hex 코드 (`#RGB` 또는 `#RRGGBB`). Tailwind 클래스 금지.
   - `sources` 필드가 있는 타입(reason/bullish/bearish)에는 최소 1개 source 필수
   - 이슈당 card id는 1부터 순서대로 부여
4. **콘텐츠 규칙**:
   - 투자 권유/유도 표현 절대 금지 (예: "지금 사야 한다", "매수 추천")
   - 사실 기반 서술만 허용, 미래 예측 단정 표현 금지
   - 한국어로 작성

**Rationale**: 텍스트 기반 지시가 Claude의 실제 출력에 가장 직접적 영향. 기존 research에서 LLM structured output 품질은 system prompt의 구체성에 비례함이 검증됨.

---

## Research Decision 3: 맥락 카드(Context Issues) 생성 방식

**문제**: 코스피·나스닥·USD/KRW 맥락 카드는 어떤 입력을 받고 어떻게 생성하는가?

**현황**: SRS § 3.4에서 "지수/환율 맥락 카드: 별도 호출로 생성"으로 명시. 그러나 당일 지수 수치를 어디서 가져오는지는 SRS에 명시되지 않음.

**Decision**: `generateContextIssues(contextData, deps)` 신규 함수 추가

- **입력**: `ContextMarketData[]` — 각 항목은 `{ entityId, entityName, entityType: 'index' | 'currency', value, change, changePercent }` 형태의 사전 수집 데이터
- **호출자**: `runPipeline()` (pipeline/index.ts) 또는 별도 파이프라인 단계
- **MVP 범위**: 함수 시그니처와 구현만 제공. 실제 지수 데이터 수집(market data API 연동)은 이 이슈 범위 밖. 테스트는 mock 데이터로 단위 테스트.
- **생성 방식**: `generateIssues()`와 동일한 tool_use 패턴 사용. user prompt에 지수 데이터 텍스트로 전달.

**Rationale**:
1. 지수 데이터 수집 방식이 아직 미결정(외부 API vs 수동 입력 vs 별도 수집 모듈). 함수 인터페이스만 정의하면 호출자가 나중에 결정 가능.
2. `generateIssues()`와 동일한 tool_use 패턴으로 일관성 유지. 중복 최소화.

**Alternatives Considered**: `generateIssues()`에 `isContext: boolean` 파라미터 추가 — 하나의 함수로 통합 가능하나, 입력 타입이 달라 분리하는 것이 더 명확.

---

## Research Decision 4: 채널 기본값

**문제**: 현재 코드에서 `channel: issue.channel ?? 'default'`인데 SRS는 `'v1'`을 명시.

**Decision**: `'default'` → `'v1'`으로 수정

**Rationale**: SRS § 4.3에서 "channel 필드 MVP 기본값: 'v1'"으로 명시. 스토어(`insertDraftIssues`)가 channel을 DB에 그대로 저장하므로 생성 단계에서 올바른 값이 필요.

---

## 기존 의존성 재확인

| 모듈 | 상태 | 변경 여부 |
|------|------|-----------|
| `src/lib/cards.ts` (`parseCards`) | ✅ 완전 구현 | 수정 없음 |
| `src/types/cards.ts` | ✅ 완전 구현 | 수정 없음 |
| `src/types/pipeline.ts` | ✅ 있음 | `ContextMarketData` 타입 추가 필요 |
| `src/lib/pipeline/collect.ts` | ✅ 완전 구현 | 수정 없음 |
| `src/lib/pipeline/store.ts` | ✅ 완전 구현 | 수정 없음 |
| `src/lib/pipeline/index.ts` | ✅ 있음 | `generateContextIssues` 재내보내기 추가 |

---

## 결론: 구현 범위 요약

1. **`generate.ts` 수정**:
   - `buildSystemPrompt()` 신규 함수 추가 (7개 카드 타입 + 제약 규칙 + 콘텐츠 규칙)
   - `messages.create()` 호출에 `system` 파라미터 추가
   - `channel` 기본값 `'default'` → `'v1'` 수정
   - `generateContextIssues(contextData, deps)` 신규 함수 추가
   - `buildContextPrompt(contextData)` 신규 헬퍼 추가

2. **`types/pipeline.ts` 수정**:
   - `ContextMarketData` 타입 추가

3. **`pipeline/index.ts` 수정**:
   - `generateContextIssues` 재내보내기 추가

4. **`tests/unit/lib/pipeline-generate.test.ts` 수정**:
   - system prompt가 AI 호출에 포함되는지 검증 케이스 추가
   - `generateContextIssues` 단위 테스트 추가 (happy path, 0건 early exit)
   - channel 기본값 `'v1'` 검증
