# Contract: collectArticles 함수

## 위치

`src/lib/pipeline/collect.ts`

## 인터페이스

```typescript
collectArticles(
  client: SupabaseClient<Database>,
  targetDate: string,         // 'YYYY-MM-DD' (KST 기준)
  deps?: { parser?: ParserLike }
): Promise<{
  articles:    CollectedArticle[]      // dedup 이후 최종 기사 목록
  errors:      PipelineError[]         // 매체별 fetch/parse 실패 목록
  sourceStats: PipelineSourceStat[]    // 매체별 수집 건수 (dedup 이전, 당일 필터 이후)
  articlesRaw: number                  // dedup 이전 전체 수집 건수
}>
```

## 계약

### 성공 조건
- active 매체가 0개이면 `{ articles: [], errors: [], sourceStats: [], articlesRaw: 0 }` 반환
- 일부 매체 실패: 성공한 매체 결과만 포함, 실패 매체는 `errors`에 기록
- 전체 매체 실패: `articles: []`, `articlesRaw: 0`, `errors: [...]` 반환

### sourceStats 계약
- 성공적으로 RSS를 파싱한 매체만 포함 (실패 매체 제외)
- `count`는 당일 필터 이후, dedup 이전 건수
- 당일 기사 0건인 매체도 `{ source: "매체명", count: 0 }`으로 포함
- `SUM(sourceStats[*].count) === articlesRaw`

### dedup 계약
- URL exact-match (trim 정규화 적용)
- 동일 URL이 여러 매체에 존재할 때 최초 등장 기사를 보존
- dedup 건수 = `articlesRaw - articles.length`

### 오류 전파 계약
- 개별 매체 fetch 실패는 `errors` 배열에 추가, 전파하지 않음
- `media_sources` DB 조회 실패는 예외를 throw (전체 파이프라인 중단)

## 호출 측 (pipeline/index.ts)

```typescript
const collected = await collectArticles(client, date)
// 이후 finishPipelineRun 시 전달:
// articlesCollected: collected.articles.length   (dedup 이후)
// articles_raw:      collected.articlesRaw        (dedup 이전)
// source_stats:      collected.sourceStats
// errors:            [...collected.errors, ...generated.errors]
```
