-- pipeline_logs 테이블에 매체별 수집 통계 컬럼 추가
-- source_stats: 매체별 수집 건수 (dedup 이전). [{source: string, count: number}]
-- articles_raw: dedup 이전 전체 수집 기사 수. dedup_count = articles_raw - articles_collected

ALTER TABLE pipeline_logs
  ADD COLUMN source_stats JSONB NOT NULL DEFAULT '[]',
  ADD COLUMN articles_raw  INT  NOT NULL DEFAULT 0;

COMMENT ON COLUMN pipeline_logs.source_stats IS
  '매체별 수집 건수 (dedup 이전). [{source: string, count: number}] 형식. 실패 매체는 제외되고 errors 컬럼에 기록.';

COMMENT ON COLUMN pipeline_logs.articles_raw IS
  'dedup 이전 전체 수집 기사 수. dedup_count = articles_raw - articles_collected 로 계산 가능.';
