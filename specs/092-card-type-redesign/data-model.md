# Data Model: 카드뉴스 품질 개선 Phase 2

**Branch**: `092-card-type-redesign` | **Date**: 2026-03-26

---

## 1. 신규 카드 타입 정의

기존 `CardVisual` (bg_from, bg_via, bg_to, accent)은 모든 카드 타입에서 그대로 유지.

### 1-1. DeltaCard (변화량 강조)

```typescript
type DeltaCard = {
  id: number
  type: 'delta'
  tag: string
  before: string        // "1,280원"
  after: string         // "1,500원"
  period: string        // "2년 만에"
  context: string       // 1문장 해석 (80자 이내)
  visual: CardVisual
}
```

**제약**: `before`, `after`, `period`, `context` 모두 필수. context는 80자 이내.

---

### 1-2. DeltaIntroCard (낯선 주체 소개 + 변화량)

```typescript
type DeltaIntroCard = {
  id: number
  type: 'delta-intro'
  tag: string
  before: string        // "시가" 등 기준값
  after: string         // 변화 후 값
  period: string        // "3월 25일 단 하루"
  what: string          // 주체 이름 (예: "ARM Holdings")
  whatDesc: string      // 주체 설명 (2문장 이내)
  trigger: string       // 왜 지금 주목받는가 (1문장)
  visual: CardVisual
}
```

**사용 시점**: 독자에게 생소한 기업/지표가 이슈의 주인공일 때 첫 번째 카드로 사용.

---

### 1-3. CauseCard (결과 → 원인)

```typescript
type CauseCard = {
  id: number
  type: 'cause'
  tag: string
  result: string        // 결과 (짧게, 강조 표시됨, 30자 이내)
  cause: string         // 원인 설명 (3줄 이내, 120자 이내)
  sources: CardSource[]  // 최소 1개
  visual: CardVisual
}
```

**제약**: `result`는 임팩트 있는 한 줄. `cause`는 result 이후에 "왜?" 를 설명.

---

### 1-4. StatCard (단일 통계 강조)

```typescript
type StatCard = {
  id: number
  type: 'stat'
  tag: string
  number: string        // "771조원"
  label: string         // "국민연금 해외 투자 규모"
  reveal: string        // 상식을 뒤집는 해석 (2줄, 80자 이내)
  sources: CardSource[]  // 최소 1개
  visual: CardVisual
}
```

**제약**: `number`는 수치만 (단위 포함). `reveal`은 "이게 왜 놀라운가"를 설명.

---

### 1-5. CompareCard (비교 테이블)

```typescript
type CompareRow = {
  label: string         // "유로 🇪🇺"
  change: string        // "+10%"
  dir: 'up' | 'down' | 'worst'  // 방향
  note: string          // "달러 대비 강세"
}

type CompareCard = {
  id: number
  type: 'compare'
  tag: string
  q: string             // 비교 질문 (예: "같은 기간, 다른 나라 돈은?")
  rows: CompareRow[]    // 최소 2개
  footer: string        // 결론 또는 맥락 문장
  visual: CardVisual
}
```

**제약**: `rows` 최소 2개. `dir: 'worst'`는 이슈의 주인공(가장 나쁜 결과)에 사용.

---

### 1-6. ImpactCard (독자 생활 영향)

```typescript
type ImpactItem = {
  label: string         // "해외직구 100달러 상품"
  before: string        // "128,000원" (이전 금액)
  after: string         // "150,000원" (현재 금액)
  diff: string          // "+22,000원" 또는 "위험" / "주의"
}

type ImpactCard = {
  id: number
  type: 'impact'
  tag: string
  items: ImpactItem[]   // 2-4개 항목
  visual: CardVisual
}
```

**사용 시점**: 환율, 물가, 금리 등 독자 실생활 비용에 직접 영향을 주는 이슈.

---

### 1-7. VerdictCard (한 문장 결론)

```typescript
type VerdictCard = {
  id: number
  type: 'verdict'
  tag: string
  verdict: string       // 결론 한 문장 (50자 이내)
  reasons: string[]     // 근거 2-3개 (각 60자 이내)
  visual: CardVisual
}
```

**제약**: `source` 카드 바로 앞에 위치해야 함. `reasons`는 최소 2개, 최대 3개.

---

### 1-8. QuestionCard (다음 카드 연결 훅)

```typescript
type QuestionCard = {
  id: number
  type: 'question'
  tag: string
  q: string             // 독자 궁금증 자극 질문
  hint: string          // 힌트 (다음 카드 내용의 일부 공개)
  visual: CardVisual
}
```

**사용 시점**: 카드 시퀀스 중간에서 다음 카드로 넘기게 만드는 훅. EDUCATION 아키타입 첫 번째 카드.

---

## 2. 기존 타입 변경 사항

| 타입 | 변경 | 비고 |
|------|------|------|
| `cover` | **유지** | 기존 데이터 및 generateContextIssues에서 계속 사용 |
| `reason` | **유지** | 기존 데이터 호환용 |
| `bullish` | **유지** | 기존 데이터 호환용 |
| `bearish` | **유지** | 기존 데이터 호환용 |
| `community` | **신규 생성 금지** | 파서/렌더러 유지 (기존 데이터 표시 가능) |
| `stats` | **유지** | 기존 데이터 호환용 |
| `source` | **유지** | 계속 마지막 카드 |

---

## 3. 팩트 추출 모델 (Haiku stage)

```typescript
type ExtractedDelta = {
  before: string
  after: string
  period: string
}

type ExtractedIssue = {
  topic: string                    // 이슈 한 줄 제목
  archetype: 'BREAKING' | 'EARNINGS' | 'MACRO' | 'THEME' | 'EDUCATION'
  entity_id: string
  entity_name: string
  entity_type: 'stock' | 'index' | 'fx' | 'theme'
  change_value: string | null
  delta: ExtractedDelta | null
  is_subject_unfamiliar: boolean   // true → delta-intro 사용
  cause: string                    // 결과 + 원인 요약
  key_stats: string[]              // 핵심 통계 2개 이내
  compare_available: boolean       // compare 카드 생성 가능 여부
  impact_available: boolean        // impact 카드 생성 가능 여부
  risks: string[]                  // 리스크 요인 2개 이내
  verdict: string                  // 결론 한 줄
  source_article_indices: number[] // 참조한 기사 인덱스
}

type ExtractedFacts = {
  issues: ExtractedIssue[]
}
```

---

## 4. 카드 시퀀스 맵핑

아키타입별 권장 카드 시퀀스. 팩트 가용성에 따라 일부 타입 생략 가능.

| 아키타입 | 시퀀스 |
|---------|--------|
| BREAKING | delta → cause → stat → verdict → source |
| EARNINGS | delta → cause → stat → compare → verdict → source |
| MACRO | delta → cause → compare → impact → verdict → source |
| THEME | delta-intro → cause → stat → verdict → source |
| EDUCATION | question → cause → stat → compare → verdict → source |

**규칙**:
- `source`는 항상 마지막
- `verdict`는 `source` 바로 앞
- `compare_available: false`이면 compare 생략
- `impact_available: false`이면 impact 생략
- `is_subject_unfamiliar: true`이면 `delta-intro` 사용, 아니면 `delta`

---

## 5. DB 영향

변경 없음. `cards_data`는 `jsonb` 컬럼으로 새 카드 타입 구조를 그대로 저장 가능.

---

## 6. 카드 수 제약

| 상수 | 현재 | 변경 |
|------|------|------|
| `CARD_COUNT_MIN` | 3 | **유지** |
| `CARD_COUNT_MAX` | 7 | **유지** |
| 첫 카드 타입 | `cover` | `delta`, `delta-intro`, `question` 중 하나로 확장 |
| 마지막 카드 타입 | `source` | **유지** |
