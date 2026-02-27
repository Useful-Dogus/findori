// cards[] 스키마 타입 정의 — SRS § 4.2 기준
// Claude API가 이 스키마에 맞게 데이터를 생성함. 스키마 구조 변경 금지.

export type CardVisual = {
  /** 유효한 hex 값만 허용: "#0f172a" 형식 */
  bg_from: string
  bg_via: string
  bg_to: string
  accent: string
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

/** 커뮤니티·시장 반응 */
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

export type Card =
  | CoverCard
  | ReasonCard
  | BullishCard
  | BearishCard
  | CommunityCard
  | StatsCard
  | SourceCard

export type CardType = Card['type']

// 스키마 제약 상수
export const CARD_COUNT_MIN = 3
export const CARD_COUNT_MAX = 7
