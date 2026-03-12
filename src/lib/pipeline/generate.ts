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
                items: { type: 'object' },
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

// T002: buildSystemPrompt — 역할 정의 + 카드 타입 카탈로그 7종 + 제약 규칙 + 콘텐츠 규칙
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
