import Anthropic from '@anthropic-ai/sdk'
import { z } from 'zod'

import { parseCards } from '@/lib/cards'
import { getImageKeysForPrompt } from '@/lib/images/registry'
import type { ExtractedFacts } from '@/lib/pipeline/extract'
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

const DEFAULT_MODEL = 'claude-sonnet-4-6'
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
      stop_reason: string | null
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
                        // 기존 타입 (generateContextIssues 호환)
                        'cover',
                        'reason',
                        'bullish',
                        'bearish',
                        'stats',
                        'source',
                        // Phase 2 신규 타입
                        'delta',
                        'delta-intro',
                        'cause',
                        'stat',
                        'compare',
                        'impact',
                        'verdict',
                        'question',
                      ],
                    },
                    tag: { type: 'string' },
                    // 기존 타입 필드
                    title: { type: 'string' },
                    body: { type: 'string' },
                    sub: { type: 'string' },
                    stat: { type: 'string' },
                    // delta / delta-intro 필드
                    before: { type: 'string' },
                    after: { type: 'string' },
                    period: { type: 'string' },
                    context: { type: 'string' },
                    // delta-intro 전용 필드
                    what: { type: 'string' },
                    whatDesc: { type: 'string' },
                    trigger: { type: 'string' },
                    // cause 필드
                    result: { type: 'string' },
                    cause: { type: 'string' },
                    // stat 필드
                    number: { type: 'string' },
                    label: { type: 'string' },
                    reveal: { type: 'string' },
                    // compare 필드
                    q: { type: 'string' },
                    footer: { type: 'string' },
                    // verdict 필드
                    verdict: { type: 'string' },
                    reasons: { type: 'array', items: { type: 'string' } },
                    // question 필드
                    hint: { type: 'string' },
                    visual: {
                      type: 'object',
                      properties: {
                        bg_from: { type: 'string' },
                        bg_via: { type: 'string' },
                        bg_to: { type: 'string' },
                        accent: { type: 'string' },
                        imgCategory: { type: 'string' },
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
                    // stats 카드용 items
                    items: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          label: { type: 'string' },
                          value: { type: 'string' },
                          change: { type: 'string' },
                          // impact 카드용 추가 필드
                          before: { type: 'string' },
                          after: { type: 'string' },
                          diff: { type: 'string' },
                        },
                        required: ['label'],
                        additionalProperties: false,
                      },
                    },
                    // compare 카드용 rows
                    rows: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          label: { type: 'string' },
                          change: { type: 'string' },
                          dir: { type: 'string', enum: ['up', 'down', 'worst'] },
                          note: { type: 'string' },
                        },
                        required: ['label', 'change', 'dir', 'note'],
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

**Δ 우선**: delta/delta-intro의 before·after·period에는 반드시 실제 수치를 넣어라. 빈 문자열 금지.
  "코스피 2,680" 대신 "코스피 +1.8% — 3주 만에 최대 상승"이 더 강하다.

**3줄 압축**: 각 카드의 텍스트 필드는 3줄(80자) 이내. 독자가 5초 안에 읽을 수 있어야 한다. 한 장 = 메시지 1개.

**결과 → 원인**: cause 카드에서 result(결과)를 먼저, cause(원인)를 나중에 배치하라.
  ❌ "이란이 호르무즈 해협을 위협해서... 원화가 떨어졌어요."
  ✅ result: "외국인 자금 1.8조원, 하루 만에 이탈" / cause: "이란이 원유 수송로를 막겠다고 위협했거든요..."

**사실 기반**: 미래 단정 표현 대신 현재 상황과 맥락을 제공하라. "오를 것이다" 대신 "이런 이유로 주목받고 있다". 독자가 스스로 판단할 수 있는 사실과 맥락을 제공하는 것이 목표다.

**말투 금지 패턴**:
  ❌ "~가 아니다. 대신 ~다." (LLM 생성 티가 나는 패턴)
  ❌ "즉," "결국," 접속사 남발 (3회 이상 연속 금지)
  ❌ 어미 혼용 ("~했어요"와 "~했다" 섞기, 하나로 통일)
  ❌ 전문용어 첫 등장 시 설명 없음 (반드시 괄호 설명)

**비교로 신뢰 구축**:
  ❌ "원화만 유독 약세"
  ✅ 유로·파운드 +10% 강세와 원화를 나란히 compare 카드로 비교

## 스토리 아키타입 — 이슈 유형에 따른 카드 시퀀스

이슈 유형을 아래 아키타입 중 하나로 분류하고, 해당 권장 시퀀스를 따르라.

| 아키타입 | 트리거 | 권장 카드 시퀀스 |
|---------|--------|----------------|
| BREAKING | 당일 ±3% 이상 급변동 | delta → cause → stat → verdict → source |
| EARNINGS | 실적 발표 뉴스 | delta → cause → stat → compare → verdict → source |
| MACRO | 금리·환율·지수 거시 이슈 | delta → cause → compare → impact → verdict → source |
| THEME | 섹터·테마·신기술 트렌드 | delta-intro → cause → stat → verdict → source |
| EDUCATION | 구조·심리 분석, 독자 생소 주제 | question → cause → stat → compare → verdict → source |

규칙:
- 비교 데이터가 없으면 compare 카드 생략 가능
- 독자 실생활 영향이 없으면 impact 카드 생략 가능 (단, MACRO에서는 impact 포함하라)
- 독자에게 생소한 주체가 이슈 주인공이면 delta-intro 사용, 아니면 delta 사용
- verdict는 항상 source 바로 앞에 위치
- **community 카드는 절대 생성 금지** (출처 불명 인용문 방지)

## 카드 타입 카탈로그

### delta (수치 변화량 강조)
- 필수 필드: id, type, tag, before, after, period, context, visual
- before/after: 반드시 실제 수치 (빈 문자열 금지)
- period: 기간 표현 (예: "2년 만에", "하루 만에")
- context: 한 문장 해석 (80자 이내)

### delta-intro (낯선 주체 소개 + 변화량)
- 필수 필드: id, type, tag, before, after, period, what, whatDesc, trigger, visual
- what: 주체 이름 / whatDesc: 2문장 이내 설명 / trigger: 지금 주목받는 이유 1문장

### cause (결과 → 원인)
- 필수 필드: id, type, tag, result, cause, sources, visual
- result: 결과 한 줄 (30자 이내) / cause: 원인 설명 (3줄/120자 이내)
- sources: 최소 1개 필수

### stat (단일 통계 강조)
- 필수 필드: id, type, tag, number, label, reveal, sources, visual
- number: 수치 / label: 레이블 / reveal: 상식을 뒤집는 해석 2줄
- sources: 최소 1개 필수

### compare (비교 테이블)
- 필수 필드: id, type, tag, q, rows, footer, visual
- rows: 최소 2개. 각 행: label, change, dir('up'|'down'|'worst'), note
- 'worst'는 이슈의 주인공(가장 나쁜 결과)에 사용

### impact (독자 실생활 영향)
- 필수 필드: id, type, tag, items, visual
- items: 2-4개. 각 항목: label, before, after, diff
- MACRO 아키타입에 포함하라

### verdict (한 문장 결론)
- 필수 필드: id, type, tag, verdict, reasons, visual
- verdict: 결론 한 문장 (50자 이내) / reasons: 근거 2-3개
- **반드시 source 카드 바로 앞에 위치**

### question (다음 카드 연결 훅)
- 필수 필드: id, type, tag, q, hint, visual
- EDUCATION 아키타입의 첫 번째 카드

### source (출처 목록 — 마지막 카드 필수)
- 필수 필드: id, type, tag, sources, visual / 반드시 마지막 카드

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

- cards 배열: 4~7장
- cards[0].type: "delta", "delta-intro", "question" 중 하나
- cards[last].type === "source" (항상 마지막)
- cards[second-to-last].type === "verdict" (source 바로 앞)
- visual 모든 필드: 반드시 hex 코드. Tailwind 클래스 절대 사용 금지.
- cause, stat, reason, bullish, bearish의 sources: 최소 1개 필수
- 각 카드 id: 1부터 순서대로 정수
- 이슈는 최대 ${MAX_ISSUES}개. 가장 흥미롭고 중요한 이슈를 우선 선택하라.
- 투자 권유·유도 표현 절대 금지 (예: "지금 사야 한다", "매수 추천")
- **community 카드 생성 절대 금지**
- 모든 텍스트는 한국어로 작성

## 이미지 카테고리 키

각 카드의 visual 객체에 imgCategory 필드를 선택적으로 포함하라.
카드 내용과 가장 관련성 높은 키를 아래 목록에서 선택하라.

선택 우선순위:
1. 이슈 주체(기업명 등)가 company/ 키에 있으면 해당 키 우선 선택
2. 없으면 theme/ 또는 emotion/ 중 카드 분위기에 맞는 키 선택
3. 환경·증권거래소 이미지가 맥락에 맞으면 env/ 키 선택
4. 수치·금융 상징 이미지는 symbol/ 선택
5. 투자자 행동 장면이 필요하면 action/ 선택

사용 가능한 키 목록:
${getImageKeysForPrompt()}`
}

// T004: buildPrompt 단순화 — 역할/규칙 지시문 제거, 기사 목록만 포함
function buildPrompt(articles: CollectedArticle[], extractedFacts?: ExtractedFacts | null) {
  // 팩트 추출 결과가 있으면 압축된 팩트 + 기사 제목만 전달 (토큰 절약)
  if (extractedFacts && extractedFacts.issues.length > 0) {
    const factLines = extractedFacts.issues.map((issue, i) => {
      const parts = [
        `## 이슈 ${i + 1}: ${issue.topic}`,
        `archetype: ${issue.archetype}`,
        `entity: ${issue.entity_name} (${issue.entity_id}, ${issue.entity_type})`,
        issue.change_value ? `change_value: ${issue.change_value}` : null,
        issue.delta
          ? `delta: ${issue.delta.before} → ${issue.delta.after} (${issue.delta.period})`
          : null,
        `is_subject_unfamiliar: ${issue.is_subject_unfamiliar}`,
        `cause: ${issue.cause}`,
        issue.key_stats.length > 0 ? `key_stats: ${issue.key_stats.join(' | ')}` : null,
        `compare_available: ${issue.compare_available}`,
        `impact_available: ${issue.impact_available}`,
        issue.risks.length > 0 ? `risks: ${issue.risks.join(' | ')}` : null,
        `verdict: ${issue.verdict}`,
        `source_articles: ${issue.source_article_indices.map((idx) => `[${idx}] ${articles[idx]?.title ?? '(unknown)'}`).join(', ')}`,
      ]
      return parts.filter(Boolean).join('\n')
    })

    const articleTitles = articles.map((a, i) => `[${i}] ${a.title} (${a.sourceUrl})`).join('\n')

    return [
      '아래 팩트 구조를 바탕으로 이슈 카드를 생성하세요.',
      '팩트는 기사에서 추출된 핵심 정보입니다. 이를 기반으로 시스템 프롬프트의 아키타입 시퀀스에 맞게 카드를 구성하세요.',
      '',
      factLines.join('\n\n'),
      '',
      '## 참조 기사 목록',
      articleTitles,
    ].join('\n')
  }

  // 팩트 추출 실패 시 기존 방식으로 기사 원문 전달 (fallback)
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

function extractToolInput(
  message: {
    stop_reason: string | null
    content: Array<{
      type: string
      name?: string
      input?: unknown
    }>
  },
) {
  if (message.stop_reason === 'max_tokens') {
    throw new Error(
      'LLM 출력이 max_tokens 한도에 도달해 잘렸습니다. 출력 토큰 한도를 늘리거나 요청을 줄이세요.',
    )
  }

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
      console.error('[generate] issues 파싱 실패. raw:', (input.issues as string).slice(0, 200))
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
    extractedFacts?: ExtractedFacts | null
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
    max_tokens: 16000,
    temperature: 0.7,
    system: buildSystemPrompt(),
    messages: [
      {
        role: 'user',
        content: buildPrompt(articles, deps.extractedFacts),
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
    max_tokens: 16000,
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
