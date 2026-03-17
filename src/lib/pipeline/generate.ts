import Anthropic from '@anthropic-ai/sdk'
import { z } from 'zod'

import { parseCards } from '@/lib/cards'
import type {
  CollectedArticle,
  ContextMarketData,
  GeneratedIssueDraft,
  PipelineError,
} from '@/types/pipeline'

const DEFAULT_MODEL = 'claude-sonnet-4-5-20250929'
const GENERATE_TOOL_NAME = 'generate_cards'

const generatedIssueSchema = z.object({
  entity_id: z.string().min(1),
  entity_name: z.string().min(1),
  entity_type: z.enum(['stock', 'index', 'currency', 'theme']),
  title: z.string().min(1),
  cards: z.unknown(),
  change_value: z.string().nullable().optional(),
  channel: z.string().min(1).optional(),
})

const generatedIssuesResponseSchema = z.object({
  issues: z.array(generatedIssueSchema),
})

type AnthropicClientLike = {
  messages: {
    create: (params: Record<string, unknown>) => Promise<{
      content: Array<{
        type: string
        name?: string
        input?: unknown
      }>
    }>
  }
}

function buildToolSchema() {
  return {
    name: GENERATE_TOOL_NAME,
    description: '기사 목록을 읽고 이슈 카드 초안 배열을 생성합니다.',
    strict: true,
    input_schema: {
      type: 'object' as const,
      properties: {
        issues: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              entity_id: { type: 'string' },
              entity_name: { type: 'string' },
              entity_type: {
                type: 'string',
                enum: ['stock', 'index', 'currency', 'theme'],
              },
              title: { type: 'string' },
              change_value: { type: ['string', 'null'] },
              channel: { type: 'string' },
              cards: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'number' },
                    type: {
                      type: 'string',
                      enum: [
                        'cover',
                        'reason',
                        'bullish',
                        'bearish',
                        'community',
                        'stats',
                        'source',
                      ],
                    },
                    tag: { type: 'string' },
                    title: { type: 'string' },
                    body: { type: 'string' },
                    sub: { type: 'string' },
                    stat: { type: 'string' },
                    visual: {
                      type: 'object',
                      properties: {
                        bg_from: { type: 'string' },
                        bg_via: { type: 'string' },
                        bg_to: { type: 'string' },
                        accent: { type: 'string' },
                      },
                      required: ['bg_from', 'bg_via', 'bg_to', 'accent'],
                      additionalProperties: false,
                    },
                    sources: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          title: { type: 'string' },
                          url: { type: 'string' },
                          domain: { type: 'string' },
                        },
                        required: ['title', 'url', 'domain'],
                        additionalProperties: false,
                      },
                    },
                    quotes: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          text: { type: 'string' },
                          mood: { type: 'string' },
                        },
                        required: ['text', 'mood'],
                        additionalProperties: false,
                      },
                    },
                    items: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          label: { type: 'string' },
                          value: { type: 'string' },
                          change: { type: 'string' },
                        },
                        required: ['label', 'value'],
                        additionalProperties: false,
                      },
                    },
                  },
                  required: ['id', 'type', 'tag', 'visual'],
                  additionalProperties: false,
                },
              },
            },
            required: ['entity_id', 'entity_name', 'entity_type', 'title', 'cards'],
            additionalProperties: false,
          },
        },
      },
      required: ['issues'],
      additionalProperties: false,
    },
  }
}

// T002: buildSystemPrompt — 역할 정의 + 카드 타입 카탈로그 7종 + 내러티브 흐름 + 비주얼 팔레트 + 카드별 콘텐츠 가이드 + 제약 규칙 + 콘텐츠 규칙
function buildSystemPrompt(): string {
  return `당신은 금융 뉴스 편집 파이프라인입니다. 한국 개인 투자자를 위한 카드형 뉴스 이슈를 생성합니다.

## 카드 타입 카탈로그

각 이슈는 다음 7가지 타입 중 선택한 카드 배열로 구성됩니다.

### cover (이슈 첫 장 — 필수)
- 필수 필드: id, type, tag, title, sub, visual
- title: 핵심 요점을 줄바꿈(\\n)으로 강조 구분
- sub: 수치·날짜 요약 (예: "+6.9% · 2025-01-15")
- visual: bg_from, bg_via, bg_to, accent (모두 hex 색상 코드)

### reason (변동 이유)
- 필수 필드: id, type, tag, title, body, visual, sources
- sources: 최소 1개 이상 필수. 각 항목: title, url, domain
- stat: 선택 (수치 강조용, 예: { label: "거래량", value: "1,234만주" })

### bullish (상승 논거)
- 필수 필드: id, type, tag, title, body, visual, sources
- sources: 최소 1개 이상 필수
- stat: 선택

### bearish (하락·리스크 논거)
- 필수 필드: id, type, tag, title, body, visual, sources
- sources: 최소 1개 이상 필수
- stat: 선택

### community (커뮤니티 반응)
- 필수 필드: id, type, tag, title, quotes, visual
- quotes: 배열. 각 항목: text (커뮤니티 반응 인용), mood ("positive" | "negative" | "neutral")

### stats (수치 집약)
- 필수 필드: id, type, tag, title, items, visual
- items: 배열. 각 항목: label, value, change(선택)

### source (출처 목록 — 마지막 장 필수)
- 필수 필드: id, type, tag, sources, visual
- sources: 배열. 각 항목: title, url, domain

## 내러티브 흐름

한국 개인 투자자는 카드를 넘기며 다음 순서로 궁금해한다. 이 흐름에 따라 카드를 배열하라.

| 순서 | 투자자 질문 | 카드 타입 |
|------|------------|-----------|
| 1 | "뭔 일이야?" | cover |
| 2 | "왜 이런 거야?" | reason |
| 3 | "더 오를까?" | bullish |
| 4 | "리스크는 없어?" | bearish |
| 5 | "다들 어떻게 봐?" | community |
| 6 | "수치로 확인해줘" | stats |
| 7 | "어디서 봤어?" | source |

### cover 카드 headline 원칙

cover.title 첫 줄에는 종목명 또는 핵심 수치/결론을 반드시 배치하라.

올바른 예:
- title: "삼성전자\\n6개월 만에 7% 급등"
- title: "코스피 2,700 돌파\\n외인 순매수 3일 연속"
- sub: "+6.93% · 2025-01-15"

잘못된 예 (생성 금지):
- title: "삼성전자 주가 상승" ← 수치 없음
- sub: "오늘 상승" ← 날짜·수치 없음

### 카드 생략 기준

근거 없는 카드는 억지로 생성하지 마라. 아래 조건을 충족할 때만 포함하라:
- bullish: 기사에서 상승 근거 또는 긍정 전망을 확인할 수 있을 때
- bearish: 기사에서 리스크, 하락 요인, 경고 신호를 확인할 수 있을 때
- community: 기사에서 투자자 커뮤니티 반응을 유추할 수 있을 때
- stats: 기사에서 투자 판단에 유의미한 수치를 추출할 수 있을 때

최소 구성 (3장): cover → reason 또는 bullish 중 1개 → source

## 비주얼 팔레트 가이드

이슈의 전반적 분위기를 판단하고, 아래 계열 중 하나를 이슈 전체에 일관되게 적용하라.

### 상승·강세 (Bullish Momentum) — warm 또는 vivid green 계열

분위기: 활기, 에너지, 기대감

팔레트 예시 A (레드-오렌지):
  bg_from: #1a0505   bg_via: #3d0f0f   bg_to: #6b1a1a   accent: #ff6b35

팔레트 예시 B (골드-앰버):
  bg_from: #0d0900   bg_via: #2a1f00   bg_to: #4a3500   accent: #f5a623

팔레트 예시 C (코스피 상승 그린):
  bg_from: #001a0d   bg_via: #003320   bg_to: #005533   accent: #00c853

### 하락·약세·리스크 (Bearish / Risk) — cool 계열

분위기: 우려, 침착, 경계감

팔레트 예시 A (네이비-인디고):
  bg_from: #050514   bg_via: #0d0d2b   bg_to: #1a1a4a   accent: #4fc3f7

팔레트 예시 B (슬레이트-블루):
  bg_from: #080c12   bg_via: #111827   bg_to: #1e2d40   accent: #60a5fa

팔레트 예시 C (다크 퍼플):
  bg_from: #0c0514   bg_via: #1a0a2e   bg_to: #2d1050   accent: #c084fc

### 중립·복합 (Neutral / Mixed) — monochrome/slate 계열

분위기: 차분, 분석적, 전문적

팔레트 예시 A (차콜-그레이):
  bg_from: #0a0a0a   bg_via: #1a1a1a   bg_to: #2d2d2d   accent: #e2e8f0

팔레트 예시 B (다크 청록):
  bg_from: #040d0d   bg_via: #0a1f1f   bg_to: #143333   accent: #5eead4

### 팔레트 일관성 규칙

동일 이슈 내 모든 카드는 같은 팔레트 계열을 사용하라.
bg_from은 가장 어둡게, bg_to로 갈수록 약간 밝아지는 그라디언트로 구성하라.

올바른 예 (모든 카드가 레드-오렌지 계열):
  cover:   bg_from #1a0505 → accent #ff6b35
  reason:  bg_from #1c0606 → accent #ff7f50
  bullish: bg_from #180404 → accent #ff5722

잘못된 예 (카드마다 다른 계열, 생성 금지):
  cover:   bg_from #1a0505 (레드)
  reason:  bg_from #050514 (네이비) ← 계열 불일치

## 카드별 콘텐츠 가이드

### community 카드

주식 갤러리, 네이버 종목 토론, 카카오 오픈채팅 등 실제 개인 투자자 커뮤니티의 대화 스타일로 작성하라. 공식적이지 않아도 되며, 감정이 살아있어야 한다. 속어 사용 가능.

quotes 예시:
  positive: "이거 진짜 간다. 외인이 이렇게 사모으는 거 처음 봤음"
  negative: "고점에서 또 물렸노... 이번엔 진짜 손절 각임"
  neutral:  "좀 더 지켜봐야 할 것 같은데, 아직 확신 없음"

mood는 positive / negative / neutral 중 기사 내용에 맞게 배분하라.
기사에서 커뮤니티 반응을 유추할 수 없으면 community 카드를 생략하라. 억지 생성은 신뢰를 해친다.

### stats 카드

투자 판단에 실제로 필요한 수치 기반 지표만 포함하라. 이슈 유형별 우선 지표:

| 이슈 유형 | 우선 지표 예시 |
|----------|--------------|
| 주식 (상승) | 등락률, 거래량, 외인순매수, 52주 고/저 |
| 주식 (하락) | 등락률, 거래량, 기관순매도, 손절대 |
| 주식 (실적) | EPS, PER, 매출성장률, 영업이익 |
| 지수 | 등락, 거래대금, 외인비중 |
| 통화 | 환율, 변동폭, 달러인덱스 |

생성 금지 예시 (수치 없는 items):
  { label: "날짜", value: "2025-01-15" }   ← 타임스탬프 반복
  { label: "종목명", value: "삼성전자" }   ← cover에 이미 있음
  { label: "상태", value: "상승" }          ← 정량 정보 없음

## 제약 규칙

- cards 배열: 3~7장
- cards[0].type === "cover" (첫 카드는 반드시 cover)
- cards[last].type === "source" (마지막 카드는 반드시 source)
- visual 모든 필드(bg_from, bg_via, bg_to, accent): 반드시 hex 코드 (#RGB 또는 #RRGGBB). Tailwind 클래스 절대 사용 금지.
- reason, bullish, bearish 타입 카드의 sources 배열: 최소 1개 필수
- 각 카드의 id는 1부터 순서대로 정수 부여

## 콘텐츠 규칙

- 투자 권유·유도 표현 절대 금지 (예: "지금 사야 한다", "매수 추천", "강력 매수" 등)
- 사실 기반 서술만 허용. 미래 예측 단정 표현 금지.
- 모든 텍스트는 한국어로 작성`
}

// T004: buildPrompt 단순화 — 역할/규칙 지시문 제거, 기사 목록만 포함
function buildPrompt(articles: CollectedArticle[]) {
  const lines = articles.map((article, index) =>
    [
      `Article ${index + 1}`,
      `source: ${article.sourceName}`,
      `url: ${article.url}`,
      `title: ${article.title}`,
      `summary: ${article.summary || '(empty)'}`,
      `content: ${article.content || '(empty)'}`,
    ].join('\n'),
  )

  return lines.join('\n\n')
}

// T008: buildContextPrompt — 시장 맥락 지표를 텍스트로 나열하는 user prompt
function buildContextPrompt(contextData: ContextMarketData[]) {
  const lines = contextData.map((item) =>
    [
      `${item.entityName} (${item.entityId})`,
      `type: ${item.entityType}`,
      `value: ${item.value}`,
      `change: ${item.change}`,
      `changePercent: ${item.changePercent}`,
    ].join('\n'),
  )

  return [
    '다음 시장 맥락 지표 데이터를 바탕으로 각 지표별 이슈 카드를 생성하세요.',
    '',
    lines.join('\n\n'),
  ].join('\n')
}

function getAnthropicClient() {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY is required')
  }

  return new Anthropic({
    apiKey,
    maxRetries: 1,
  })
}

function extractToolInput(message: {
  content: Array<{
    type: string
    name?: string
    input?: unknown
  }>
}) {
  const toolUse = message.content.find(
    (block) => block.type === 'tool_use' && block.name === GENERATE_TOOL_NAME,
  )

  if (!toolUse?.input) {
    throw new Error('Claude 응답에서 tool_use 입력을 찾지 못했습니다.')
  }

  return toolUse.input
}

// T003: system: buildSystemPrompt() 파라미터 추가
// T005: channel 기본값 'default' → 'v1'
export async function generateIssues(
  articles: CollectedArticle[],
  deps: {
    anthropic?: AnthropicClientLike
  } = {},
): Promise<{
  issues: GeneratedIssueDraft[]
  errors: PipelineError[]
}> {
  if (articles.length === 0) {
    return { issues: [], errors: [] }
  }

  const anthropic = deps.anthropic ?? getAnthropicClient()
  const response = await anthropic.messages.create({
    model: process.env.ANTHROPIC_MODEL ?? DEFAULT_MODEL,
    max_tokens: 4096,
    temperature: 0.2,
    system: buildSystemPrompt(),
    messages: [
      {
        role: 'user',
        content: buildPrompt(articles),
      },
    ],
    tools: [buildToolSchema()],
    tool_choice: {
      type: 'tool',
      name: GENERATE_TOOL_NAME,
      disable_parallel_tool_use: true,
    },
  })

  const parsed = generatedIssuesResponseSchema.parse(extractToolInput(response))
  const issues: GeneratedIssueDraft[] = []
  const errors: PipelineError[] = []

  for (const issue of parsed.issues) {
    const cardsResult = parseCards(issue.cards)

    if (!cardsResult.success || cardsResult.data === null) {
      errors.push({
        source: issue.entity_name,
        message: cardsResult.success ? 'cards_data_missing' : cardsResult.errors.join(', '),
      })
      continue
    }

    issues.push({
      entityId: issue.entity_id,
      entityName: issue.entity_name,
      entityType: issue.entity_type,
      title: issue.title,
      cards: cardsResult.data,
      changeValue: issue.change_value ?? null,
      channel: issue.channel ?? 'v1',
    })
  }

  return { issues, errors }
}

// T009: generateContextIssues — generateIssues와 동일한 tool_use 패턴, 다른 user prompt
export async function generateContextIssues(
  contextData: ContextMarketData[],
  deps: {
    anthropic?: AnthropicClientLike
  } = {},
): Promise<{
  issues: GeneratedIssueDraft[]
  errors: PipelineError[]
}> {
  if (contextData.length === 0) {
    return { issues: [], errors: [] }
  }

  const anthropic = deps.anthropic ?? getAnthropicClient()
  const response = await anthropic.messages.create({
    model: process.env.ANTHROPIC_MODEL ?? DEFAULT_MODEL,
    max_tokens: 4096,
    temperature: 0.2,
    system: buildSystemPrompt(),
    messages: [
      {
        role: 'user',
        content: buildContextPrompt(contextData),
      },
    ],
    tools: [buildToolSchema()],
    tool_choice: {
      type: 'tool',
      name: GENERATE_TOOL_NAME,
      disable_parallel_tool_use: true,
    },
  })

  const parsed = generatedIssuesResponseSchema.parse(extractToolInput(response))
  const issues: GeneratedIssueDraft[] = []
  const errors: PipelineError[] = []

  for (const issue of parsed.issues) {
    const cardsResult = parseCards(issue.cards)

    if (!cardsResult.success || cardsResult.data === null) {
      errors.push({
        source: issue.entity_name,
        message: cardsResult.success ? 'cards_data_missing' : cardsResult.errors.join(', '),
      })
      continue
    }

    issues.push({
      entityId: issue.entity_id,
      entityName: issue.entity_name,
      entityType: issue.entity_type,
      title: issue.title,
      cards: cardsResult.data,
      changeValue: issue.change_value ?? null,
      channel: issue.channel ?? 'v1',
    })
  }

  return { issues, errors }
}
