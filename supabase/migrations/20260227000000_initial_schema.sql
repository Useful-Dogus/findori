-- ============================================================
-- findori MVP: 초기 스키마 마이그레이션
-- Feature: 004-db-schema-migration
-- Date: 2026-02-27
-- Tables: feeds, issues, tags, issue_tags, media_sources
-- Notes:
--   - display_order: PostgreSQL 예약어 'order' 충돌 방지로 명명
--   - RLS: Admin 인증 이슈 #6에서 별도 처리
--   - 모든 DDL에 IF NOT EXISTS → 멱등 실행 보장
-- ============================================================

-- ============================================================
-- [US1] 파이프라인이 데이터를 저장할 수 있다
-- Tables: feeds, issues
-- ============================================================

-- 일별 발행 피드. 하루 1개. status: draft → published.
CREATE TABLE IF NOT EXISTS feeds (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  date         date        UNIQUE NOT NULL,
  status       text        NOT NULL DEFAULT 'draft'
                           CONSTRAINT feeds_status_check
                           CHECK (status IN ('draft', 'published')),
  published_at timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_feeds_status ON feeds (status);

-- 피드에 속하는 개별 이슈 카드 세트.
-- cards_data: Claude API가 생성한 cards[] JSON (SRS § 4.2 스키마 고정).
-- display_order: 피드 내 노출 순서 (예약어 'order' 대신 사용).
-- channel: 카드 스키마 식별자, MVP 기본값 'v1'.
-- entity_type: stock(종목) | index(지수) | fx(환율) | theme(테마).
-- status: draft → approved(발행) | rejected(반려).
CREATE TABLE IF NOT EXISTS issues (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  feed_id       uuid        NOT NULL
                            REFERENCES feeds (id) ON DELETE CASCADE,
  channel       text        NOT NULL DEFAULT 'v1',
  entity_type   text        NOT NULL
                            CONSTRAINT issues_entity_type_check
                            CHECK (entity_type IN ('stock', 'index', 'fx', 'theme')),
  entity_id     text        NOT NULL,
  entity_name   text        NOT NULL,
  title         text        NOT NULL,
  change_value  text,
  status        text        NOT NULL DEFAULT 'draft'
                            CONSTRAINT issues_status_check
                            CHECK (status IN ('draft', 'approved', 'rejected')),
  display_order int         NOT NULL DEFAULT 0,
  cards_data    jsonb       DEFAULT '[]'::jsonb,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_issues_feed_id    ON issues (feed_id);
CREATE INDEX IF NOT EXISTS idx_issues_status     ON issues (status);
CREATE INDEX IF NOT EXISTS idx_issues_feed_order ON issues (feed_id, display_order);

-- ============================================================
-- [US3] 이슈에 태그를 붙이고 조회할 수 있다
-- Tables: tags, issue_tags
-- ============================================================

-- 이슈 분류 태그. AI 자동 또는 운영자 수동 생성.
CREATE TABLE IF NOT EXISTS tags (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text        UNIQUE NOT NULL,
  created_by text        NOT NULL
                         CONSTRAINT tags_created_by_check
                         CHECK (created_by IN ('ai', 'operator')),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- issues ↔ tags 다대다 연결. CASCADE DELETE 양방향.
CREATE TABLE IF NOT EXISTS issue_tags (
  issue_id uuid NOT NULL REFERENCES issues (id) ON DELETE CASCADE,
  tag_id   uuid NOT NULL REFERENCES tags   (id) ON DELETE CASCADE,
  PRIMARY KEY (issue_id, tag_id)
);

CREATE INDEX IF NOT EXISTS idx_issue_tags_tag_id ON issue_tags (tag_id);

-- ============================================================
-- [US4] 화이트리스트 매체를 등록하고 관리할 수 있다
-- Table: media_sources
-- ============================================================

-- 뉴스 수집 대상 화이트리스트 매체.
-- active=true인 매체만 파이프라인 수집 대상.
-- rss_url: UNIQUE → 동일 매체 중복 등록 방지.
CREATE TABLE IF NOT EXISTS media_sources (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text        NOT NULL,
  rss_url    text        UNIQUE NOT NULL,
  active     boolean     NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
