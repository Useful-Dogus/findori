// cards[] 스키마 타입 정의 — SRS § 4.2 기준
// Claude API가 이 스키마에 맞게 데이터를 생성함.
// Phase 2(092-card-type-redesign): 8개 신규 카드 타입 추가. 기존 7개 타입 유지(DB 호환).

export type CardVisual = {
  /** 유효한 hex 값만 허용: "#0f172a" 형식 */
  bg_from: string
  bg_via: string
  bg_to: string
  accent: string
  /** 이미지 라이브러리 키 (예: "theme/stock-up", "company/samsung"). 없으면 gradient만 표시 */
  imgCategory?: string
}

export type CardSource = {
  title: string
  url: string
  domain: string
}

/** 이슈 첫 장 — 핵심 수치 강조 */
export type CoverCard = {
  id: number
  type: 'cover'
  tag: string
  title: string
  sub: string
  visual: CardVisual
}

/** 변동 이유 설명 */
export type ReasonCard = {
  id: number
  type: 'reason'
  tag: string
  title: string
  body: string
  stat?: string
  visual: CardVisual
  sources: CardSource[]
}

/** 상승 논거 */
export type BullishCard = {
  id: number
  type: 'bullish'
  tag: string
  title: string
  body: string
  stat?: string
  visual: CardVisual
  sources: CardSource[]
}

/** 하락·리스크 논거 */
export type BearishCard = {
  id: number
  type: 'bearish'
  tag: string
  title: string
  body: string
  stat?: string
  visual: CardVisual
  sources: CardSource[]
}

export type CommunityQuote = {
  text: string
  mood: string
}

/**
 * 커뮤니티·시장 반응
 * @deprecated 신규 생성 금지. 기존 DB 데이터 호환을 위해 타입·파서·렌더러는 유지.
 */
export type CommunityCard = {
  id: number
  type: 'community'
  tag: string
  title: string
  quotes: CommunityQuote[]
  visual: CardVisual
}

export type StatsItem = {
  label: string
  value: string
  change?: string
}

/** 수치 중심 정보 */
export type StatsCard = {
  id: number
  type: 'stats'
  tag: string
  title: string
  items: StatsItem[]
  visual: CardVisual
}

/** 출처 목록 + 공유 — 반드시 마지막 카드 */
export type SourceCard = {
  id: number
  type: 'source'
  tag: string
  sources: CardSource[]
  visual: CardVisual
}

// ── Phase 2 신규 카드 타입 (092-card-type-redesign) ──────────────────────────

/** 수치 변화량 강조 — Δ before/after/period + 1문장 해석 */
export type DeltaCard = {
  id: number
  type: 'delta'
  tag: string
  before: string // 변화 이전 값 (예: "1,280원")
  after: string // 변화 이후 값 (예: "1,500원")
  period: string // 기간 (예: "2년 만에")
  context: string // 1문장 해석, 80자 이내
  visual: CardVisual
}

/** 낯선 주체 소개 + 변화량 — 독자에게 생소한 기업/지표가 주인공일 때 */
export type DeltaIntroCard = {
  id: number
  type: 'delta-intro'
  tag: string
  before: string // 기준값
  after: string // 변화 후 값
  period: string // 기간
  what: string // 주체 이름
  whatDesc: string // 주체 설명, 2문장 이내
  trigger: string // 지금 왜 주목받는가, 1문장
  visual: CardVisual
}

/** 결과 → 원인 순서로 설명 */
export type CauseCard = {
  id: number
  type: 'cause'
  tag: string
  result: string // 결과 (30자 이내) — 강조 표시됨
  cause: string // 원인 설명 (3줄/120자 이내)
  sources: CardSource[]
  visual: CardVisual
}

/** 단일 통계 강조 — 충격적 수치 + 상식 반박 해석 */
export type StatCard = {
  id: number
  type: 'stat'
  tag: string
  number: string // 수치 (예: "771조원")
  label: string // 수치 레이블
  reveal: string // 상식을 뒤집는 해석, 2줄/80자 이내
  sources: CardSource[]
  visual: CardVisual
}

export type CompareRow = {
  label: string // 비교 항목 이름
  change: string // 변화량 (예: "+10%")
  dir: 'up' | 'down' | 'worst' // 방향 ('worst'는 이슈 주인공)
  note: string // 한 줄 설명
}

/** 비교 테이블 — 비교 데이터로 신뢰 구축 */
export type CompareCard = {
  id: number
  type: 'compare'
  tag: string
  q: string // 비교 질문
  rows: CompareRow[] // 최소 2개
  footer: string // 결론 또는 맥락 문장
  visual: CardVisual
}

export type ImpactItem = {
  label: string // 항목 이름
  before: string // 이전 금액
  after: string // 현재 금액
  diff: string // 차이 (예: "+22,000원") 또는 상태 ("위험"/"주의")
}

/** 독자 실생활 영향 — 환율/물가/금리 이슈에서 지갑 영향 */
export type ImpactCard = {
  id: number
  type: 'impact'
  tag: string
  items: ImpactItem[] // 2-4개
  visual: CardVisual
}

/** 한 문장 결론 — source 카드 바로 앞에 위치 */
export type VerdictCard = {
  id: number
  type: 'verdict'
  tag: string
  verdict: string // 결론 한 문장, 50자 이내
  reasons: string[] // 근거 2-3개 (각 60자 이내)
  visual: CardVisual
}

/** 다음 카드 연결 훅 — EDUCATION 아키타입 첫 번째 카드로 사용 */
export type QuestionCard = {
  id: number
  type: 'question'
  tag: string
  q: string // 독자 궁금증 자극 질문
  hint: string // 힌트 (다음 카드 일부 공개)
  visual: CardVisual
}

// ── 통합 타입 ─────────────────────────────────────────────────────────────────

export type Card =
  | CoverCard
  | ReasonCard
  | BullishCard
  | BearishCard
  | CommunityCard
  | StatsCard
  | SourceCard
  // Phase 2 신규 타입
  | DeltaCard
  | DeltaIntroCard
  | CauseCard
  | StatCard
  | CompareCard
  | ImpactCard
  | VerdictCard
  | QuestionCard

export type CardType = Card['type']

// 스키마 제약 상수
export const CARD_COUNT_MIN = 3
export const CARD_COUNT_MAX = 7

/**
 * 첫 번째 카드로 허용되는 타입 목록.
 * - cover: 기존 타입 (generateContextIssues 호환)
 * - delta: 수치 변화량 강조
 * - delta-intro: 낯선 주체 소개
 * - question: EDUCATION 아키타입 훅
 */
export const FIRST_CARD_TYPES = ['cover', 'delta', 'delta-intro', 'question'] as const
export type FirstCardType = (typeof FIRST_CARD_TYPES)[number]
