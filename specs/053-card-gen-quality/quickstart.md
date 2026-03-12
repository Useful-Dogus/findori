# Quickstart: 카드 생성 품질 개선 검증 방법

**Branch**: `053-card-gen-quality` | **Date**: 2026-03-12

---

## 사전 조건

```bash
# 브랜치 확인
git branch  # 053-card-gen-quality 이어야 함

# 의존성 설치 (필요 시)
npm install
```

---

## 1. 단위 테스트 실행

```bash
npm run test -- tests/unit/lib/pipeline-generate.test.ts
```

**검증 항목**:
- `buildSystemPrompt()` 반환값에 내러티브 흐름 섹션 포함 여부
- `messages.create` 호출 시 `system` 파라미터 전달 확인
- `generateContextIssues()` 동일 동작 확인

---

## 2. 타입 체크 + 린트

```bash
npm run validate
```

---

## 3. 수동 품질 검증 (Admin 검토)

실제 환경에서 파이프라인을 실행하고 생성된 카드를 Admin UI에서 확인:

```
Admin > Pipeline > Run Pipeline
→ 생성된 이슈 > 카드 검토
```

**체크리스트**:
- [ ] cover.title에 수치 또는 핵심 결론이 포함됐는가?
- [ ] 카드 순서가 cover → reason/bullish/bearish → community → stats → source 흐름인가?
- [ ] 상승 이슈의 visual 팔레트가 warm 계열인가?
- [ ] 하락 이슈의 visual 팔레트가 cool 계열인가?
- [ ] 모든 카드가 동일 팔레트 계열을 사용하는가?
- [ ] community 카드의 quotes가 실제 투자자 어조인가?
- [ ] stats.items에 수치 기반 지표만 포함됐는가?
- [ ] 근거 없는 카드가 억지로 생성되지 않았는가?

---

## 4. buildSystemPrompt 텍스트 직접 확인

```typescript
// REPL 또는 테스트 파일에서
import { generateIssues } from '@/lib/pipeline/generate'
// buildSystemPrompt는 모듈 내부 함수이므로 mock create 캡처로 확인

const captured: unknown[] = []
await generateIssues(articles, {
  anthropic: {
    messages: {
      create: async (params) => {
        captured.push(params)
        return { content: [] }  // 실제 응답 필요 시 mock 교체
      }
    }
  }
})
console.log((captured[0] as { system: string }).system)
```
