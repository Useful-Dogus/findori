# Tasks: 콘텐츠 품질 개선 — Phase 1

## T1. generate.ts — temperature 0.2 → 0.7

**파일**: `src/lib/pipeline/generate.ts`
**변경 위치**: `generateIssues()` (line ~435), `generateContextIssues()` (line ~507)
```ts
temperature: 0.7,  // 0.2에서 변경
```

## T2. generate.ts — buildSystemPrompt() 전면 재작성

**파일**: `src/lib/pipeline/generate.ts`
**변경 위치**: `buildSystemPrompt()` 함수 전체

추가 요소:
- 편집 페르소나 ("핀도리 데일리" 수석 편집장)
- Δ 우선·3줄 압축·결과→원인·말투 안티패턴·비교 신뢰 원칙
- 스토리 아키타입 6가지
- 커버 훅 공식 4가지 + 좋은/나쁜 예시
- 이상적인 few-shot JSON 예시 1개
- community·stats 강화 가이드

## T3. collect.ts — MAX_CONTENT_LENGTH 500 → 1500

**파일**: `src/lib/pipeline/collect.ts`
```ts
const MAX_CONTENT_LENGTH = 1500  // 500에서 변경
```

## T4. filter.ts — 흥미도 기준 추가

**파일**: `src/lib/pipeline/filter.ts`
**변경 위치**: `buildFilterPrompt()` 내 선별 기준 목록

추가:
```
3. 흥미도: 구체적 수치나 반전이 있어 "친구에게 말하고 싶은" 기사 우선
```

## T5. 품질 게이트 — build + lint 통과

```bash
npm run build
npm run lint
```

## T6. 커밋 및 PR 생성

- 브랜치: `issue/91-content-quality`
- 커밋 메시지: `feat: 파이프라인 콘텐츠 품질 개선 — 프롬프트 재설계 + 설정 최적화 (#91)`
- PR 생성 후 URL 보고
