# Data Model: DB 스키마 마이그레이션 구축

**Feature**: 004-db-schema-migration
**Date**: 2026-02-27
**Source**: SRS § 4.3 + research.md

---

## Entity Relationship Overview

```
media_sources          feeds
(독립 엔티티)         ─────────────────────────
                      id (PK)
                      date (UNIQUE)
                      status
                      published_at
                           │
                           │ 1:N (CASCADE DELETE)
                           ▼
                         issues
                      ─────────────────────────
                      id (PK)
                      feed_id (FK → feeds)
                      channel
                      entity_type
                      entity_id
                      entity_name
                      title
                      change_value
                      status
                      display_order
                      cards_data (JSONB)
                      created_at
                           │
                           │ N:M (issue_tags)
                           ▼
                          tags
                      ─────────────────────────
                      id (PK)
                      name (UNIQUE)
                      created_by
                      created_at
```

---

## Table Specifications

### `feeds`

일별 발행 피드. 하루에 하나만 존재한다.

| 컬럼 | 타입 | 제약 | 기본값 | 설명 |
|------|------|------|--------|------|
| `id` | `uuid` | PK | `gen_random_uuid()` | 피드 식별자 |
| `date` | `date` | UNIQUE, NOT NULL | — | 발행 날짜 |
| `status` | `text` | CHECK(`draft`\|`published`), NOT NULL | `'draft'` | 피드 상태 |
| `published_at` | `timestamptz` | NULLABLE | — | 발행 전환 시각 |
| `created_at` | `timestamptz` | NOT NULL | `now()` | 생성 시각 |

**Indexes**: `date` (UNIQUE 자동)

**State Transitions**:
```
draft → published (published_at 기록)
```

---

### `issues`

피드에 속한 개별 이슈 카드 세트. AI가 생성한 카드 JSON을 보유한다.

| 컬럼 | 타입 | 제약 | 기본값 | 설명 |
|------|------|------|--------|------|
| `id` | `uuid` | PK | `gen_random_uuid()` | 이슈 식별자 |
| `feed_id` | `uuid` | FK → `feeds.id`, CASCADE DELETE, NOT NULL | — | 소속 피드 |
| `channel` | `text` | NOT NULL | `'v1'` | 카드 스키마 식별자 (MVP 고정값) |
| `entity_type` | `text` | CHECK(`stock`\|`index`\|`fx`\|`theme`), NOT NULL | — | 이슈 엔티티 유형 |
| `entity_id` | `text` | NOT NULL | — | 종목코드, 지수명 등 |
| `entity_name` | `text` | NOT NULL | — | 표시용 엔티티 이름 |
| `title` | `text` | NOT NULL | — | 이슈 제목 (OG 이미지용) |
| `change_value` | `text` | NULLABLE | — | 변동폭 표시 (예: "+6.9%") |
| `status` | `text` | CHECK(`draft`\|`approved`\|`rejected`), NOT NULL | `'draft'` | 이슈 상태 |
| `display_order` | `int` | NOT NULL | `0` | 피드 내 노출 순서 |
| `cards_data` | `jsonb` | NULLABLE | `'[]'::jsonb` | cards[] 배열 JSON |
| `created_at` | `timestamptz` | NOT NULL | `now()` | 생성 시각 |

**Indexes**:
- `feed_id` (FK 조인)
- `status` (Admin 검토 목록 필터)
- `(feed_id, display_order)` (피드별 정렬 조회)

**State Transitions**:
```
draft → approved (Admin 승인)
draft → rejected (Admin 반려)
```

**Notes**:
- `order` 예약어 충돌 방지로 `display_order` 사용
- `cards_data` null 허용: 파이프라인 실패 시 빈 채 draft 저장 가능

---

### `tags`

이슈 분류 태그. AI 자동 생성 또는 운영자 수동 생성.

| 컬럼 | 타입 | 제약 | 기본값 | 설명 |
|------|------|------|--------|------|
| `id` | `uuid` | PK | `gen_random_uuid()` | 태그 식별자 |
| `name` | `text` | UNIQUE, NOT NULL | — | 태그 이름 |
| `created_by` | `text` | CHECK(`ai`\|`operator`), NOT NULL | — | 생성 주체 |
| `created_at` | `timestamptz` | NOT NULL | `now()` | 생성 시각 |

**Indexes**: `name` (UNIQUE 자동)

---

### `issue_tags`

`issues`와 `tags`의 다대다 연결 테이블.

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| `issue_id` | `uuid` | PK 일부, FK → `issues.id`, CASCADE DELETE, NOT NULL | 이슈 참조 |
| `tag_id` | `uuid` | PK 일부, FK → `tags.id`, CASCADE DELETE, NOT NULL | 태그 참조 |

**Primary Key**: `(issue_id, tag_id)` 복합 PK (중복 연결 방지)

**Indexes**:
- `(issue_id, tag_id)` (PK 자동)
- `tag_id` (태그 → 이슈 역방향 조회)

---

### `media_sources`

뉴스 수집 대상 화이트리스트 매체.

| 컬럼 | 타입 | 제약 | 기본값 | 설명 |
|------|------|------|--------|------|
| `id` | `uuid` | PK | `gen_random_uuid()` | 매체 식별자 |
| `name` | `text` | NOT NULL | — | 매체 이름 |
| `rss_url` | `text` | UNIQUE, NOT NULL | — | RSS 피드 URL |
| `active` | `boolean` | NOT NULL | `true` | 수집 활성 여부 |
| `created_at` | `timestamptz` | NOT NULL | `now()` | 생성 시각 |

**Indexes**: `rss_url` (UNIQUE 자동)

---

## Migration File Structure

```text
supabase/
├── config.toml                    # supabase init 생성
└── migrations/
    └── 20260227000000_initial_schema.sql   # 5개 테이블 + 인덱스
```

---

## Validation Rules Summary

| 테이블 | 필드 | 허용 값 |
|--------|------|---------|
| `feeds` | `status` | `'draft'`, `'published'` |
| `issues` | `status` | `'draft'`, `'approved'`, `'rejected'` |
| `issues` | `entity_type` | `'stock'`, `'index'`, `'fx'`, `'theme'` |
| `tags` | `created_by` | `'ai'`, `'operator'` |

---

## Cascade Rules

| 부모 삭제 | 영향 받는 테이블 | 동작 |
|-----------|-----------------|------|
| `feeds` 행 삭제 | `issues` | CASCADE DELETE |
| `issues` 행 삭제 | `issue_tags` | CASCADE DELETE |
| `tags` 행 삭제 | `issue_tags` | CASCADE DELETE |
