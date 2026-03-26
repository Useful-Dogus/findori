# Implementation Plan: 콘텐츠 품질 개선 — Phase 1

**Feature**: #91 콘텐츠 품질 개선
**Approach**: 기존 스키마(tool_use input_schema) 유지. 프롬프트·설정 레이어만 변경.

## 아키텍처 결정

### ADR-1: 기존 카드 타입 스키마 유지

Phase 1은 DB 마이그레이션 없이 즉시 적용 가능한 변경만 포함한다.
카드 타입 재설계(delta/cause/stat/compare/impact/verdict)는 Phase 2에서 별도 진행.

### ADR-2: content 길이 500 → 1500자

비용 영향: Sonnet 입력 기준 기사당 ~1000자 증가 × 기사 10건 = ~10,000 tokens × $3/MTok ≈ **$0.03/회 추가**.
품질 개선 효과(수치 확보, 원인 설명 개선)가 비용을 상회한다.

### ADR-3: temperature 0.2 → 0.7

JSON 구조는 tool_use의 `input_schema` + Zod 검증이 보장한다.
언어 표현에까지 temperature를 낮게 유지할 이유가 없다.
0.7은 창의성과 일관성의 균형점 (1.0은 불안정, 0.5는 여전히 딱딱함).

## 변경 파일 목록

| 파일 | 변경 요약 |
|------|----------|
| `src/lib/pipeline/generate.ts` | `temperature` 0.2→0.7 (2곳), `buildSystemPrompt()` 전면 재작성 |
| `src/lib/pipeline/collect.ts` | `MAX_CONTENT_LENGTH` 상수 500→1500 |
| `src/lib/pipeline/filter.ts` | `buildFilterPrompt()` 흥미도 기준 3번째 항목 추가 |

## 변경하지 않는 것

- DB 스키마, 마이그레이션 없음
- `buildToolSchema()` — 기존 카드 타입 유지
- `generateContextIssues()` 로직 — temperature 외 변경 없음
- API 엔드포인트, Admin UI 없음

## buildSystemPrompt() 재설계 원칙

현재 프롬프트 구성비: 형식 규칙 60% + 금지 조항 15% + 내러티브 15% + 스타일 0%
목표 구성비: 편집 페르소나 15% + 스타일+예시 40% + 구조 가이드 30% + 핵심 규칙 15%

추가 요소:
1. 편집 페르소나 ("핀도리 데일리" 수석 편집장)
2. Δ 우선 원칙 (변화량 > 절대값)
3. 3줄 압축 원칙
4. 결과 → 원인 순서
5. 말투 안티패턴 명시 (LLM 티 나는 패턴 금지)
6. 비교로 신뢰 구축 원칙
7. 스토리 아키타입 6가지 (BREAKING/EARNINGS/MACRO/THEME/EDUCATION/DAILY_WRAP)
8. 커버 훅 공식 4가지 + 좋은/나쁜 예시
9. 이상적인 카드 JSON few-shot 예시 1개
10. community·stats 카드 강화된 가이드
