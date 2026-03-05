# Implementation Plan: 뉴스 수집 모듈

**Branch**: `012-news-collector` | **Date**: 2026-03-05 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/012-news-collector/spec.md`

---

## Summary

`collectArticles` 함수 및 관련 타입·테스트는 Issue #11 구현 시 이미 완성되어 있다 (FR-001~006, 008 충족). 이번 이슈의 구현 범위는 미구현 항목인 **FR-007(매체별 수집 건수·중복 제거 건수를 pipeline_logs에 기록)**으로 한정된다. DB에 `source_stats`, `articles_raw` 컬럼을 추가하고 `collectArticles` 반환 타입을 확장하여 하류 로깅 경로까지 전달한다.

---

## Technical Context

**Language/Version**: TypeScript 5.4+ / Node.js 20+
**Primary Dependencies**: `rss-parser` (기존 설치), `@supabase/supabase-js` ^2.0, `zod` ^4.3
**Storage**: Supabase PostgreSQL — `pipeline_logs`(컬럼 추가), `media_sources`(읽기 전용)
**Testing**: Vitest (기존 환경)
**Target Platform**: Vercel (Next.js Route Handler + Serverless Function)
**Project Type**: 내부 파이프라인 모듈 (라이브러리 함수)
**Performance Goals**: 활성 매체 10개 기준 수집 완료 60초 이내 (SC-001)
**Constraints**: Vercel Hobby 최대 300초 함수 실행 시간, 매체별 RSS timeout 30s
**Scale/Scope**: 초기 수십 명 규모, 매체 수 10개 이하

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| 원칙 | 준수 여부 | 근거 |
|------|----------|------|
| I. Code Quality | ✅ | 기존 collect.ts가 명확한 순수 함수 구조. 신규 변경도 동일 패턴 유지 |
| II. Tests Define Correctness | ✅ | 기존 2개 테스트 통과 중. FR-007 구현 시 신규 필드 검증 테스트 추가 필수 |
| III. UX Consistency | N/A | 사용자 노출 UI 없는 내부 모듈 |
| IV. Performance | ✅ | RSS_TIMEOUT_MS=30s 기존 설정. 병렬 Promise.all 패턴 유지 |
| V. Small & Reversible | ✅ | DB 컬럼 추가(NOT NULL DEFAULT) — 기존 데이터 무손실, 롤백 가능 |

**Complexity Tracking**: 위반 없음. 신규 DB 컬럼은 DEFAULT 값으로 기존 데이터를 보호하므로 롤백 리스크 없다.

---

## Project Structure

### Documentation (this feature)

```text
specs/012-news-collector/
├── spec.md              ✅ (완성)
├── plan.md              ✅ (이 파일)
├── research.md          ✅ (완성)
├── data-model.md        ✅ (완성)
├── contracts/
│   └── collect-api.md   ✅ (완성)
└── tasks.md             — /speckit.tasks 에서 생성
```

### Source Code (변경 대상)

```text
src/
├── types/
│   ├── database.types.ts       # source_stats, articles_raw 컬럼 수동 추가
│   └── pipeline.ts             # PipelineSourceStat 타입 추가, 관련 타입 확장
└── lib/
    └── pipeline/
        ├── collect.ts          # sourceStats/articlesRaw 계산 + 반환 타입 확장
        ├── log.ts              # finishPipelineRun 파라미터 + UPDATE 쿼리 확장
        └── index.ts            # 새 필드를 finishPipelineRun 호출 시 전달

supabase/
└── migrations/
    └── YYYYMMDDHHMMSS_add_pipeline_source_stats.sql   # 신규

tests/
└── unit/
    └── lib/
        └── pipeline-collect.test.ts    # sourceStats/articlesRaw 검증 케이스 추가
```

**Structure Decision**: 기존 `src/lib/pipeline/` 모듈 구조 유지. 새 파일 생성 없이 기존 파일 4개 확장 + migration 1개 추가.

---

## Phase 0: Research

→ [research.md](./research.md) 참조

**핵심 결론:**
- 기존 구현(collect.ts, tests)이 FR-001~006, 008 충족
- FR-007 gap: 매체별 수집 건수(`source_stats`) + dedup 이전 총 건수(`articles_raw`) 미저장
- 저장 방식: `pipeline_logs`에 신규 컬럼 2개 추가 (migration) — 스키마 의미론 명확, 이력 조회 가능

---

## Phase 1: Design

→ [data-model.md](./data-model.md), [contracts/collect-api.md](./contracts/collect-api.md) 참조

### 구현 순서 (의존성 기준)

```
1. DB Migration 작성
   └── supabase/migrations/*.sql (source_stats, articles_raw 컬럼 추가)
       ↓
2. database.types.ts 수동 업데이트
   (pipeline_logs Row/Insert/Update에 신규 컬럼 반영)
       ↓
3. types/pipeline.ts 확장
   (PipelineSourceStat 추가, CollectResult 반환 타입 정의)
       ↓
4. collect.ts 반환 타입 + 로직 확장
   (perSourceResults에서 sourceStats 집계, articlesRaw 계산)
       ↓
5. log.ts finishPipelineRun 확장
   (파라미터에 source_stats, articles_raw 추가, UPDATE 쿼리 확장)
       ↓
6. pipeline/index.ts 호출 수정
   (collectArticles 결과에서 새 필드를 finishPipelineRun에 전달)
       ↓
7. pipeline-collect.test.ts 테스트 추가
   (sourceStats, articlesRaw 반환값 검증)
       ↓
8. 품질 게이트 실행
   (npm run validate + npm run test)
```

### 핵심 로직 변경 상세

**collect.ts — sourceStats/articlesRaw 계산:**

```typescript
// perSourceResults 집계 이후
const sourceStats: PipelineSourceStat[] = sources
  .map((source, i) => ({
    source: source.name,
    count: perSourceResults[i].length,  // 당일 필터 이후, dedup 이전
  }))
  .filter((_, i) => !errors.some(e => e.source === sources[i].name))
  // 실패한 매체는 sourceStats에서 제외

const articlesRaw = perSourceResults.flat().length  // dedup 이전 전체

return { articles, errors, sourceStats, articlesRaw }
```

**log.ts — finishPipelineRun 확장:**

```typescript
params: {
  status: Exclude<PipelineStatus, 'running'>
  completedAt?: Date
  articlesCollected: number
  articlesRaw: number           // 신규
  sourceStats: PipelineSourceStat[]  // 신규
  issuesCreated: number
  errors: PipelineError[]
}

// UPDATE 쿼리에 추가:
source_stats: params.sourceStats,
articles_raw: params.articlesRaw,
```

---

## Phase 2: Validation

품질 게이트 (구현 완료 후 반드시 실행):

```bash
npm run validate   # type-check + lint + format:check
npm run test       # Vitest 전체
npm run build      # 빌드 확인 (타입 오류 최종 점검)
```

**통과 기준:**
- `pipeline-collect.test.ts`: sourceStats/articlesRaw 신규 케이스 포함 전체 통과
- `pipeline-run.test.ts`: 기존 통합 테스트 회귀 없음
- TypeScript strict 모드 오류 없음
