-- ============================================================
-- RLS 활성화 및 공개 읽기 정책 설정
-- Date: 2026-03-26
-- Tables: feeds, issues, tags, issue_tags, media_sources
-- Notes:
--   - Admin/Pipeline은 service_role 클라이언트를 사용하므로 RLS 우회
--   - 공개 API(anon)는 published/approved 데이터만 읽을 수 있음
--   - media_sources는 공개 접근 불필요 → 정책 없이 RLS만 활성화
-- ============================================================

-- ── RLS 활성화 ──────────────────────────────────────────────────────────────

ALTER TABLE feeds         ENABLE ROW LEVEL SECURITY;
ALTER TABLE issues        ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags          ENABLE ROW LEVEL SECURITY;
ALTER TABLE issue_tags    ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_sources ENABLE ROW LEVEL SECURITY;

-- ── feeds: published 피드만 공개 읽기 ────────────────────────────────────────

CREATE POLICY "feeds_public_read"
  ON feeds
  FOR SELECT
  TO anon
  USING (status = 'published');

-- ── issues: approved 이슈만 공개 읽기 ────────────────────────────────────────

CREATE POLICY "issues_public_read"
  ON issues
  FOR SELECT
  TO anon
  USING (status = 'approved');

-- ── tags: 전체 공개 읽기 ──────────────────────────────────────────────────────

CREATE POLICY "tags_public_read"
  ON tags
  FOR SELECT
  TO anon
  USING (true);

-- ── issue_tags: 전체 공개 읽기 ────────────────────────────────────────────────

CREATE POLICY "issue_tags_public_read"
  ON issue_tags
  FOR SELECT
  TO anon
  USING (true);

-- media_sources: 정책 없음 → anon 접근 차단 (admin only via service_role)
