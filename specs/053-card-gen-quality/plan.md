# Implementation Plan: 카드 생성 품질 개선 — 투자자 내러티브 + 비주얼 디자인 가이드

**Branch**: `053-card-gen-quality` | **Date**: 2026-03-12 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/053-card-gen-quality/spec.md`

---

## Summary

`src/lib/pipeline/generate.ts`의 `buildSystemPrompt()` 함수를 in-place 수정하여, 투자자 관점의 내러티브 흐름 가이드와 이슈 분위기별 비주얼 팔레트 가이드를 추가한다. `generateIssues()` / `generateContextIssues()` 시그니처·스키마·DB·UI는 변경하지 않는다.

**핵심 선결 조건**: 053 브랜치는 #13 ([buildSystemPrompt 첫 구현]) 이전에 분기되었으므로, 구현 전 `git merge origin/main`으로 #13 변경 사항을 먼저 통합해야 한다.

---

## Technical Context

**Language/Version**: TypeScript 5.4+, Node.js 20+
**Primary Dependencies**: `@anthropic-ai/sdk` (기존), `zod` (기존), Vitest (기존)
**Storage**: N/A (텍스트 함수 수정만)
**Testing**: Vitest — 기존 unit test 유지 + system 파라미터 검증 테스트 추가
**Target Platform**: Next.js 15 App Router (서버사이드 파이프라인)
**Project Type**: Web service
**Performance Goals**: buildSystemPrompt()는 동기 순수 함수 — 성능 영향 없음
**Constraints**: 기존 parseCards() 스키마 검증 통과율 유지
**Scale/Scope**: 단일 함수 수정, 1개 파일

---

## Constitution Check

### I. Code Quality Is a Release Gate
✅ buildSystemPrompt()는 순수 문자열 반환 함수. 복잡도 없음. 명확한 섹션 구조로 가독성 유지.

### II. Tests Define Correctness
⚠️ **주의**: 기존 테스트에서 `channel: 'default'`를 기대하지만, main의 #13은 `'v1'`으로 변경함. main merge 후 해당 테스트 수정 필요.
✅ buildSystemPrompt 변경 자체는 기존 mock 기반 테스트에 영향 없음.
✅ 신규: `messages.create` 호출 시 `system` 파라미터 포함 여부 테스트 추가.

### III. User Experience Consistency Over Local Preference
✅ UI 변경 없음.

### IV. Performance Is a First-Class Requirement
✅ 동기 순수 함수 수정. N+1 없음. 메모리 영향 미미.

### V. Small, Verifiable, and Reversible Delivery
✅ 단일 함수 텍스트 수정. 롤백: buildSystemPrompt() 이전 버전으로 되돌리기.

---

## Project Structure

### Documentation (this feature)

```text
specs/053-card-gen-quality/
├── plan.md              ← 이 파일
├── research.md          ← 완료 (브랜치 상태, gap 분석, 테스트 전략)
├── data-model.md        ← 완료 (스키마 변경 없음, 개념 모델 정리)
├── quickstart.md        ← 완료 (테스트 실행 및 수동 검증 방법)
├── reference.md         ← 기존 (Claude 단일 대화 실험 인사이트)
└── tasks.md             ← /speckit.tasks 명령으로 생성 예정
```

### Source Code (변경 대상)

```text
src/
└── lib/
    └── pipeline/
        └── generate.ts          ← buildSystemPrompt() 수정 (유일한 변경 파일)

tests/
└── unit/
    └── lib/
        └── pipeline-generate.test.ts  ← channel 'v1' 수정 + system 파라미터 검증 추가
```

**Structure Decision**: 단일 파일 수정. 신규 파일 생성 없음.

---

## Phase 0: Research Findings

→ `research.md` 참조. 핵심 요약:

1. **브랜치 상태**: 053 브랜치는 #12 이후 분기. `git merge origin/main` 먼저 실행.
2. **수정 대상**: `buildSystemPrompt()` 함수 단독 수정 (텍스트 변경).
3. **기존 테스트**: 영향 없음. `channel: 'default'` → `'v1'` 수정 필요.
4. **신규 테스트**: system 파라미터 전달 검증.

---

## Phase 1: Design

### buildSystemPrompt() v2 구조

기존 구조(v1)에서 **3개 섹션 추가**, 기존 섹션 **유지**:

```
[역할 정의]                       ← 유지
[카드 타입 카탈로그 — 7종]         ← 유지
[내러티브 흐름 가이드]             ← 신규 (FR-001, FR-002)
[비주얼 팔레트 가이드]             ← 신규 (FR-003, FR-004)
[카드별 콘텐츠 가이드]             ← 신규 (FR-005, FR-006)
[제약 규칙]                       ← 유지
[콘텐츠 규칙]                     ← 유지
```

### 내러티브 흐름 가이드 (신규, FR-001/FR-002)

투자자 7단계 질문 흐름 + 카드 타입 매핑:
- cover: "뭔 일이야?" — 핵심 결론 + 수치 (title 첫 줄에 종목명 또는 수치 필수)
- reason: "왜 이런 거야?"
- bullish: "더 오를까?"
- bearish: "리스크는?"
- community: "다들 어떻게 봐?"
- stats: "수치로 확인해줘"
- source: "어디서 봤어?"

생략 기준: bullish(긍정 근거 없을 때), bearish(리스크 없을 때), community(커뮤니티 반응 유추 불가), stats(수치 추출 불가)
최소 구성: cover + reason 또는 bullish + source (3장)

### 비주얼 팔레트 가이드 (신규, FR-003/FR-004)

| 분위기 | 계열 | bg 예시 | accent 예시 |
|--------|------|--------|------------|
| 상승·강세 | warm (hue 0–60) 또는 vivid green (100–150) | `#1a0505 → #6b1a1a` | `#ff6b35` |
| 하락·리스크 | cool (hue 200–280) | `#050514 → #1a1a4a` | `#4fc3f7` |
| 중립·복합 | monochrome/slate | `#0a0a0a → #2d2d2d` | `#e2e8f0` |

일관성 규칙: 동일 이슈 내 모든 카드는 동일 팔레트 계열 유지.

### 카드별 콘텐츠 가이드 (신규, FR-005/FR-006)

- **community**: 주식 갤러리·네이버 종목 토론 어조. 감정 표현, 속어 허용. 억지 생성 금지.
- **stats**: 이슈 유형별 우선 지표 명시 (주식 상승: 등락률·거래량·외인순매수 / 하락: 등락률·기관순매도 / 지수: 거래대금 / 통화: 환율·달러인덱스). 날짜·종목명 반복 금지.

### 테스트 설계

```typescript
// 기존 테스트 수정
expect(result.issues[0].channel).toBe('v1')  // 'default' → 'v1'

// 신규 테스트: system 파라미터 전달 검증
it('passes system prompt to the API call', async () => {
  const anthropic = { messages: { create: vi.fn().mockResolvedValue(...) } }
  await generateIssues(ARTICLES, { anthropic })
  const callArg = anthropic.messages.create.mock.calls[0][0]
  expect(callArg).toHaveProperty('system')
  expect(typeof callArg.system).toBe('string')
  expect(callArg.system.length).toBeGreaterThan(0)
})

// generateContextIssues도 동일 검증
```

---

## Complexity Tracking

해당 없음. Constitution Check 위반 없음.
