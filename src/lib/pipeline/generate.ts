import Anthropic from '@anthropic-ai/sdk'
import { z } from 'zod'

import { parseCards } from '@/lib/cards'
import type { CollectedArticle, GeneratedIssueDraft, PipelineError } from '@/types/pipeline'

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

  return [
    '당신은 금융 뉴스 편집 파이프라인입니다.',
    '입력 기사들을 주제별로 묶어 issue 단위로 정리하고 cards 배열은 findori 스키마를 따라야 합니다.',
    'cards는 3~7장, 첫 카드는 cover, 마지막 카드는 source 여야 합니다.',
    '근거가 약한 경우 억지로 생성하지 말고 가능한 항목만 반환하세요.',
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
      channel: issue.channel ?? 'default',
    })
  }

  return { issues, errors }
}
