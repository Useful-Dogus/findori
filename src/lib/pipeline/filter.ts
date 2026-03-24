import Anthropic from '@anthropic-ai/sdk'

import type { CollectedArticle, TokenUsage } from '@/types/pipeline'

const HAIKU_MODEL = 'claude-haiku-4-5-20251001'
const HAIKU_FILTER_TOOL_NAME = 'select_articles'
const MAX_FILTERED_ARTICLES = 10

// Haiku 비용: 입력 $0.80/MTok, 출력 $4.00/MTok
const HAIKU_INPUT_COST_PER_TOKEN = 0.8 / 1_000_000
const HAIKU_OUTPUT_COST_PER_TOKEN = 4.0 / 1_000_000

type AnthropicClientLike = {
  messages: {
    create: (params: Record<string, unknown>) => Promise<{
      content: Array<{ type: string; name?: string; input?: unknown }>
      usage: { input_tokens: number; output_tokens: number }
    }>
  }
}

function buildFilterPrompt(articles: CollectedArticle[]): string {
  const lines = articles.map((article, index) =>
    [`[${index}] ${article.title}`, article.summary ? `요약: ${article.summary}` : null]
      .filter(Boolean)
      .join('\n'),
  )
  return [
    `다음 ${articles.length}건의 기사 중 한국 개인 투자자에게 가장 유용한 상위 ${MAX_FILTERED_ARTICLES}건을 선별하세요.`,
    '',
    '선별 기준:',
    '1. 투자 관련성: 주식·환율·금리·실적·산업 이슈에 해당하는 기사 우선',
    '2. 주제 다양성: 동일 종목·이슈의 중복 기사는 대표 1건만 선택',
    '',
    lines.join('\n\n'),
  ].join('\n')
}

function getAnthropicClient() {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY is required')
  }
  return new Anthropic({ apiKey, maxRetries: 0 })
}

export async function filterArticles(
  articles: CollectedArticle[],
  deps: { anthropic?: AnthropicClientLike } = {},
): Promise<{
  articles: CollectedArticle[]
  usage: TokenUsage | null
  skipped: boolean
}> {
  if (articles.length <= MAX_FILTERED_ARTICLES) {
    return { articles, usage: null, skipped: false }
  }

  const anthropic = deps.anthropic ?? getAnthropicClient()

  try {
    const response = await anthropic.messages.create({
      model: HAIKU_MODEL,
      max_tokens: 256,
      messages: [{ role: 'user', content: buildFilterPrompt(articles) }],
      tools: [
        {
          name: HAIKU_FILTER_TOOL_NAME,
          description: '투자 관련 상위 기사의 인덱스 배열을 반환합니다.',
          input_schema: {
            type: 'object' as const,
            properties: {
              indices: {
                type: 'array',
                items: { type: 'number' },
                description: `선별된 기사의 0-based 인덱스 배열. 최대 ${MAX_FILTERED_ARTICLES}개.`,
              },
            },
            required: ['indices'],
            additionalProperties: false,
          },
        },
      ],
      tool_choice: { type: 'tool', name: HAIKU_FILTER_TOOL_NAME },
    })

    const toolUse = response.content.find(
      (block): block is { type: 'tool_use'; name: string; input: unknown } =>
        block.type === 'tool_use' && block.name === HAIKU_FILTER_TOOL_NAME,
    )
    const input = toolUse?.input as { indices?: unknown } | undefined
    const rawIndices = Array.isArray(input?.indices) ? input.indices : []
    const indices = rawIndices
      .filter((i): i is number => typeof i === 'number' && i >= 0 && i < articles.length)
      .slice(0, MAX_FILTERED_ARTICLES)

    const selected = indices.length > 0 ? indices.map((i) => articles[i]) : articles.slice(0, MAX_FILTERED_ARTICLES)

    const inputTokens = response.usage.input_tokens
    const outputTokens = response.usage.output_tokens
    const usage: TokenUsage = {
      inputTokens,
      outputTokens,
      estimatedCostUsd:
        inputTokens * HAIKU_INPUT_COST_PER_TOKEN + outputTokens * HAIKU_OUTPUT_COST_PER_TOKEN,
    }

    return { articles: selected, usage, skipped: false }
  } catch {
    return { articles: articles.slice(0, MAX_FILTERED_ARTICLES), usage: null, skipped: true }
  }
}
