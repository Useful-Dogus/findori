-- pipeline_logs 테이블에 토큰 사용량 및 비용 추산 컬럼 추가
-- tokens_input: Haiku + Sonnet 입력 토큰 합계
-- tokens_output: Haiku + Sonnet 출력 토큰 합계
-- estimated_cost_usd: 추산 비용 (USD). Haiku $0.80/$4.00 + Sonnet $3.00/$15.00 per MTok 기준

ALTER TABLE pipeline_logs
  ADD COLUMN tokens_input        INTEGER,
  ADD COLUMN tokens_output       INTEGER,
  ADD COLUMN estimated_cost_usd  NUMERIC(10, 6);

COMMENT ON COLUMN pipeline_logs.tokens_input IS
  'Haiku 필터 + Sonnet 카드 생성 입력 토큰 합계. AI 호출 없이 종료된 경우 NULL.';

COMMENT ON COLUMN pipeline_logs.tokens_output IS
  'Haiku 필터 + Sonnet 카드 생성 출력 토큰 합계. AI 호출 없이 종료된 경우 NULL.';

COMMENT ON COLUMN pipeline_logs.estimated_cost_usd IS
  '추산 비용 (USD). Haiku $0.80/$4.00 + Sonnet $3.00/$15.00 per MTok 기준. AI 호출 없이 종료된 경우 NULL.';
