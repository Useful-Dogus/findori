# Data Model: 뉴스 수집 모듈 (012-news-collector)

## 기존 엔티티 (변경 없음)

### media_sources (기존 테이블)

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | uuid | PK |
| name | string | 매체명 |
| rss_url | string | RSS 피드 URL |
| active | boolean | 수집 활성 여부 |
| created_at | timestamptz | 생성 시각 |

**수집 모듈과의 관계**: `active=true`인 행만 수집 대상. 읽기 전용.

---

## 변경 엔티티

### pipeline_logs — 컬럼 추가

| 컬럼 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| source_stats | JSONB | `'[]'` | 매체별 수집 건수 (dedup 이전) |
| articles_raw | INT | `0` | 전체 수집 건수 (dedup 이전) |

**기존 컬럼 유지:**
| 컬럼 | 타입 | 설명 |
|------|------|------|
| articles_collected | INT | dedup 이후 총 수집 건수 |
| errors | JSONB | 매체 실패 목록 `[{source, message}]` |

**`source_stats` JSONB 구조:**
```json
[
  { "source": "한국경제", "count": 12 },
  { "source": "연합뉴스",  "count": 8 },
  { "source": "이데일리",  "count": 0 }
]
```
- dedup 이전 기준이므로 `source_stats[*].count` 합계 = `articles_raw`
- 실패한 매체는 `source_stats`에 포함되지 않고 `errors`에만 기록
- 당일 기사 0건 수집된 매체는 count=0으로 포함

**파생 계산:**
```
dedup_count = articles_raw - articles_collected
```
별도 컬럼 없이 런타임에서 계산 가능.

---

## 타입 시스템 변경

### 신규 타입 — `PipelineSourceStat`

```typescript
// src/types/pipeline.ts
export type PipelineSourceStat = {
  source: string   // 매체명 (media_sources.name)
  count: number    // 해당 매체에서 수집된 기사 수 (dedup 이전, 당일 필터 이후)
}
```

### 변경 타입 — `CollectResult` (반환 타입 확장)

`collectArticles` 함수 반환 타입:

| 필드 | 타입 | 설명 |
|------|------|------|
| articles | `CollectedArticle[]` | dedup 이후 최종 기사 목록 |
| errors | `PipelineError[]` | 매체별 fetch/parse 실패 목록 |
| sourceStats | `PipelineSourceStat[]` | 매체별 수집 건수 (dedup 이전) |
| articlesRaw | `number` | 전체 수집 건수 (dedup 이전) |

### 변경 타입 — `PipelineExecutionSummary`

```typescript
// 기존 필드 유지 + 추가
articles_raw: number          // dedup 이전 수집 건수
source_stats: PipelineSourceStat[]  // 매체별 건수
```

---

## DB Migration

**파일**: `supabase/migrations/YYYYMMDDHHMMSS_add_pipeline_source_stats.sql`

```sql
ALTER TABLE pipeline_logs
  ADD COLUMN source_stats JSONB NOT NULL DEFAULT '[]',
  ADD COLUMN articles_raw  INT  NOT NULL DEFAULT 0;

COMMENT ON COLUMN pipeline_logs.source_stats IS
  '매체별 수집 건수 (dedup 이전). [{source: string, count: number}]';
COMMENT ON COLUMN pipeline_logs.articles_raw IS
  'dedup 이전 전체 수집 기사 수. dedup_count = articles_raw - articles_collected';
```

---

## 상태 전이 (변경 없음)

`collectArticles` 실행 흐름은 기존과 동일하며, 반환 구조만 확장:

```
media_sources (active=true) 조회
  → 각 매체 RSS fetch (병렬)
      성공 → 당일 필터 → buildArticle
      실패 → errors 배열에 추가, skip
  → perSourceResults 집계
      → sourceStats 계산 (매체별 count)
      → articlesRaw 계산 (flat().length)
      → URL dedup → articles
  → 반환: { articles, errors, sourceStats, articlesRaw }
```
