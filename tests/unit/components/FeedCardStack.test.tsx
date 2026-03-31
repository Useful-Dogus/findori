import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import FeedCardStack from '@/components/features/feed/FeedCardStack'
import type { Card } from '@/types/cards'

const cards: Card[] = [
  {
    id: 1,
    type: 'cover',
    tag: '속보',
    title: '삼성전자 급등',
    sub: '+3.2% · 외국인 순매수',
    visual: {
      bg_from: '#0f172a',
      bg_via: '#1e3a5f',
      bg_to: '#0f172a',
      accent: '#3B82F6',
    },
  },
  {
    id: 2,
    type: 'reason',
    tag: '원인',
    title: 'AI 밸류체인 기대',
    body: '메모리 업황 기대가 확대되며 투자 심리가 개선됐습니다.',
    visual: {
      bg_from: '#0f172a',
      bg_via: '#052e16',
      bg_to: '#0f172a',
      accent: '#22C55E',
    },
    sources: [{ title: '기사', url: 'https://example.com/reason', domain: 'example.com' }],
  },
  {
    id: 3,
    type: 'source',
    tag: '출처',
    sources: [{ title: '원문', url: 'https://example.com/source', domain: 'example.com' }],
    visual: {
      bg_from: '#0f172a',
      bg_via: '#1e293b',
      bg_to: '#0f172a',
      accent: '#94A3B8',
    },
  },
]

describe('FeedCardStack', () => {
  beforeEach(() => {
    Object.defineProperty(navigator, 'sendBeacon', {
      configurable: true,
      value: vi.fn().mockReturnValue(true),
    })
  })

  it('다음/이전 버튼으로 현재 카드를 이동하고 진행 상태를 갱신한다', () => {
    render(<FeedCardStack cards={cards} />)

    expect(screen.getByText('삼성전자 급등')).toBeInTheDocument()
    expect(
      screen.queryByText('좌우로 넘기거나 버튼으로 카드를 이동하세요.'),
    ).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: '이전 카드' })).toBeDisabled()

    fireEvent.click(screen.getByRole('button', { name: '다음 카드' }))

    expect(screen.getByText('AI 밸류체인 기대')).toBeInTheDocument()
    expect(screen.getAllByText('2/3').length).toBeGreaterThan(0)

    fireEvent.click(screen.getByRole('button', { name: '이전 카드' }))

    expect(screen.getByText('삼성전자 급등')).toBeInTheDocument()
  })

  it('좌우 스와이프로 카드를 넘긴다', () => {
    const { container } = render(<FeedCardStack cards={cards} />)
    const swipeSurface = container.querySelector('[data-testid="feed-card-swipe"]')

    expect(swipeSurface).not.toBeNull()

    fireEvent.touchStart(swipeSurface!, {
      changedTouches: [{ clientX: 200 }],
    })
    fireEvent.touchEnd(swipeSurface!, {
      changedTouches: [{ clientX: 80 }],
    })

    expect(screen.getByText('AI 밸류체인 기대')).toBeInTheDocument()

    fireEvent.touchStart(swipeSurface!, {
      changedTouches: [{ clientX: 80 }],
    })
    fireEvent.touchEnd(swipeSurface!, {
      changedTouches: [{ clientX: 180 }],
    })

    expect(screen.getByText('삼성전자 급등')).toBeInTheDocument()
  })
})
