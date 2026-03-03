# Data Model: Cron 파이프라인 엔드포인트

**Branch**: `011-cron-pipeline` | **Date**: 2026-03-03

---

## 기존 테이블 (수정 없음)

### `feeds`
일별 피드 컨테이너. 파이프라인이 당일 피드를 생성하거나 기존 것을 조회한다.

| 필드 | 타입 | 제약 | 설명 |
|------|------|------|------|
| `id` | UUID | PK | 자동 생성 |
| `date` | TEXT | NOT NULL, UNIQUE | `YYYY-MM-DD` 형식 (KST 기준) |
| `status` | TEXT | NOT NULL, DEFAULT `'draft'` | `draft` / `published` |
| `published_at` | TIMESTAMPTZ | NULL | 발행 시각 |
| `created_at` | TIMESTAMPTZ | NOT NULL | 생성 시각 |

**파이프라인 동작**: 오늘 날짜 feed가 없으면 INSERT, 있으면 재사용 (upsert).

---

### `issues`
파이프라인이 생성한 이슈 카드 단위. 각 issue는 하나의 entity(종목/지수/환율/테마)를 다룬다.

| 필드 | 타입 | 제약 | 설명 |
|------|------|------|------|
| `id` | UUID | PK | 자동 생성 |
| `feed_id` | UUID | FK → feeds.id | 소속 피드 |
| `entity_id` | TEXT | NOT NULL | 엔티티 식별자 (예: `"005930"`, `"KOSPI"`) |
| `entity_name` | TEXT | NOT NULL | 표시 이름 (예: `"삼성전자"`, `"코스피"`) |
| `entity_type` | TEXT | NOT NULL | `stock` / `index` / `currency` / `theme` |
| `title` | TEXT | NOT NULL | 이슈 제목 |
| `channel` | TEXT | NOT NULL, DEFAULT `'default'` | 채널 식별자 |
| `status` | TEXT | NOT NULL, DEFAULT `'draft'` | `draft` / `approved` / `rejected` / `published` |
| `cards_data` | JSONB | NULL | cards[] JSON (Zod 스키마 준수) |
| `display_order` | INT | NOT NULL, DEFAULT `0` | 피드 내 표시 순서 |
| `change_value` | TEXT | NULL | 변동값 요약 (예: `"+6.9%"`) |
| `created_at` | TIMESTAMPTZ | NOT NULL | 생성 시각 |

**파이프라인 동작**: 생성 시 `status='draft'`, `cards_data`에 Claude 생성 데이터 저장.

**cards_data 구조** (SRS § 4.2 기준):
- 배열 길이: 3~7장
- 첫 카드: `type='cover'` 필수
- 마지막 카드: `type='source'` 필수
- 허용 타입: `cover | reason | bullish | bearish | community | stats | source`

---

### `media_sources`
파이프라인이 기사를 수집할 등록된 매체 목록.

| 필드 | 타입 | 제약 | 설명 |
|------|------|------|------|
| `id` | UUID | PK | 자동 생성 |
| `name` | TEXT | NOT NULL | 매체명 |
| `rss_url` | TEXT | NOT NULL | RSS 피드 URL |
| `active` | BOOLEAN | NOT NULL, DEFAULT `true` | 파이프라인 포함 여부 |
| `created_at` | TIMESTAMPTZ | NOT NULL | 등록 시각 |

**파이프라인 동작**: `active=true`인 모든 매체를 대상으로 RSS 수집.

---

## 신규 테이블

### `pipeline_logs`
파이프라인 실행 이력 및 상태 추적. 중복 실행 방지와 운영 모니터링에 사용.

| 필드 | 타입 | 제약 | 설명 |
|------|------|------|------|
| `id` | UUID | PK | 자동 생성 |
| `date` | TEXT | NOT NULL | 처리 대상 날짜 (`YYYY-MM-DD`, KST 기준) |
| `status` | TEXT | NOT NULL, DEFAULT `'running'` | `running` / `success` / `partial` / `failed` |
| `triggered_by` | TEXT | NOT NULL, DEFAULT `'cron'` | `cron` / `admin` |
| `started_at` | TIMESTAMPTZ | NOT NULL, DEFAULT `now()` | 시작 시각 |
| `completed_at` | TIMESTAMPTZ | NULL | 완료 시각 (실행 중에는 NULL) |
| `articles_collected` | INT | NOT NULL, DEFAULT `0` | 수집된 기사 수 |
| `issues_created` | INT | NOT NULL, DEFAULT `0` | 생성된 이슈 수 |
| `errors` | JSONB | NOT NULL, DEFAULT `'[]'` | 오류 목록 (`[{source, message}]`) |

**상태 전이**:
```
INSERT (running)
  → 완료 성공: UPDATE status='success'
  → 부분 성공(오류 1건 이상): UPDATE status='partial'
  → 전체 실패: UPDATE status='failed'
  → 타임아웃 미완료(>360초): 다음 실행 시 'running' 상태 무시 처리
```

**중복 실행 방지 조건**:
- `status='running'` AND `date=오늘` AND `started_at > now() - interval '360 seconds'`
- 위 조건에 해당하는 레코드 존재 시 새 실행 거부 (409 응답)

**SQL Migration**:
```sql
-- supabase/migrations/20260303000000_add_pipeline_logs.sql

CREATE TABLE pipeline_logs (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  date         TEXT        NOT NULL,
  status       TEXT        NOT NULL DEFAULT 'running'
                           CHECK (status IN ('running', 'success', 'partial', 'failed')),
  triggered_by TEXT        NOT NULL DEFAULT 'cron'
                           CHECK (triggered_by IN ('cron', 'admin')),
  started_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  articles_collected INT   NOT NULL DEFAULT 0,
  issues_created     INT   NOT NULL DEFAULT 0,
  errors       JSONB       NOT NULL DEFAULT '[]'::jsonb
);

-- RLS: pipeline_logs는 서버 전용 (Service Role만 접근 가능)
ALTER TABLE pipeline_logs ENABLE ROW LEVEL SECURITY;
-- 공개 정책 없음 → Service Role 클라이언트만 접근
```

---

## 상태 전이 다이어그램

### 이슈(Issue) 상태

```
[파이프라인 생성]
      │
      ▼
   draft ──────► rejected
      │
      ▼
  approved
      │
      ▼
 published
```

### 파이프라인 로그 상태

```
[실행 시작]
      │
      ▼
  running ──────► success
      │
      ├──────────► partial (일부 실패)
      │
      └──────────► failed (전체 실패)
```

---

## 데이터 흐름 요약

```
파이프라인 실행 시:

1. pipeline_logs INSERT (status='running')
2. feeds UPSERT (오늘 날짜, status='draft')
3. media_sources SELECT (active=true)
4. [각 매체 RSS 수집]
5. issues INSERT (status='draft', cards_data=JSON)
6. pipeline_logs UPDATE (status='success'/'partial'/'failed', counts, errors)
```
