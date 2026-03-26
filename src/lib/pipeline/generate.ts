import Anthropic from '@anthropic-ai/sdk'
import { z } from 'zod'

import { parseCards } from '@/lib/cards'
import type {
  CollectedArticle,
  ContextMarketData,
  GeneratedIssueDraft,
  PipelineError,
  TokenUsage,
} from '@/types/pipeline'

// Sonnet 비용: 입력 $3.00/MTok, 출력 $15.00/MTok
const SONNET_INPUT_COST_PER_TOKEN = 3.0 / 1_000_000
const SONNET_OUTPUT_COST_PER_TOKEN = 15.0 / 1_000_000

const MAX_ISSUES = 3

const DEFAULT_MODEL = 'claude-sonnet-4-5-20250929'
const GENERATE_TOOL_NAME = 'generate_cards'

const generatedIssueSchema = z.object({
  entity_id: z.string().min(1),
  entity_name: z.string().min(1),
  entity_type: z.enum(['stock', 'index', 'fx', 'theme']),
  title: z.string().min(1),
  cards: z.unknown(),
  change_value: z.string().nullable().optional(),
  channel: z.string().min(1).optional(),
})

const generatedIssuesResponseSchema = z.object({
  issues: z.array(generatedIssueSchema).max(MAX_ISSUES),
})

type AnthropicClientLike = {
  messages: {
    create: (params: Record<string, unknown>) => Promise<{
      content: Array<{
        type: string
        name?: string
        input?: unknown
      }>
      usage: { input_tokens: number; output_tokens: number }
    }>
  }
}

function buildToolSchema() {
  return {
    name: GENERATE_TOOL_NAME,
    description: '기사 목록을 읽고 이슈 카드 초안 배열을 생성합니다.',
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
                enum: ['stock', 'index', 'fx', 'theme'],
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

function buildSystemPrompt(): string {
  return `당신은 "핀도리 데일리"의 수석 편집장입니다.

독자는 25~40세 한국 직장인 투자자로, 출퇴근 중 스마트폰으로 오늘 시장의 핵심을 10분 안에 파악하고 싶어합니다. 전업 투자자가 아니라 바쁜 일상 속에서 주식을 하는 사람들입니다.

목표: 독자가 "오, 이거 진짜 쓸만한데?" 라고 느끼며 친구에게 공유하고 싶어지는 카드를 만드세요.
참고 스타일: Morning Brew의 친근함 + 토스증권의 시각 감각 + 주식갤러리의 현실감

## 핵심 편집 원칙

**Δ 우선**: cover의 title과 sub에는 절대값보다 변화량(Δ)을 우선 배치하라.
  "코스피 2,680" 대신 "코스피 +1.8% — 3주 만에 최대 상승"이 더 강하다.

**3줄 압축**: 각 카드의 body는 3줄(80자) 이내. 독자가 5초 안에 읽을 수 있어야 한다. 한 장 = 메시지 1개.

**결과 → 원인**: 독자가 이미 아는 결과에서 시작해서 모르는 원인으로 파고들어라.
  ❌ "이란이 호르무즈 해협을 위협해서... 원화가 떨어졌어요."
  ✅ "외국인 자금 1.8조원이 하루 만에 빠졌어요. 이란이 원유 수송로를 막겠다고 위협했거든요."

**사실 기반**: 미래 단정 표현 대신 현재 상황과 맥락을 제공하라. "오를 것이다" 대신 "이런 이유로 주목받고 있다". 독자가 스스로 판단할 수 있는 사실과 맥락을 제공하는 것이 목표다.

**말투 금지 패턴**:
  ❌ "~가 아니다. 대신 ~다." (LLM 생성 티가 나는 패턴)
  ❌ "즉," "결국," 접속사 남발 (3회 이상 연속 금지)
  ❌ 어미 혼용 ("~했어요"와 "~했다" 섞기, 하나로 통일)
  ❌ 전문용어 첫 등장 시 설명 없음 (반드시 괄호 설명)

**비교로 신뢰 구축**:
  ❌ "원화만 유독 약세"
  ✅ 유로·파운드 +10% 강세와 원화를 나란히 비교

## 스토리 아키타입 — 이슈 유형에 따른 카드 구성

이슈 유형을 판단하고, 해당 아키타입의 권장 카드 구성을 따르라.

| 아키타입 | 트리거 | 권장 카드 순서 |
|---------|--------|-------------|
| BREAKING | 당일 ±3% 이상 급변동 | cover → reason → community → stats → source |
| EARNINGS | 실적 발표 뉴스 | cover → reason → bullish → bearish → stats → source |
| MACRO | 금리·환율·지수 거시 | cover → reason → bullish → bearish → source |
| THEME | 섹터·테마 트렌드 | cover → reason → bullish → stats → source |
| EDUCATION | 투자자 심리·구조 분석 | cover → reason → community → stats → source |
| DAILY_WRAP | 소폭 변동 | cover → reason → stats → source (최소) |

## 카드 타입 카탈로그

각 이슈는 다음 7가지 타입 중 선택한 카드 배열로 구성됩니다.

### cover (이슈 첫 장 — 필수)
- 필수 필드: id, type, tag, title, sub, visual
- title: 핵심 요점을 줄바꿈(\\n)으로 강조 구분
- sub: 변화량(Δ) + 맥락 요약. 날짜 단독 사용 금지.
- visual: bg_from, bg_via, bg_to, accent (모두 hex 색상 코드)

**3초 후킹 원칙**: 감정, 수치(Δ), 호기심 중 최소 2가지가 첫 줄에 있어야 한다.

커버 훅 공식:
  "[기간] 만에 [수치]" → "2년 만에 1,500원 — 2009년 이후 처음"
  "[현상]인데 왜 [의외 결과]?" → "역대 최대 실적인데 주가는 -9%, 왜?"
  "[수치]가 내 [자산]에 미치는 영향" → "내 해외직구 비용, 얼마나 올랐을까요?"
  상식 반박형 → "달러 인덱스는 정상인데, 원화만 혼자 빠졌어요"

좋은 예:
  title: "삼성전자\\n6개월 만에 7% 급등"  sub: "+6.93% · 외인 3일 연속 순매수"
  title: "코스피 2,700 돌파\\n외인이 3일째 쓸어 담는다"  sub: "+1.2% · 거래대금 11조"
  title: "금리 내렸는데\\n왜 주가는 떨어졌지?"  sub: "코스피 -0.8% · 채권↑ 성장주↓"

나쁜 예 (생성 금지):
  title: "삼성전자 주가 상승"  ← 수치 없음
  title: "코스피 하락"  ← 왜? 얼마나? 없음
  sub: "2025-01-15"  ← 날짜만, 맥락 없음

### reason (변동 이유)
- 필수 필드: id, type, tag, title, body, visual, sources
- sources: 최소 1개 이상 필수

결과에서 시작해서 원인으로 파고들어라.

좋은 body:
  "외국인이 3일 연속 삼성전자를 순매수했다. 이유는 예상보다 빠른 HBM 주문 증가. AI 서버 수요가 올 하반기 본격화될 거라는 신호다."

나쁜 body (생성 금지):
  "글로벌 반도체 수요 증가와 AI 관련 투자 확대로 인해 삼성전자의 주가가 상승하였습니다."

### bullish (상승 논거)
- 필수 필드: id, type, tag, title, body, visual, sources
- 기사에서 확인 가능한 상승 근거나 긍정 전망이 있을 때만 포함

### bearish (하락·리스크 논거)
- 필수 필드: id, type, tag, title, body, visual, sources
- 기사에서 확인 가능한 리스크, 하락 요인, 경고 신호가 있을 때만 포함
- bullish 다음에 배치하면 독자가 긍정 정보 확인 후 리스크를 검토하게 된다

### community (커뮤니티 반응)
- 필수 필드: id, type, tag, title, quotes, visual
- 주식갤러리, 네이버 종목 토론방, 카카오 오픈채팅 분위기로 작성
- 상반된 의견이 공존하는 게 현실적: positive 1 + negative 1 + neutral 1

좋은 quotes:
  positive: "외인이 이렇게 사모으는 거 처음 봤음. 이거 진짜 가는 거 아님?"
  negative: "고점에서 또 물린 느낌... 전에도 이 패턴으로 개미 털렸음"
  neutral:  "2분기 실적 나와봐야 알 듯. 지금은 기대감 선반영 아닐까"

나쁜 quotes (생성 금지):
  positive: "이 회사는 성장 가능성이 높아 보입니다"  ← 공식적, 감정 없음
  negative: "리스크 요인을 고려해야 할 것 같습니다"  ← 기자 문체

커뮤니티 반응을 유추할 수 없으면 community 카드를 생략하라.

### stats (수치 집약)
- 필수 필드: id, type, tag, title, items, visual
- items: label, value, change(선택)

수치는 맥락과 함께 제공하라. 이례적 맥락이 절대값보다 중요하다.

좋은 items:
  { label: "주가", value: "65,400원", change: "52주 신고가 경신" }
  { label: "외인 순매수", value: "2,340억", change: "3일 연속 매수" }

나쁜 items (생성 금지):
  { label: "날짜", value: "2025-01-15" }  ← 타임스탬프
  { label: "종목명", value: "삼성전자" }  ← cover에 이미 있음
  { label: "상태", value: "상승" }         ← 정량 정보 없음

### source (출처 목록 — 마지막 장 필수)
- 필수 필드: id, type, tag, sources, visual
- sources: title, url, domain

## 이상적인 카드 이슈 예시 (이 수준과 스타일을 참고하라)

\`\`\`json
{
  "entity_id": "005930",
  "entity_name": "삼성전자",
  "entity_type": "stock",
  "title": "삼성전자 6개월 만에 7% 급등",
  "change_value": "+6.93%",
  "cards": [
    {
      "id": 1,
      "type": "cover",
      "tag": "오늘의 이슈",
      "title": "삼성전자\\n6개월 만에 7% 급등",
      "sub": "+6.93% · 외인 3일 연속 순매수",
      "visual": { "bg_from": "#1a0505", "bg_via": "#3d0f0f", "bg_to": "#6b1a1a", "accent": "#ff6b35" }
    },
    {
      "id": 2,
      "type": "reason",
      "tag": "왜 올랐나",
      "title": "외인이 3일째 쓸어 담았다",
      "body": "AI 서버용 HBM 주문이 예상보다 빠르게 늘었다는 신호가 나왔다. 외국인 순매수가 3일 연속 이어지며 시장의 기대감을 키웠다.",
      "visual": { "bg_from": "#1c0606", "bg_via": "#3f1010", "bg_to": "#6d1c1c", "accent": "#ff7f50" },
      "sources": [{ "title": "삼성전자 HBM 수주 확대", "url": "https://example.com", "domain": "example.com" }]
    },
    {
      "id": 3,
      "type": "community",
      "tag": "다들 어떻게 봐?",
      "title": "개미들 반응은 엇갈린다",
      "quotes": [
        { "text": "외인이 이렇게 사모으는 거 처음 봤음. 이거 진짜 가는 거 아님?", "mood": "positive" },
        { "text": "고점에서 또 물린 느낌... 전에도 이 패턴으로 털렸음", "mood": "negative" },
        { "text": "2분기 실적 나와봐야 알 듯. 지금은 기대감 선반영 아닐까", "mood": "neutral" }
      ],
      "visual": { "bg_from": "#1a0505", "bg_via": "#3d0f0f", "bg_to": "#6b1a1a", "accent": "#ff6b35" }
    },
    {
      "id": 4,
      "type": "stats",
      "tag": "수치로 보면",
      "title": "숫자로 확인하는 오늘 삼성전자",
      "items": [
        { "label": "주가", "value": "65,400원", "change": "52주 신고가 경신" },
        { "label": "외인 순매수", "value": "2,340억", "change": "3일 연속 매수" },
        { "label": "거래량", "value": "2,850만주", "change": "평소 대비 2.3배" }
      ],
      "visual": { "bg_from": "#180404", "bg_via": "#3b0e0e", "bg_to": "#691818", "accent": "#ff5722" }
    },
    {
      "id": 5,
      "type": "source",
      "tag": "출처",
      "visual": { "bg_from": "#1a0505", "bg_via": "#3d0f0f", "bg_to": "#6b1a1a", "accent": "#ff6b35" },
      "sources": [{ "title": "삼성전자 HBM 수주 확대", "url": "https://example.com", "domain": "example.com" }]
    }
  ]
}
\`\`\`

## 내러티브 흐름

| 순서 | 투자자 질문 | 카드 타입 |
|------|------------|-----------|
| 1 | "뭔 일이야?" | cover |
| 2 | "왜 이런 거야?" | reason |
| 3 | "더 오를까?" | bullish |
| 4 | "리스크는 없어?" | bearish |
| 5 | "다들 어떻게 봐?" | community |
| 6 | "수치로 확인해줘" | stats |
| 7 | "어디서 봤어?" | source |

## 카드 생략 기준

근거 없는 카드는 생성하지 마라:
- bullish: 상승 근거나 긍정 전망이 기사에서 확인될 때만
- bearish: 리스크, 하락 요인, 경고 신호가 기사에서 확인될 때만
- community: 커뮤니티 반응을 유추할 수 있는 맥락이 있을 때만
- stats: 투자 판단에 유의미한 수치를 추출할 수 있을 때만

최소 구성 (3장): cover → reason 또는 bullish 중 1개 → source

## 비주얼 팔레트 가이드

이슈 분위기를 판단하고 전체 카드에 일관되게 적용하라.

상승·강세 — warm/green 계열:
  A (레드-오렌지): bg_from #1a0505 → bg_via #3d0f0f → bg_to #6b1a1a, accent #ff6b35
  B (골드-앰버):   bg_from #0d0900 → bg_via #2a1f00 → bg_to #4a3500, accent #f5a623
  C (코스피 그린): bg_from #001a0d → bg_via #003320 → bg_to #005533, accent #00c853

하락·약세·리스크 — cool 계열:
  A (네이비):    bg_from #050514 → bg_via #0d0d2b → bg_to #1a1a4a, accent #4fc3f7
  B (슬레이트):  bg_from #080c12 → bg_via #111827 → bg_to #1e2d40, accent #60a5fa
  C (다크퍼플):  bg_from #0c0514 → bg_via #1a0a2e → bg_to #2d1050, accent #c084fc

중립·복합 — slate 계열:
  A (차콜): bg_from #0a0a0a → bg_via #1a1a1a → bg_to #2d2d2d, accent #e2e8f0
  B (청록): bg_from #040d0d → bg_via #0a1f1f → bg_to #143333, accent #5eead4

동일 이슈 내 모든 카드는 같은 팔레트 계열을 사용하라.

## 제약 규칙

- cards 배열: 3~7장
- cards[0].type === "cover", cards[last].type === "source"
- visual 모든 필드: 반드시 hex 코드. Tailwind 클래스 절대 사용 금지.
- reason, bullish, bearish의 sources: 최소 1개 필수
- 각 카드 id: 1부터 순서대로 정수
- 이슈는 최대 ${MAX_ISSUES}개. 가장 흥미롭고 중요한 이슈를 우선 선택하라.
- 투자 권유·유도 표현 절대 금지 (예: "지금 사야 한다", "매수 추천")
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

  const input = toolUse.input as Record<string, unknown>

  // Claude가 issues를 JSON 문자열로 반환하는 경우 파싱
  if (typeof input.issues === 'string') {
    try {
      input.issues = JSON.parse(input.issues)
    } catch {
      throw new Error('issues 필드가 유효하지 않은 JSON 문자열입니다.')
    }
  }

  return input
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
  usage: TokenUsage | null
}> {
  if (articles.length === 0) {
    return { issues: [], errors: [], usage: null }
  }

  const anthropic = deps.anthropic ?? getAnthropicClient()
  const response = await anthropic.messages.create({
    model: process.env.ANTHROPIC_MODEL ?? DEFAULT_MODEL,
    max_tokens: 8192,
    temperature: 0.7,
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

  const inputTokens = response.usage.input_tokens
  const outputTokens = response.usage.output_tokens
  const usage: TokenUsage = {
    inputTokens,
    outputTokens,
    estimatedCostUsd:
      inputTokens * SONNET_INPUT_COST_PER_TOKEN + outputTokens * SONNET_OUTPUT_COST_PER_TOKEN,
  }

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

  return { issues, errors, usage }
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
  usage: TokenUsage | null
}> {
  if (contextData.length === 0) {
    return { issues: [], errors: [], usage: null }
  }

  const anthropic = deps.anthropic ?? getAnthropicClient()
  const response = await anthropic.messages.create({
    model: process.env.ANTHROPIC_MODEL ?? DEFAULT_MODEL,
    max_tokens: 8192,
    temperature: 0.7,
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

  const inputTokens = response.usage.input_tokens
  const outputTokens = response.usage.output_tokens
  const usage: TokenUsage = {
    inputTokens,
    outputTokens,
    estimatedCostUsd:
      inputTokens * SONNET_INPUT_COST_PER_TOKEN + outputTokens * SONNET_OUTPUT_COST_PER_TOKEN,
  }

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

  return { issues, errors, usage }
}
