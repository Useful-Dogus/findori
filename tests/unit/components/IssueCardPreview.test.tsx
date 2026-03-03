import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { IssueListItem } from '@/components/features/admin/IssueListItem'
import type { AdminIssueSummary } from '@/lib/admin/feeds'

const validVisual = {
  bg_from: '#0f172a',
  bg_via: '#1e3a5f',
  bg_to: '#0f172a',
  accent: '#3B82F6',
}

const baseIssue: AdminIssueSummary = {
  id: 'issue-1',
  title: '삼성전자 +3.2% 급등',
  entityName: '삼성전자',
  entityType: 'stock',
  status: 'approved',
  displayOrder: 1,
  cardCount: 3,
  cardsParseError: false,
  cardsData: [
    {
      id: 1,
      type: 'cover',
      tag: '속보',
      title: '삼성전자 급등',
      sub: '+3.2%',
      visual: validVisual,
    },
    {
      id: 2,
      type: 'reason',
      tag: '원인',
      title: '외국인 매수 확대',
      body: '외국인 순매수가 급증했습니다.',
      visual: validVisual,
      sources: [{ title: '기사', url: 'https://example.com', domain: 'example.com' }],
    },
    {
      id: 3,
      type: 'source',
      tag: '출처',
      sources: [{ title: '기사', url: 'https://example.com', domain: 'example.com' }],
      visual: validVisual,
    },
  ],
}

describe('IssueListItem', () => {
  it('아코디언 열기/닫기로 카드 미리보기를 토글한다', () => {
    render(<IssueListItem issue={baseIssue} />)

    expect(screen.queryByText('외국인 매수 확대')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /삼성전자 \+3.2% 급등/ }))

    expect(screen.getByText('외국인 매수 확대')).toBeInTheDocument()
    expect(screen.getByText('example.com')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /삼성전자 \+3.2% 급등/ }))

    expect(screen.queryByText('외국인 매수 확대')).not.toBeInTheDocument()
  })

  it('cardsParseError가 true면 오류 안내를 렌더링한다', () => {
    render(
      <IssueListItem
        issue={{
          ...baseIssue,
          cardsData: null,
          cardCount: 0,
          cardsParseError: true,
        }}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /삼성전자 \+3.2% 급등/ }))

    expect(screen.getByText(/카드 데이터를 해석하지 못했습니다/)).toBeInTheDocument()
  })
})
