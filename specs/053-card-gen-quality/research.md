# Research: 카드 생성 품질 개선 (Issue #53)

**Branch**: `053-card-gen-quality` | **Date**: 2026-03-12

---

## 1. 브랜치 상태 분석

### Decision: 구현 전 main 머지 필요

| 항목 | 내용 |
|------|------|
| 053 브랜치 분기 시점 | `7d33313` ([#12]) |
| main 현재 HEAD | `8d66a2d` ([#15]) |
| 누락된 커밋 | `17e9cb2` ([#13]: buildSystemPrompt + generateContextIssues) |

**053 브랜치는 #13이 머지되기 전 시점에 생성되었다.** 현재 053 브랜치의 `generate.ts`에는 `buildSystemPrompt()`가 없고, `buildPrompt()`만 존재한다. 구현 첫 단계로 `git merge origin/main`을 실행해야 한다.

- Decision: `git merge origin/main` 후 구현
- Rationale: rebase는 스펙 커밋 히스토리가 꼬일 수 있어 merge 선택
- Alternatives considered: rebase — 히스토리 정리되지만 공개 브랜치에서 위험

---

## 2. 현재 buildSystemPrompt() 구조 (013/main 기준)

```
[역할 정의]
  → 금융 뉴스 편집 파이프라인, 한국 개인 투자자 대상

[카드 타입 카탈로그 — 7종]
  cover / reason / bullish / bearish / community / stats / source
  각 타입별 필수 필드 명시

[제약 규칙]
  - 3~7장, cover 첫째, source 마지막
  - visual 모든 필드: hex 코드
  - reason/bullish/bearish sources 최소 1개
  - id: 1부터 순서대로

[콘텐츠 규칙]
  - 투자 권유 금지, 사실 기반, 한국어
```

---

## 3. Gap 분석: v1 → v2

| 항목 | v1 (현재) | v2 (목표) | 추가 필요 |
|------|-----------|-----------|-----------|
| 내러티브 순서 | 없음 | 투자자 질문 흐름 7단계 | ✅ |
| cover title 가이드 | "핵심 요점을 `\n`으로 강조" | "수치 + 결론" 필수 구조 | ✅ |
| 비주얼 팔레트 | hex 형식만 | 분위기별 팔레트 + hex 예시 | ✅ |
| 팔레트 일관성 | 없음 | 이슈 단위 동일 계열 | ✅ |
| community 어조 | 없음 | 커뮤니티 속어 허용 + 생략 기준 | ✅ |
| stats 우선 지표 | 없음 | 이슈 유형별 예시 | ✅ |
| 카드별 생략 기준 | "근거 약하면 생략" | 타입별 생략 조건 명시 | ✅ |

---

## 4. 기존 테스트 호환성 검토

### Decision: 기존 테스트는 buildSystemPrompt 변경 영향 없음

`tests/unit/lib/pipeline-generate.test.ts`는 mock anthropic client를 사용하며, `system` 파라미터 전달 여부를 검증하지 않는다. 기존 3개 테스트는 모두 통과 유지.

**주의**: 기존 테스트에서 `channel: 'default'`를 기대하지만, main의 #13 변경은 `channel: 'v1'`으로 수정했다. main merge 후 이 테스트를 `'v1'`으로 업데이트 필요.

### 추가할 테스트
- `buildSystemPrompt()`가 system 파라미터로 전달되는지 검증: `messages.create` 호출 시 `system` 필드 포함 여부 확인

---

## 5. 구현 계획 요약

**변경 파일**: `src/lib/pipeline/generate.ts` — `buildSystemPrompt()` 함수만 수정

**신규 섹션 (buildSystemPrompt 내 추가)**:
1. `## 내러티브 흐름` — 투자자 질문 7단계 + 카드 타입 매핑
2. `## 비주얼 팔레트 가이드` — 상승/하락/중립 hex 예시 + 팔레트 일관성 규칙
3. `## 카드별 콘텐츠 가이드` — cover/reason/bullish/bearish/community/stats 상세 가이드

**보존**: 기존 카드 타입 카탈로그, 제약 규칙, 콘텐츠 규칙 — 삭제 없이 유지

**시그니처 변경 없음**: `generateIssues()`, `generateContextIssues()` 파라미터/반환값 동일

---

## 6. 결론

모든 NEEDS CLARIFICATION 해소됨:
- ✅ 브랜치 상태: main merge 후 구현
- ✅ 수정 대상: `buildSystemPrompt()` 단일 함수
- ✅ 테스트 전략: 기존 mock 테스트 유지 + system 파라미터 검증 추가
- ✅ 스키마/시그니처: 변경 없음
