# Implementation Plan: DB 스키마 마이그레이션 구축

**Branch**: `004-db-schema-migration` | **Date**: 2026-02-27 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/004-db-schema-migration/spec.md`

## Summary

MVP 데이터 모델(feeds/issues/tags/issue_tags/media_sources) 5개 테이블을 Supabase PostgreSQL에 마이그레이션으로 구현한다. Supabase CLI 로컬 마이그레이션 방식을 채택하여 스키마 이력을 git으로 관리하고, 적용 후 TypeScript 타입을 재생성하여 빌드 정합성을 검증한다.

## Technical Context

**Language/Version**: TypeScript 5.4+ / Node.js 20+ (타입 재생성)
**Primary Dependencies**: Supabase CLI, `@supabase/supabase-js` ^2.0, `@supabase/ssr` ^0.5
**Storage**: Supabase PostgreSQL (프로젝트 ID: cwpfvqhgjtrzogwqepxp)
**Testing**: Vitest — 마이그레이션 자체는 SQL, TypeScript 타입 정합성은 `npm run validate`로 검증
**Target Platform**: Supabase Cloud (PostgreSQL 14+)
**Project Type**: Web service (Next.js 15 App Router)
**Performance Goals**: 피드 API p95 < 500ms (인덱스로 뒷받침)
**Constraints**: `display_order` 컬럼명 사용 (`order` 예약어 충돌 방지), RLS는 #6 이슈에서 별도 처리
**Scale/Scope**: 초기 사용자 수십 명, 일 최대 10 이슈, 30~70개 태그

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| 원칙 | 검토 결과 |
|------|----------|
| I. Code Quality | SQL 마이그레이션 파일에 명확한 주석, 제약 이름 명시 ✅ |
| II. Tests Define Correctness | 마이그레이션 SQL은 직접 테스트 불가 — `npm run validate` (TypeScript 타입 정합)로 간접 검증. 통합 테스트는 #5 이슈(카드 스키마 타입/검증 레이어)에서 추가 예정 ✅ |
| III. UX Consistency | 이 이슈는 UI 없음, 해당 없음 ✅ |
| IV. Performance | 주요 쿼리 패턴에 맞는 인덱스 정의 (research.md § 3) ✅ |
| V. Small & Reversible | 단일 마이그레이션 파일, `supabase db push` 멱등, 롤백은 역 DROP 마이그레이션으로 가능 ✅ |

**결론**: Constitution 위반 없음. 진행 가능.

## Project Structure

### Documentation (this feature)

```text
specs/004-db-schema-migration/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── checklists/
│   └── requirements.md  # Spec quality checklist
└── tasks.md             # Phase 2 output (/speckit.tasks — not yet)
```

### Source Code (repository root)

```text
supabase/
├── config.toml                              # supabase init 생성
└── migrations/
    └── 20260227000000_initial_schema.sql    # 5개 테이블 + 인덱스 + 제약

src/
└── types/
    └── database.types.ts                    # supabase gen types로 재생성 (기존 파일 덮어쓰기)
```

**Structure Decision**: Supabase CLI 표준 구조. 마이그레이션 파일 1개로 5개 테이블을 한 번에 생성. `src/types/database.types.ts`는 `npm run db:types` 스크립트로 자동 재생성.

## Implementation Steps

### Step 1: Supabase CLI 초기화

```bash
supabase init
supabase login
supabase link --project-ref cwpfvqhgjtrzogwqepxp
```

- `supabase/config.toml` 생성
- 원격 프로젝트 연결

### Step 2: 마이그레이션 파일 작성

`supabase/migrations/20260227000000_initial_schema.sql` 생성:

**feeds 테이블**:
```sql
CREATE TABLE IF NOT EXISTS feeds (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  date        date        UNIQUE NOT NULL,
  status      text        NOT NULL DEFAULT 'draft'
                          CONSTRAINT feeds_status_check
                          CHECK (status IN ('draft', 'published')),
  published_at timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_feeds_status ON feeds (status);
```

**issues 테이블**:
```sql
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

CREATE INDEX IF NOT EXISTS idx_issues_feed_id       ON issues (feed_id);
CREATE INDEX IF NOT EXISTS idx_issues_status        ON issues (status);
CREATE INDEX IF NOT EXISTS idx_issues_feed_order    ON issues (feed_id, display_order);
```

**tags 테이블**:
```sql
CREATE TABLE IF NOT EXISTS tags (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text        UNIQUE NOT NULL,
  created_by  text        NOT NULL
                          CONSTRAINT tags_created_by_check
                          CHECK (created_by IN ('ai', 'operator')),
  created_at  timestamptz NOT NULL DEFAULT now()
);
```

**issue_tags 테이블**:
```sql
CREATE TABLE IF NOT EXISTS issue_tags (
  issue_id  uuid NOT NULL REFERENCES issues (id) ON DELETE CASCADE,
  tag_id    uuid NOT NULL REFERENCES tags   (id) ON DELETE CASCADE,
  PRIMARY KEY (issue_id, tag_id)
);

CREATE INDEX IF NOT EXISTS idx_issue_tags_tag_id ON issue_tags (tag_id);
```

**media_sources 테이블**:
```sql
CREATE TABLE IF NOT EXISTS media_sources (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text        NOT NULL,
  rss_url     text        UNIQUE NOT NULL,
  active      boolean     NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now()
);
```

### Step 3: 마이그레이션 적용

```bash
supabase db push
```

### Step 4: TypeScript 타입 재생성

```bash
npm run db:types
```

`src/types/database.types.ts`가 5개 테이블을 포함하도록 갱신됨.

### Step 5: 품질 게이트 통과

```bash
npm run validate   # type-check + lint + format:check
npm run test       # Vitest
```

## Risks & Mitigations

| 위험 | 대응 |
|------|------|
| Supabase CLI 미설치 | README/quickstart.md에 설치 명령 명시 |
| `supabase db push` 권한 오류 | `SUPABASE_DB_PASSWORD` 또는 `supabase login` 세션 확인 |
| `db:types` 실행 후 기존 코드 타입 오류 | `database.types.ts`가 현재 빈 스캐폴드 → 의존하는 코드 없음, 위험 낮음 |
| `order` 컬럼명 사용 시 예약어 충돌 | `display_order`로 명명 (research.md § 5) |
