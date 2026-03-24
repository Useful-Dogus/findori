# Implementation Plan: 파이프라인 토큰 비용 최적화

**Branch**: `054-pipeline-cost-opt` | **Date**: 2026-03-24 | **Spec**: [spec.md](./spec.md)
**GitHub Issue**: #85

## Summary

123건의 기사를 Claude Sonnet에 그대로 전달하던 파이프라인을 3단계로 최적화한다.

1. **소스별 상한**: RSS 수집 직후 소스당 최신 30건으로 절단 (입력 크기 제한)
2. **Haiku 필터**: Claude Haiku로 투자 관련성 높고 중복 없는 상위 10건 선별 (Sonnet 입력 최소화)
3. **출력 제한**: Sonnet content 500자 제한 + 이슈 최대 3개 제한 (출력 토큰 감소)

추가로 실행별 토큰 사용량과 추산 비용을 `pipeline_logs`에 기록하고 Admin UI에 노출한다.

예상 비용: ~$0.23/회 → ~$0.05/회 (75% 이상 절감)

## Technical Context

**Language/Version**: TypeScript 5 / Next.js 15 (App Router)
**Primary Dependencies**: Anthropic SDK (`@anthropic-ai/sdk`), Supabase JS, Zod
**Storage**: Supabase PostgreSQL — `pipeline_logs` 테이블에 컬럼 추가
**Testing**: `next build` + TypeScript 컴파일 (현재 단위 테스트 없음)
**Target Platform**: Vercel serverless (Node.js 20)
**Project Type**: Web service (Next.js API routes)
**Performance Goals**: 파이프라인 1회 실행 $0.05 이하
**Constraints**: Vercel cron maxDuration 300s, Haiku 오류 시 fallback 필수
**Scale/Scope**: 1~5개 소스, 하루 최대 300건 기사 예상

## Constitution Check

*GATE: spec → plan 진입 전 확인. Phase 1 설계 후 재확인.*

| 원칙 | 상태 | 비고 |
|------|------|------|
| I. 코드 품질 | ✅ | 새 filter.ts 모듈 분리, 기존 파일 최소 수정 |
| II. 테스트 | ⚠️ | 현재 파이프라인 단위 테스트 없음. 이번 범위에서도 추가 불포함 (빌드+타입 검증으로 대체). 별도 이슈 예정 |
| III. UX 일관성 | ✅ | Admin UI 컬럼 추가만. 기존 디자인 패턴 유지 |
| IV. 성능 | ✅ | 비용 절감이 곧 성능 지표. 이전/이후 비용 로그로 측정 |
| V. 소규모 전달 | ✅ | 5개 파일 수정 + 1개 신규 + 마이그레이션 1개 |

## Project Structure

### Documentation (this feature)

```text
specs/054-pipeline-cost-opt/
├── plan.md              # 이 파일
├── research.md          # Phase 0 산출물
├── data-model.md        # Phase 1 산출물
└── tasks.md             # /speckit.tasks 산출물 (별도 명령)
```

### Source Code

```text
src/
├── lib/pipeline/
│   ├── collect.ts          # 수정: 소스당 30건 상한 + content 500자 제한
│   ├── filter.ts           # 신규: Haiku 1차 필터
│   ├── generate.ts         # 수정: 이슈 3개 상한 + usage 추출
│   ├── index.ts            # 수정: filter 단계 추가, 비용 집계
│   └── log.ts              # 수정: tokens_input/output/cost 파라미터 추가
├── types/
│   └── pipeline.ts         # 수정: TokenUsage 타입 추가
└── components/features/admin/
    └── PipelineManager.tsx # 수정: 비용 컬럼 추가

supabase/migrations/
└── 20260324000000_add_pipeline_cost_tracking.sql  # 신규
```

## Complexity Tracking

해당 없음 — Constitution 위반 없음.

---

## Phase 0: Research

### R-001: Anthropic SDK usage 객체 구조

**Decision**: `response.usage.input_tokens`, `response.usage.output_tokens` 사용
**Rationale**: Anthropic SDK가 모든 `messages.create` 응답에 `usage` 포함. 타입: `{ input_tokens: number; output_tokens: number; cache_read_input_tokens?: number; cache_creation_input_tokens?: number }`
**Alternatives**: 토큰 추산 계산 — 정확도 낮아 기각

### R-002: Haiku 모델 ID

**Decision**: `claude-haiku-4-5-20251001`
**Rationale**: `.env.example`에 `ANTHROPIC_MODEL` 환경변수 패턴 있음. Haiku 모델은 별도 상수로 분리
**Alternatives**: 환경변수 `HAIKU_MODEL` — 현재 단계에서 오버엔지니어링, 코드 상수로 충분

### R-003: Haiku 필터 프롬프트 전략

**Decision**: 기사 제목+요약만 전달, tool_use로 선별된 기사 인덱스 배열 반환
**Rationale**: content 제외 시 Haiku 입력 ~80% 절감. 인덱스 배열 반환이 전체 기사 재생성보다 간단하고 안전
**Alternatives**: 전체 기사 재작성 반환 — 할루시네이션 위험, 불필요한 출력 토큰

### R-004: 비용 추산 공식

```
Haiku: (input_tokens / 1_000_000 * 0.80) + (output_tokens / 1_000_000 * 4.00)
Sonnet: (input_tokens / 1_000_000 * 3.00) + (output_tokens / 1_000_000 * 15.00)
total = haiku_cost + sonnet_cost
```

**Decision**: 위 공식을 `log.ts`에 상수로 정의
**Rationale**: 실시간 API 가격 조회 불필요, 단가 변경 시 상수만 수정

### R-005: Supabase 마이그레이션 전략

**Decision**: 새 컬럼 3개 `ALTER TABLE` 추가 (nullable)
```sql
ALTER TABLE pipeline_logs
  ADD COLUMN tokens_input  integer,
  ADD COLUMN tokens_output integer,
  ADD COLUMN estimated_cost_usd numeric(10,6);
```
**Rationale**: 기존 로그 행은 null로 유지, 신규 실행부터만 값 채움. Breaking change 없음

---

## Phase 1: Data Model & Contracts

### data-model.md 요약

**pipeline_logs 테이블 변경**

| 컬럼 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| `tokens_input` | integer | NULL | Haiku + Sonnet 입력 토큰 합계 |
| `tokens_output` | integer | NULL | Haiku + Sonnet 출력 토큰 합계 |
| `estimated_cost_usd` | numeric(10,6) | NULL | 추산 비용 (USD) |

**신규 TypeScript 타입**

```ts
// types/pipeline.ts 추가
export type TokenUsage = {
  inputTokens: number
  outputTokens: number
  estimatedCostUsd: number
}
```

**finishPipelineRun 시그니처 변경**

```ts
// 기존
params: { ..., errors: PipelineError[] }

// 변경
params: { ..., errors: PipelineError[], tokenUsage?: TokenUsage }
```

**filterArticles 시그니처 (신규)**

```ts
// lib/pipeline/filter.ts
export async function filterArticles(
  articles: CollectedArticle[],
  deps?: { anthropic?: AnthropicClientLike }
): Promise<{
  articles: CollectedArticle[]
  usage: TokenUsage | null
  skipped: boolean   // true = fallback 발동
}>
```

### 파이프라인 실행 흐름 (변경 후)

```
collectArticles()          → 전체 기사 수집
  └─ 소스별 최신 30건 cap  [collect.ts 내부]
  └─ content 500자 제한    [collect.ts 내부]

filterArticles()           → Haiku 필터 (신규)
  └─ 투자 관련 상위 10건   [filter.ts]
  └─ 오류 시 원본 반환     [filter.ts fallback]

generateIssues()           → Sonnet 카드 생성
  └─ 이슈 최대 3개 제한    [generate.ts 프롬프트 + Zod]
  └─ usage 추출            [generate.ts]

finishPipelineRun()        → 로그 저장
  └─ tokenUsage 저장       [log.ts]
```

### Admin UI 변경

`PipelineManager.tsx` 테이블에 비용 컬럼 추가:
- 헤더: `비용`
- 값: `$0.047` 형식 (소수점 3자리), null이면 `—`
- 위치: `오류` 컬럼 앞
