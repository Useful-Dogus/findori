import { createElement } from 'react'

import { ImageResponse } from 'next/og'
import { NextResponse } from 'next/server'

import { getPublicIssueById } from '@/lib/public/feeds'
import type { Card, CardVisual } from '@/types/cards'

type Params = Promise<{ id: string }>

function getVisual(cards: Card[] | null): CardVisual {
  const fallback = {
    bg_from: '#0f172a',
    bg_via: '#172554',
    bg_to: '#020617',
    accent: '#38bdf8',
  }

  if (!cards || cards.length === 0) {
    return fallback
  }

  return cards[0]?.visual ?? fallback
}

function getSummary(cards: Card[] | null) {
  if (!cards || cards.length === 0) {
    return '오늘의 이슈 카드 스트림'
  }

  const explanationCard = cards.find(
    (card) => card.type === 'reason' || card.type === 'bullish' || card.type === 'bearish',
  )

  if (explanationCard && 'body' in explanationCard) {
    return explanationCard.body
  }

  const coverCard = cards.find((card) => card.type === 'cover')
  if (coverCard && 'sub' in coverCard) {
    return coverCard.sub
  }

  return '오늘의 이슈 카드 스트림'
}

export async function GET(request: Request, { params }: { params: Params }) {
  const { id } = await params

  try {
    const issue = await getPublicIssueById(id)

    if (!issue) {
      return NextResponse.redirect(new URL('/og-default.png', request.url))
    }

    const visual = getVisual(issue.cardsData)
    const summary = getSummary(issue.cardsData)

    const tree = createElement(
      'div',
      {
        style: {
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '56px',
          color: 'white',
          backgroundImage: `linear-gradient(160deg, ${visual.bg_from} 0%, ${visual.bg_via} 55%, ${visual.bg_to} 100%)`,
          fontFamily: 'Pretendard, Inter, Apple SD Gothic Neo, Noto Sans KR, sans-serif',
        },
      },
      createElement(
        'div',
        {
          style: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
          },
        },
        createElement(
          'div',
          {
            style: {
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              maxWidth: '760px',
            },
          },
          createElement(
            'div',
            {
              style: {
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                fontSize: '24px',
                opacity: 0.86,
              },
            },
            createElement('span', null, issue.entityName),
            createElement(
              'span',
              {
                style: {
                  display: 'flex',
                  padding: '8px 16px',
                  borderRadius: '999px',
                  background: `${visual.accent}33`,
                  color: visual.accent,
                  fontWeight: 700,
                },
              },
              issue.changeValue ?? '오늘의 이슈',
            ),
          ),
          createElement(
            'div',
            {
              style: {
                display: 'flex',
                fontSize: '64px',
                lineHeight: 1.18,
                fontWeight: 800,
                letterSpacing: '-0.04em',
                whiteSpace: 'pre-wrap',
              },
            },
            issue.title,
          ),
        ),
        createElement(
          'div',
          {
            style: {
              display: 'flex',
              padding: '12px 20px',
              borderRadius: '999px',
              border: `1px solid ${visual.accent}66`,
              fontSize: '20px',
              color: '#e2e8f0',
            },
          },
          'Findori',
        ),
      ),
      createElement(
        'div',
        {
          style: {
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          },
        },
        createElement(
          'div',
          {
            style: {
              display: 'flex',
              width: '100%',
              height: '6px',
              borderRadius: '999px',
              background: 'rgba(255,255,255,0.12)',
            },
          },
          createElement('div', {
            style: {
              display: 'flex',
              width: '42%',
              borderRadius: '999px',
              background: visual.accent,
            },
          }),
        ),
        createElement(
          'div',
          {
            style: {
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
              gap: '24px',
            },
          },
          createElement(
            'div',
            {
              style: {
                display: 'flex',
                maxWidth: '820px',
                fontSize: '28px',
                lineHeight: 1.45,
                color: '#e2e8f0',
              },
            },
            summary,
          ),
          createElement(
            'div',
            {
              style: {
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-end',
                gap: '10px',
                fontSize: '20px',
                color: '#cbd5e1',
              },
            },
            createElement('span', null, issue.feedDate),
            createElement('span', null, '오늘의 경제 이슈'),
          ),
        ),
      ),
    )

    // OG 이미지는 발행 후 변경되지 않으므로 24시간 캐시
    return new ImageResponse(tree, {
      width: 1200,
      height: 630,
      headers: {
        'Cache-Control': 's-maxage=86400, stale-while-revalidate=604800',
      },
    })
  } catch {
    return NextResponse.redirect(new URL('/og-default.png', request.url))
  }
}
