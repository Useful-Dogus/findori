import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import FeedDisclaimer from '@/components/features/feed/FeedDisclaimer'
import FeedView from '@/components/features/feed/FeedView'
import type { PublicIssueSummary } from '@/lib/public/feeds'

const sampleIssue: PublicIssueSummary = {
  id: 'issue-1',
  entityType: 'stock',
  entityId: '005930',
  entityName: '삼성전자',
  title: '삼성전자 급등',
  changeValue: '+3.2%',
  channel: 'v1',
  displayOrder: 1,
  tags: ['반도체', '실적'],
  cardsData: [
    {
      id: 1,
      type: 'cover',
      tag: '속보',
      title: '삼성전자\n오늘 최고 +3.2%',
      sub: '외국인 순매수 확대',
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
      title: '메모리 업황 기대',
      body: '엔비디아 실적 이후 AI 밸류체인 기대가 확대됐습니다.',
      stat: '외국인 순매수 +3,200억',
      visual: {
        bg_from: '#0f172a',
        bg_via: '#052e16',
        bg_to: '#0f172a',
        accent: '#22C55E',
      },
      sources: [
        {
          title: '관련 기사',
          url: 'https://example.com/article',
          domain: 'example.com',
        },
      ],
    },
    {
      id: 3,
      type: 'source',
      tag: '출처',
      sources: [
        {
          title: '원문 보기',
          url: 'https://example.com/source',
          domain: 'example.com',
        },
      ],
      visual: {
        bg_from: '#0f172a',
        bg_via: '#1e293b',
        bg_to: '#0f172a',
        accent: '#94A3B8',
      },
    },
  ],
}

describe('FeedView', () => {
  it('카드 타입별 UI와 출처 링크를 렌더링한다', () => {
    render(<FeedView date="2026-03-20" issues={[sampleIssue]} />)

    expect(screen.getByText('오늘의 이슈 카드 스트림')).toBeInTheDocument()
    expect(screen.getByText('메모리 업황 기대')).toBeInTheDocument()
    expect(screen.getByText('외국인 순매수 +3,200억')).toBeInTheDocument()
    expect(screen.getByText('출처 전체 보기')).toBeInTheDocument()

    const link = screen.getAllByRole('link', { name: /example.com/i })[0]
    expect(link).toHaveAttribute('href', 'https://example.com/article')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('cardsData가 없으면 fallback 안내를 렌더링한다', () => {
    render(
      <FeedView
        date="2026-03-20"
        issues={[
          {
            ...sampleIssue,
            id: 'issue-2',
            title: '카드 없음',
            cardsData: null,
          },
        ]}
      />,
    )

    expect(screen.getByText('카드 데이터를 준비 중입니다.')).toBeInTheDocument()
  })

  it('잘못된 출처 URL은 클릭 가능한 링크 대신 fallback 문구를 렌더링한다', () => {
    const invalidReasonCard = {
      id: 2,
      type: 'reason' as const,
      tag: '원인',
      title: '메모리 업황 기대',
      body: '엔비디아 실적 이후 AI 밸류체인 기대가 확대됐습니다.',
      stat: '외국인 순매수 +3,200억',
      visual: {
        bg_from: '#0f172a',
        bg_via: '#052e16',
        bg_to: '#0f172a',
        accent: '#22C55E',
      },
      sources: [
        {
          title: 'broken',
          url: 'javascript:alert(1)',
          domain: 'bad.example',
        },
      ],
    }

    render(
      <FeedView
        date="2026-03-20"
        issues={[
          {
            ...sampleIssue,
            id: 'issue-3',
            cardsData: [sampleIssue.cardsData![0], invalidReasonCard, sampleIssue.cardsData![2]],
          },
        ]}
      />,
    )

    expect(screen.getByText('링크 확인 필요')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /bad\.example/i })).not.toBeInTheDocument()
  })
})

describe('FeedDisclaimer', () => {
  it('투자 자문 아님 고지를 렌더링한다', () => {
    render(<FeedDisclaimer />)

    expect(
      screen.getByText('본 콘텐츠는 투자 자문이 아닌 정보 제공 목적입니다.'),
    ).toBeInTheDocument()
    expect(screen.getByText('투자 판단과 책임은 이용자 본인에게 있습니다.')).toBeInTheDocument()
  })
})
