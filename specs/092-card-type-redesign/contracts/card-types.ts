/**
 * Card Type Contracts — Phase 2 신규 카드 타입 인터페이스 정의
 *
 * 이 파일은 구현체가 아닌 계약(contract)입니다.
 * 실제 구현은 src/types/cards.ts에 추가됩니다.
 */

// ── 공통 타입 (기존 유지) ─────────────────────────────────────────────────────

export type CardVisual = {
  bg_from: string  // hex 색상 (#RRGGBB 또는 #RGB)
  bg_via: string
  bg_to: string
  accent: string
}

export type CardSource = {
  title: string
  url: string
  domain: string
}

// ── 신규 카드 타입 인터페이스 ────────────────────────────────────────────────

/**
 * DeltaCard: 수치 변화량 강조
 * 사용 시점: 이슈의 핵심 수치 변화가 있을 때 첫 번째 카드로 사용
 */
export interface DeltaCard {
  id: number
  type: 'delta'
  tag: string
  before: string      // 변화 이전 값 (예: "1,280원")
  after: string       // 변화 이후 값 (예: "1,500원")
  period: string      // 기간 표현 (예: "2년 만에")
  context: string     // 1문장 해석, 80자 이내
  visual: CardVisual
}

/**
 * DeltaIntroCard: 낯선 주체 소개 + 변화량
 * 사용 시점: 독자에게 생소한 기업/지표가 이슈 주인공일 때 첫 번째 카드로 사용
 */
export interface DeltaIntroCard {
  id: number
  type: 'delta-intro'
  tag: string
  before: string      // 기준값 (예: "$134")
  after: string       // 변화 후 값 (예: "$162")
  period: string      // 기간 (예: "3월 25일 단 하루")
  what: string        // 주체 이름 (예: "ARM Holdings")
  whatDesc: string    // 주체 설명, 2문장 이내
  trigger: string     // 지금 왜 주목받는가, 1문장
  visual: CardVisual
}

/**
 * CauseCard: 결과 → 원인 순서로 설명
 * 사용 시점: 독자가 결과는 알지만 원인을 모를 때
 */
export interface CauseCard {
  id: number
  type: 'cause'
  tag: string
  result: string      // 결과 (짧게, 30자 이내) — 강조 표시됨
  cause: string       // 원인 설명, 3줄/120자 이내
  sources: CardSource[]  // 최소 1개
  visual: CardVisual
}

/**
 * StatCard: 단일 통계 강조
 * 사용 시점: 충격적인 단일 수치가 있을 때
 */
export interface StatCard {
  id: number
  type: 'stat'
  tag: string
  number: string      // 수치 (예: "771조원")
  label: string       // 수치 레이블 (예: "국민연금 해외 투자 규모")
  reveal: string      // 상식을 뒤집는 해석, 2줄/80자 이내
  sources: CardSource[]  // 최소 1개
  visual: CardVisual
}

/**
 * CompareRow: CompareCard의 비교 행
 */
export interface CompareRow {
  label: string                          // 비교 항목 이름 (예: "유로 🇪🇺")
  change: string                         // 변화량 (예: "+10%")
  dir: 'up' | 'down' | 'worst'          // 방향 ('worst'는 이슈의 주인공)
  note: string                           // 한 줄 설명
}

/**
 * CompareCard: 비교 테이블
 * 사용 시점: 비교 데이터로 신뢰를 더해야 할 때
 */
export interface CompareCard {
  id: number
  type: 'compare'
  tag: string
  q: string             // 비교 질문
  rows: CompareRow[]    // 최소 2개
  footer: string        // 결론 또는 맥락 문장
  visual: CardVisual
}

/**
 * ImpactItem: ImpactCard의 항목
 */
export interface ImpactItem {
  label: string         // 항목 이름 (예: "해외직구 100달러 상품")
  before: string        // 이전 금액
  after: string         // 현재 금액
  diff: string          // 차이 (예: "+22,000원") 또는 상태 ("위험" / "주의")
}

/**
 * ImpactCard: 독자 실생활 영향
 * 사용 시점: 환율, 물가, 금리 이슈에서 독자 지갑에 미치는 영향 표시
 */
export interface ImpactCard {
  id: number
  type: 'impact'
  tag: string
  items: ImpactItem[]   // 2-4개
  visual: CardVisual
}

/**
 * VerdictCard: 한 문장 결론
 * 사용 시점: 이슈의 결론 카드 — source 바로 앞에 위치
 */
export interface VerdictCard {
  id: number
  type: 'verdict'
  tag: string
  verdict: string       // 결론 한 문장, 50자 이내
  reasons: string[]     // 근거 2-3개 (각 60자 이내)
  visual: CardVisual
}

/**
 * QuestionCard: 다음 카드 연결 훅
 * 사용 시점: 다음 카드로 넘기는 흥미 유발 — EDUCATION 아키타입 첫 번째 카드
 */
export interface QuestionCard {
  id: number
  type: 'question'
  tag: string
  q: string             // 독자 궁금증 자극 질문
  hint: string          // 힌트 (다음 카드 일부 공개)
  visual: CardVisual
}

// ── 통합 카드 타입 ────────────────────────────────────────────────────────────

export type NewCard =
  | DeltaCard
  | DeltaIntroCard
  | CauseCard
  | StatCard
  | CompareCard
  | ImpactCard
  | VerdictCard
  | QuestionCard

export type NewCardType = NewCard['type']

// ── 팩트 추출 계약 ─────────────────────────────────────────────────────────────

export type IssueArchetype = 'BREAKING' | 'EARNINGS' | 'MACRO' | 'THEME' | 'EDUCATION'

export interface ExtractedDelta {
  before: string
  after: string
  period: string
}

export interface ExtractedIssue {
  topic: string
  archetype: IssueArchetype
  entity_id: string
  entity_name: string
  entity_type: 'stock' | 'index' | 'fx' | 'theme'
  change_value: string | null
  delta: ExtractedDelta | null
  is_subject_unfamiliar: boolean
  cause: string
  key_stats: string[]           // 최대 2개
  compare_available: boolean
  impact_available: boolean
  risks: string[]               // 최대 2개
  verdict: string
  source_article_indices: number[]
}

export interface ExtractedFacts {
  issues: ExtractedIssue[]      // 최대 3개
}
