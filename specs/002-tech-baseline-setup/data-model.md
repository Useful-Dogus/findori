# Data Model: 프로젝트 기술 베이스라인 셋업

**Branch**: `002-tech-baseline-setup` | **Date**: 2026-02-27
**Source**: `docs/mvp/srs.md § 4.3`

---

## 엔티티 정의

이 기술 베이스라인에서 정의하고 검증할 DB 스키마 엔티티다.
상세 마이그레이션 SQL은 이슈 #4(DB 스키마 마이그레이션)에서 다룬다.
여기서는 베이스라인 설정 중 타입 시스템 연동에 필요한 구조를 문서화한다.

---

### Feed

피드는 하루치 이슈 카드 스트림의 단위다.

| 필드 | 타입 | 제약 | 설명 |
|------|------|------|------|
| `id` | uuid | PK, default gen_random_uuid() | 고유 식별자 |
| `date` | date | UNIQUE, NOT NULL | 발행 날짜 (YYYY-MM-DD) |
| `status` | `'draft' \| 'published'` | NOT NULL, default 'draft' | 피드 상태 |
| `published_at` | timestamptz | nullable | 발행 시각 |

**상태 전이**: `draft` → `published` (Admin 발행 액션)

---

### Issue

개별 이슈 카드. 한 피드는 여러 이슈를 포함한다.

| 필드 | 타입 | 제약 | 설명 |
|------|------|------|------|
| `id` | uuid | PK, default gen_random_uuid() | 고유 식별자 |
| `feed_id` | uuid | FK → feeds.id, NOT NULL | 소속 피드 |
| `channel` | string | NOT NULL, default 'v1' | 카드 스키마 식별자 (MVP: 'v1' 고정) |
| `entity_type` | `'stock' \| 'index' \| 'fx' \| 'theme'` | NOT NULL | 이슈 대상 유형 |
| `entity_id` | string | NOT NULL | 종목코드, 지수명 등 |
| `entity_name` | string | NOT NULL | 표시명 (예: '삼성전자') |
| `title` | string | NOT NULL | Claude 생성 이슈 제목 (OG 이미지, 피드 목록용) |
| `change_value` | string | nullable | 변동 수치 문자열 (예: '+6.9%') |
| `status` | `'draft' \| 'approved' \| 'rejected'` | NOT NULL, default 'draft' | Admin 검토 상태 |
| `order` | integer | NOT NULL | 피드 내 노출 순서 |
| `cards_data` | jsonb | NOT NULL | Claude 생성 cards[] 배열 |
| `created_at` | timestamptz | NOT NULL, default now() | 생성 시각 |

**상태 전이**: `draft` → `approved` | `rejected`

**cards_data 구조**: `docs/mvp/srs.md § 4.2` 참조. 카드 타입: `cover`, `reason`, `bullish`, `bearish`, `community`, `stats`, `source`. 카드 수 3~7장, 첫 장은 반드시 `cover`, 마지막은 반드시 `source`.

---

### Tag

이슈에 붙는 카테고리 태그.

| 필드 | 타입 | 제약 | 설명 |
|------|------|------|------|
| `id` | uuid | PK | 고유 식별자 |
| `name` | string | UNIQUE, NOT NULL | 태그명 (예: '반도체', '외국인') |
| `created_by` | `'ai' \| 'operator'` | NOT NULL | 생성 주체 |

---

### IssueTag

Issue ↔ Tag 다대다 조인 테이블.

| 필드 | 타입 | 제약 |
|------|------|------|
| `issue_id` | uuid | FK → issues.id |
| `tag_id` | uuid | FK → tags.id |

**복합 PK**: (issue_id, tag_id)

---

### MediaSource

뉴스 수집 대상 화이트리스트 매체.

| 필드 | 타입 | 제약 | 설명 |
|------|------|------|------|
| `id` | uuid | PK | 고유 식별자 |
| `name` | string | NOT NULL | 매체 표시명 |
| `rss_url` | string | NOT NULL | RSS 또는 사이트맵 URL |
| `active` | boolean | NOT NULL, default true | 수집 활성 여부 |

---

## TypeScript 타입 전략

### 생성 방법

```bash
supabase gen types typescript --project-id <PROJECT_REF> > src/types/database.types.ts
```

### 카드 스키마 수동 타입 정의

`cards_data` JSONB는 자동 생성 타입에서 `Json`으로 표현된다.
`src/types/cards.ts`에 cards[] 스키마를 수동으로 정의하여 런타임 검증과 함께 사용한다.

```typescript
// src/types/cards.ts

type CardVisual = {
  bg_from: string  // hex only, e.g., "#0f172a"
  bg_via: string
  bg_to: string
  accent: string
}

type CardSource = {
  title: string
  url: string
  domain: string
}

type CoverCard = {
  id: number
  type: 'cover'
  tag: string
  title: string
  sub: string
  visual: CardVisual
}

type ReasonCard = {
  id: number
  type: 'reason'
  tag: string
  title: string
  body: string
  stat?: string
  visual: CardVisual
  sources: CardSource[]
}

type BullishCard = {
  id: number
  type: 'bullish'
  tag: string
  title: string
  body: string
  stat?: string
  visual: CardVisual
  sources: CardSource[]
}

type BearishCard = {
  id: number
  type: 'bearish'
  tag: string
  title: string
  body: string
  stat?: string
  visual: CardVisual
  sources: CardSource[]
}

type CommunityQuote = {
  text: string
  mood: string
}

type CommunityCard = {
  id: number
  type: 'community'
  tag: string
  title: string
  quotes: CommunityQuote[]
  visual: CardVisual
}

type StatsItem = {
  label: string
  value: string
  change?: string
}

type StatsCard = {
  id: number
  type: 'stats'
  tag: string
  title: string
  items: StatsItem[]
  visual: CardVisual
}

type SourceCard = {
  id: number
  type: 'source'
  tag: string
  sources: CardSource[]
  visual: CardVisual
}

export type Card =
  | CoverCard
  | ReasonCard
  | BullishCard
  | BearishCard
  | CommunityCard
  | StatsCard
  | SourceCard
```

---

## 검증 규칙

| 규칙 | 적용 위치 |
|------|-----------|
| `visual.bg_*`는 유효한 hex 값 (`#` + 6자리) | TypeScript 타입 + zod 런타임 검증 |
| 카드 수 3~7장 | 파이프라인 생성 단계 + Admin 저장 단계 |
| 첫 장 `cover`, 마지막 장 `source` | 파이프라인 생성 단계 + Admin 저장 단계 |
| `sources` 필드: 변동 이유 카드에 최소 1개 | 파이프라인 생성 단계 |

---

## 관계도

```
feeds (1) ──── (N) issues
                      │
                      ├── (N) ── (M) tags
                      │         (via issue_tags)
                      └── cards_data: Card[]

media_sources (독립 엔티티, 파이프라인이 읽음)
```
