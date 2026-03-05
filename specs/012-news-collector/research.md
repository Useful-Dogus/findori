# Research: 뉴스 수집 모듈 (012-news-collector)

## 현황 분석 — 이미 구현된 항목

Issue #11(Cron 파이프라인 엔드포인트) 구현 시 수집 모듈 핵심 기능이 이미 완성되었다.

### 완성된 구현체

| 파일 | 구현 내용 |
|------|-----------|
| `src/lib/pipeline/collect.ts` | `getActiveSources`, `collectArticles` (RSS fetch, KST 날짜 필터, URL dedup, 매체별 오류 처리) |
| `src/types/pipeline.ts` | `CollectedArticle`, `PipelineError`, `PipelineSource` 타입 |
| `tests/unit/lib/pipeline-collect.test.ts` | 2개 unit test 모두 통과 |
| `src/lib/pipeline/index.ts` | `collectArticles` 호출 + 결과를 pipeline_logs에 기록 |

### 충족된 요구사항 (FR 기준)

- FR-001 ✅ `getActiveSources`: `media_sources` active=true 필터 조회
- FR-002 ✅ RSS fetch → `rss-parser` 파싱, 30s timeout
- FR-003 ✅ `isSameTargetDate`: KST(Asia/Seoul) 기준 당일 필터
- FR-004 ✅ `seenUrls` Set 기반 URL exact-match dedup
- FR-005 ✅ `CollectedArticle`: url, title, content/summary, sourceName 포함
- FR-006 ✅ try/catch per-source, 실패 시 `errors` 배열에 추가 후 계속
- FR-008 ✅ 파이프라인 오케스트레이터(`runPipeline`)에서 함수 호출

---

## 미구현 항목 — FR-007 Gap

**FR-007**: "수집 완료 후 매체별 수집 건수, 실패 매체 목록, 중복 제거 건수를 pipeline_logs에 기록해야 한다."

**현재 상태:**
- `articles_collected` (dedup 후 총 수) ✅ pipeline_logs에 저장
- 실패 매체 목록 ✅ `errors` JSONB에 `{source, message}` 형태로 저장
- **매체별 수집 건수 ❌ 미저장**
- **중복 제거 건수 ❌ 미저장** (`articles_raw - articles_collected` 계산 불가)

---

## Decision 1: 매체별 통계 저장 방식

**Decision**: `pipeline_logs`에 새 컬럼 2개 추가 (DB migration)

**Rationale**:
- 옵션 A(신규 컬럼): 스키마 의미론 명확, 이력 조회 가능, 기존 `PipelineError` 타입 오염 없음
- 옵션 B(`errors` JSONB 혼용): migration 불필요하지만 `PipelineError` 타입을 union화해야 하고 소비 코드 전반에 type-guard 분기 퍼짐
- 옵션 C(API 응답에만 포함): migration 최소이나 이력 조회 불가

**Alternatives considered**: 옵션 B는 빠르지만 장기 타입 부채가 더 크다. 옵션 C는 `/api/admin/pipeline/logs` 이력 조회 요건 미충족.

**Schema 추가 사항:**
```sql
ALTER TABLE pipeline_logs
  ADD COLUMN source_stats JSONB NOT NULL DEFAULT '[]',
  ADD COLUMN articles_raw  INT  NOT NULL DEFAULT 0;
-- source_stats: [{source: string, count: number}] (dedup 이전 매체별 건수)
-- articles_raw: dedup 이전 전체 수집 건수
-- dedup_count = articles_raw - articles_collected (파생값, 별도 저장 불필요)
```

---

## Decision 2: `collectArticles` 반환 타입 확장

**Decision**: `collectArticles`가 `sourceStats`와 `articlesRaw`를 함께 반환

**Rationale**: 데이터는 `perSourceResults` 배열에서 이미 생산되므로 추가 연산 비용이 없다. 반환 타입 확장만으로 하류(index.ts → finishPipelineRun → DB)까지 전달 가능.

```typescript
// 현재
return { articles, errors }

// 변경 후
return { articles, errors, sourceStats, articlesRaw }
```

---

## Decision 3: 기존 테스트 보강 범위

**Decision**: `pipeline-collect.test.ts`에 sourceStats/articlesRaw 검증 케이스 추가

**Rationale**: 기존 2개 테스트는 핵심 흐름을 커버하지만 신규 반환 필드가 정확한지 검증하지 않는다. FR-007 구현 후 해당 필드값을 검증하는 케이스 추가 필요.

---

## 구현 범위 요약

| 범주 | 파일 | 변경 종류 |
|------|------|-----------|
| DB Migration | `supabase/migrations/YYYYMMDD_add_pipeline_source_stats.sql` | 신규 |
| DB 타입 | `src/types/database.types.ts` | 수동 업데이트 (source_stats, articles_raw 컬럼 추가) |
| 타입 정의 | `src/types/pipeline.ts` | `PipelineSourceStat` 타입 추가, `CollectResult` 확장 |
| 수집 로직 | `src/lib/pipeline/collect.ts` | sourceStats/articlesRaw 계산 + 반환 타입 확장 |
| 오케스트레이터 | `src/lib/pipeline/index.ts` | 새 필드를 finishPipelineRun에 전달 |
| 로그 저장 | `src/lib/pipeline/log.ts` | `finishPipelineRun` 파라미터 + UPDATE 쿼리 확장 |
| 단위 테스트 | `tests/unit/lib/pipeline-collect.test.ts` | sourceStats/articlesRaw 검증 케이스 추가 |
| 통합 테스트 | `tests/integration/pipeline-run.test.ts` | source_stats 저장 검증 (선택적) |
