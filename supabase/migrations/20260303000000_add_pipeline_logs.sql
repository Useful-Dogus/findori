CREATE TABLE pipeline_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'success', 'partial', 'failed')),
  triggered_by TEXT NOT NULL DEFAULT 'cron' CHECK (triggered_by IN ('cron', 'admin')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  articles_collected INT NOT NULL DEFAULT 0,
  issues_created INT NOT NULL DEFAULT 0,
  errors JSONB NOT NULL DEFAULT '[]'::jsonb
);

ALTER TABLE pipeline_logs ENABLE ROW LEVEL SECURITY;
