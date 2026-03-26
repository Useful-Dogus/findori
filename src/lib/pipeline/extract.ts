/**
 * 팩트 추출 모듈 — Phase 2 (092-card-type-redesign)
 *
 * collect → filter → [extract] → generate → store
 *
 * Haiku를 사용해 기사 배치에서 이슈별 구조화된 팩트를 추출합니다.
 * 추출된 팩트는 generateIssues에 전달되어 카드 생성 품질을 향상시킵니다.
 * 실패 시 null 반환 (파이프라인은 계속 진행, generateIssues가 원문으로 fallback).
 */

import Anthropic from '@anthropic-ai/sdk'
import { z } from 'zod'

import type { CollectedArticle, TokenUsage } from '@/types/pipeline'

// Haiku 비용: 입력 $0.80/MTok, 출력 $4.00/MTok
const HAIKU_INPUT_COST_PER_TOKEN = 0.8 / 1_000_000
const HAIKU_OUTPUT_COST_PER_TOKEN = 4.0 / 1_000_000

const HAIKU_MODEL = process.env.HAIKU_MODEL ?? 'claude-haiku-4-5-20250107'
const EXTRACT_TOOL_NAME = 'extract_facts'
const MAX_EXTRACTED_ISSUES = 3

// ── Zod 스키마 ────────────────────────────────────────────────────────────────

const extractedDeltaSchema = z.object({
  before: z.string(),
  after: z.string(),
  period: z.string(),
})

const extractedIssueSchema = z.object({
  topic: z.string(),
  archetype: z.enum(['BREAKING', 'EARNINGS', 'MACRO', 'THEME', 'EDUCATION']),
  entity_id: z.string(),
  entity_name: z.string(),
  entity_type: z.enum(['stock', 'index', 'fx', 'theme']),
  change_value: z.string().nullable(),
  delta: extractedDeltaSchema.nullable(),
  is_subject_unfamiliar: z.boolean(),
  cause: z.string(),
  key_stats: z.array(z.string()).max(2),
  compare_available: z.boolean(),
  impact_available: z.boolean(),
  risks: z.array(z.string()).max(2),
  verdict: z.string(),
  source_article_indices: z.array(z.number()),
})

const extractedFactsSchema = z.object({
  issues: z.array(extractedIssueSchema).max(MAX_EXTRACTED_ISSUES),
})

export type ExtractedFacts = z.infer<typeof extractedFactsSchema>
export type ExtractedIssue = z.infer<typeof extractedIssueSchema>

// ── Tool Schema ───────────────────────────────────────────────────────────────

function buildExtractToolSchema() {
  return {
    name: EXTRACT_TOOL_NAME,
    description: '기사 목록에서 카드뉴스 생성에 필요한 핵심 팩트를 구조화하여 추출합니다.',
    input_schema: {
      type: 'object' as const,
      properties: {
        issues: {
          type: 'array',
          description: `카드뉴스화할 이슈 목록 (최대 ${MAX_EXTRACTED_ISSUES}개)`,
          items: {
            type: 'object',
            properties: {
              topic: { type: 'string', description: '이슈 한 줄 제목' },
              archetype: {
                type: 'string',
                enum: ['BREAKING', 'EARNINGS', 'MACRO', 'THEME', 'EDUCATION'],
                description:
                  'BREAKING: 당일 ±3% 급변동 | EARNINGS: 실적 발표 | MACRO: 금리·환율·지수 | THEME: 섹터·테마 | EDUCATION: 구조·심리 분석',
              },
              entity_id: { type: 'string' },
              entity_name: { type: 'string' },
              entity_type: { type: 'string', enum: ['stock', 'index', 'fx', 'theme'] },
              change_value: {
                type: ['string', 'null'],
                description: '변화량 (예: "+6.93%", "null"이면 null)',
              },
              delta: {
                type: ['object', 'null'],
                description: '수치 변화 정보. 없으면 null.',
                properties: {
                  before: { type: 'string', description: '변화 이전 값 (예: "1,280원")' },
                  after: { type: 'string', description: '변화 이후 값 (예: "1,500원")' },
                  period: { type: 'string', description: '기간 (예: "2년 만에")' },
                },
                required: ['before', 'after', 'period'],
                additionalProperties: false,
              },
              is_subject_unfamiliar: {
                type: 'boolean',
                description: '독자에게 생소한 기업/지표가 이슈 주인공이면 true',
              },
              cause: {
                type: 'string',
                description: '결과 + 원인 요약 (결과 먼저, 원인 나중에)',
              },
              key_stats: {
                type: 'array',
                items: { type: 'string' },
                description: '핵심 통계 2개 이내 (예: "SK하이닉스 HBM 시장 점유율 57%")',
              },
              compare_available: {
                type: 'boolean',
                description: '비교 데이터(타 국가·기업·지표와 비교)가 있으면 true',
              },
              impact_available: {
                type: 'boolean',
                description: '독자 실생활 비용(환율·물가·금리)에 직접 영향이 있으면 true',
              },
              risks: {
                type: 'array',
                items: { type: 'string' },
                description: '리스크 요인 2개 이내',
              },
              verdict: { type: 'string', description: '결론 한 문장' },
              source_article_indices: {
                type: 'array',
                items: { type: 'number' },
                description: '참조한 기사의 0-based 인덱스 배열',
              },
            },
            required: [
              'topic',
              'archetype',
              'entity_id',
              'entity_name',
              'entity_type',
              'change_value',
              'delta',
              'is_subject_unfamiliar',
              'cause',
              'key_stats',
              'compare_available',
              'impact_available',
              'risks',
              'verdict',
              'source_article_indices',
            ],
            additionalProperties: false,
          },
        },
      },
      required: ['issues'],
      additionalProperties: false,
    },
  }
}

// ── Prompt ────────────────────────────────────────────────────────────────────

function buildExtractPrompt(articles: CollectedArticle[]): string {
  const lines = articles.map((article, index) =>
    [
      `[${index}] ${article.title}`,
      article.summary ? `요약: ${article.summary}` : null,
      article.content ? `내용: ${article.content.slice(0, 200)}` : null,
    ]
      .filter(Boolean)
      .join('\n'),
  )

  return [
    `다음 ${articles.length}건의 기사에서 카드뉴스화할 이슈를 최대 ${MAX_EXTRACTED_ISSUES}개 선정하고, 각 이슈의 핵심 팩트를 구조화하세요.`,
    '',
    '선정 기준:',
    '1. 구체적인 수치(Δ)가 있는 이슈 우선',
    '2. 25~40세 직장인 투자자가 "이거 친구한테 말해야겠다"고 느낄 이슈',
    '3. 오늘만 유효한 뉴스보다 1-2주 유효한 주제 선호',
    '4. 동일 종목·이슈 중복 제거 (대표 1개만)',
    '',
    '아키타입 분류:',
    '- BREAKING: 당일 ±3% 이상 급변동',
    '- EARNINGS: 실적 발표 뉴스',
    '- MACRO: 금리·환율·지수 거시 이슈',
    '- THEME: 섹터·테마·신기술 트렌드',
    '- EDUCATION: 구조·심리 분석, 독자 생소 주제',
    '',
    lines.join('\n\n'),
  ].join('\n')
}

// ── Client ────────────────────────────────────────────────────────────────────

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

function getAnthropicClient(): AnthropicClientLike {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY is required')
  }
  const client = new Anthropic({ apiKey, maxRetries: 0 })
  return client as unknown as AnthropicClientLike
}

// ── Main Function ─────────────────────────────────────────────────────────────

/**
 * 기사 배치에서 구조화된 팩트를 추출합니다.
 *
 * @returns ExtractedFacts + TokenUsage, 또는 실패 시 null
 */
export async function extractFacts(
  articles: CollectedArticle[],
  deps: { anthropic?: AnthropicClientLike } = {},
): Promise<{
  facts: ExtractedFacts | null
  usage: TokenUsage | null
}> {
  if (articles.length === 0) {
    return { facts: null, usage: null }
  }

  const anthropic = deps.anthropic ?? getAnthropicClient()

  try {
    const response = await anthropic.messages.create({
      model: HAIKU_MODEL,
      max_tokens: 2048,
      messages: [{ role: 'user', content: buildExtractPrompt(articles) }],
      tools: [buildExtractToolSchema()],
      tool_choice: { type: 'tool', name: EXTRACT_TOOL_NAME },
    })

    const toolUse = response.content.find(
      (block): block is { type: 'tool_use'; name: string; input: unknown } =>
        block.type === 'tool_use' && block.name === EXTRACT_TOOL_NAME,
    )

    if (!toolUse?.input) {
      return { facts: null, usage: null }
    }

    const parsed = extractedFactsSchema.safeParse(toolUse.input)
    if (!parsed.success) {
      return { facts: null, usage: null }
    }

    const inputTokens = response.usage.input_tokens
    const outputTokens = response.usage.output_tokens
    const usage: TokenUsage = {
      inputTokens,
      outputTokens,
      estimatedCostUsd:
        inputTokens * HAIKU_INPUT_COST_PER_TOKEN + outputTokens * HAIKU_OUTPUT_COST_PER_TOKEN,
    }

    return { facts: parsed.data, usage }
  } catch {
    // 팩트 추출 실패 시 null 반환 — 파이프라인은 계속 진행
    return { facts: null, usage: null }
  }
}
