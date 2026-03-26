# Feature Specification: 콘텐츠 품질 개선 — Phase 1

**Feature Branch**: `issue/91-content-quality`
**Created**: 2026-03-26
**Status**: Draft
**GitHub Issue**: #91

## 배경

현재 파이프라인이 생성하는 카드가 기계적으로 느껴지는 원인을 분석한 결과(specs/091-content-quality-analysis.md), 다음 4가지 즉시 해결 가능한 문제가 확인됐다.

1. **Temperature 0.2** — 구조적 정확성은 tool_use 스키마가 보장하므로 언어 표현까지 제약할 필요가 없다.
2. **시스템 프롬프트가 "규칙 준수 기계"를 만들고 있다** — 편집 페르소나·Δ 원칙·독자 연결 등이 0%.
3. **기사 content 500자 제한** — 수치·원인·맥락이 잘려나가 빈약한 카드가 생성된다.
4. **필터에 "흥미도" 기준 없음** — 투자 관련성이 높아도 공유하고 싶지 않은 기사가 선택된다.

## 변경 범위 (Phase 1)

| # | 파일 | 변경 |
|---|------|------|
| 1 | `generate.ts` | `temperature` 0.2 → 0.7 (두 곳) |
| 2 | `generate.ts` | `buildSystemPrompt()` 전면 재작성 |
| 3 | `collect.ts` | `MAX_CONTENT_LENGTH` 500 → 1500 |
| 4 | `filter.ts` | `buildFilterPrompt()` 흥미도 기준 추가 |

## User Scenarios & Testing *(mandatory)*

### User Story 1 — 파이프라인이 더 생동감 있는 카드를 생성한다 (Priority: P0)

운영자가 파이프라인을 실행하면, 생성된 카드의 cover title에 Δ(변화량) 수치가 포함되고 body가 3줄 이내이며 커뮤니티 반응이 현실적인 구어체로 작성된다.

**Acceptance Scenarios**:

1. **Given** 삼성전자 주가 관련 기사들이 수집됐을 때, **When** 카드가 생성되면, **Then** cover.title에 "6개월 만에 7% 급등" 형태의 Δ 수치가 포함된다.
2. **Given** 기사에서 커뮤니티 반응을 유추할 수 없을 때, **When** 카드가 생성되면, **Then** community 카드가 생략된다.
3. **Given** stats 카드가 생성될 때, **When** items를 확인하면, **Then** 날짜만 있는 타임스탬프 항목이 없다.
4. **Given** body 텍스트가 생성될 때, **When** 길이를 확인하면, **Then** 3줄(80자) 이내로 작성된다.

### User Story 2 — 필터가 흥미도 높은 기사를 우선 선택한다 (Priority: P1)

Haiku 필터링 단계에서 단순 투자 관련성 외에도 "친구에게 말하고 싶은 수치나 반전"이 있는 기사가 우선 선택된다.

**Acceptance Scenarios**:

1. **Given** 투자 관련성이 같은 기사 A(수치/반전 있음)와 B(없음)가 있을 때, **When** 필터가 실행되면, **Then** A가 B보다 우선 선택될 가능성이 높다.

### User Story 3 — 기사 본문이 1500자로 확장되어 더 풍부한 카드가 생성된다 (Priority: P1)

stats 카드에 실제 수치가 포함되고, reason 카드의 원인 설명이 구체적이다.

**Acceptance Scenarios**:

1. **Given** 기사 content가 1500자로 수집될 때, **When** stats 카드가 생성되면, **Then** 실제 수치(%, 조원 등)가 포함된다.
