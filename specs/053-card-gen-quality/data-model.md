# Data Model: 카드 생성 품질 개선 (Issue #53)

**Branch**: `053-card-gen-quality` | **Date**: 2026-03-12

---

## 변경 범위

이 이슈는 `buildSystemPrompt()` 텍스트만 수정한다. **DB 스키마, TypeScript 타입, API 시그니처는 일절 변경하지 않는다.**

---

## 관련 엔티티 (읽기 전용)

### SystemPrompt (개념적 엔티티)

Claude API의 `system` 파라미터로 전달되는 텍스트. 현재 `buildSystemPrompt(): string` 함수가 생성.

```
구조 (v1 → v2):
├── [역할 정의]                      ← 유지
├── [카드 타입 카탈로그 — 7종]        ← 유지
├── [내러티브 흐름 가이드]            ← 신규 추가
├── [비주얼 팔레트 가이드]            ← 신규 추가
├── [카드별 콘텐츠 가이드]            ← 신규 추가 (기존 카탈로그 보강)
├── [제약 규칙]                      ← 유지
└── [콘텐츠 규칙]                    ← 유지
```

### NarrativeArc (개념적 모델)

투자자 관점의 스토리 구조. buildSystemPrompt 내 가이드로 내재화.

| 순서 | 투자자 질문 | 카드 타입 | 생략 가능 |
|------|------------|-----------|----------|
| 1 | "뭔 일이야?" | `cover` | ❌ 필수 |
| 2 | "왜 이런 거야?" | `reason` | ✅ |
| 3 | "더 오를까?" | `bullish` | ✅ |
| 4 | "리스크는?" | `bearish` | ✅ |
| 5 | "다들 어떻게 봐?" | `community` | ✅ |
| 6 | "수치로 확인해줘" | `stats` | ✅ |
| 7 | "어디서 봤어?" | `source` | ❌ 필수 |

### VisualPalette (개념적 모델)

이슈 분위기별 hex 색상 집합. buildSystemPrompt에 예시로 포함.

| 분위기 | Hue 범위 | 대표 예시 |
|--------|---------|---------|
| 상승·강세 (Bullish) | warm hue 0–60 또는 vivid green 100–150 | `bg_from: #1a0505`, `accent: #ff6b35` |
| 하락·약세 (Bearish) | cool hue 200–280 | `bg_from: #050514`, `accent: #4fc3f7` |
| 중립·복합 (Neutral) | monochrome/slate | `bg_from: #0a0a0a`, `accent: #e2e8f0` |

---

## 기존 타입 (변경 없음)

```typescript
// src/types/pipeline.ts — 변경 없음
type CollectedArticle     // 입력
type ContextMarketData    // 입력 (generateContextIssues)
type GeneratedIssueDraft  // 출력

// src/types/cards.ts — 변경 없음
// cards_data JSONB 스키마 — 변경 없음
```

---

## 검증 규칙 (변경 없음)

`parseCards()` (`src/lib/cards.ts`)가 수행하는 검증은 그대로 유지:
- 3~7장
- `cards[0].type === 'cover'`
- `cards[last].type === 'source'`
- 모든 visual 필드: hex 코드 형식
- reason/bullish/bearish의 sources: 최소 1개
