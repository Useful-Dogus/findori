# Research: 카드 카피 편집 가드레일

**Feature**: 116-card-copy-guardrails
**Date**: 2026-04-03

## Decision 1: 가드레일 적용 레이어

**Decision**: 신규 `guardrails.ts` 모듈을 생성하여 생성 후(post-generation) 경고 전용 검증 수행

**Rationale**:
- `cards.ts`의 기존 Zod 스키마는 구조 검증 전용 (위반 시 저장 차단). 여기에 글자 수 제약을 추가하면 저장 차단 로직과 경고 로직이 뒤섞임
- 별도 모듈로 분리하면 책임 분리 원칙 준수 + 향후 "저장 차단 전환"이 필요할 때 한 곳만 수정하면 됨
- `generate.ts`의 `generateIssues()` 반환값에 `violations` 배열 추가 → 파이프라인 오케스트레이터(`index.ts`)에서 로그에 포함

**Alternatives considered**:
- Zod `.max()` 를 `cards.ts`에 직접 추가: 저장 차단 효과가 생겨 스펙 위반 (B 옵션 = 경고 후 저장)
- Tool schema `maxLength` 추가만: LLM 힌트 역할이지 런타임 강제가 아님. 단독 사용은 불충분

---

## Decision 2: 프롬프트 강화 방식

**Decision**: `buildSystemPrompt()`의 카드 타입 카탈로그 섹션에 필드별 글자 수 한도를 수치로 명시 + 어미 아키타입별 규칙 추가

**Rationale**:
- 기존 시스템 프롬프트가 이미 "80자 이내", "30자 이내" 등 일부 수치를 포함하나 일관성이 없음 (일부 필드는 수치 없이 "3줄"로만 표현)
- 수치 통일 + tool schema `maxLength` 추가로 LLM이 준수 확률을 높임
- 어미 규칙은 아키타입 테이블에 컬럼 추가로 표현

**Alternatives considered**:
- Prompt만 강화: 런타임 감지 없어 위반을 파악하지 못함
- 별도 validation API 호출: 비용/지연 추가, 과도한 설계

---

## Decision 3: 필드별 글자 수 기준 (시스템 프롬프트 현황 기반)

현재 `buildSystemPrompt()`에 명시된 수치를 정리하고, 누락된 필드를 카드 레이아웃 기준으로 추론.

| 카드 타입 | 필드 | 현행 기준 | 확정 기준 |
|-----------|------|-----------|-----------|
| delta | context | 80자 | 80자 |
| delta | before / after | 비어있으면 안 됨 | 비어있으면 안 됨 (기존 유지) |
| delta-intro | whatDesc | 2문장 이내 | 2문장 / 100자 |
| delta-intro | trigger | 1문장 | 1문장 / 60자 |
| cause | result | 30자 | 30자 |
| cause | cause | 3줄/120자 | 120자 |
| stat | reveal | 2줄 | 80자 |
| compare | q | 미명시 | 40자 |
| compare | footer | 미명시 | 60자 |
| verdict | verdict | 50자 | 50자 |
| question | q | 미명시 | 50자 |
| question | hint | 미명시 | 60자 |

---

## Decision 4: 어미 아키타입 매핑

**Decision**: 아키타입 → 어미 스타일 매핑을 시스템 프롬프트의 스토리 아키타입 테이블에 컬럼 추가

| 아키타입 | 어미 스타일 |
|---------|------------|
| BREAKING | 문어체 (~했다, ~이다) |
| EARNINGS | 문어체 |
| MACRO | 문어체 |
| THEME | 문어체 |
| EDUCATION | 경어체 (~했어요, ~입니다) |

---

## Decision 5: GuardrailViolation 로깅 위치

**Decision**: `generate.ts`의 `generateIssues()` 반환 타입에 `violations: GuardrailViolation[]` 추가. `index.ts`에서 기존 `errors` 배열과 분리해 로그에 포함.

**Rationale**: `errors`는 카드 생성 실패(저장 차단 대상), `violations`는 경고(저장 허용). 두 가지를 동일 배열에 넣으면 모니터링 시 혼동.
