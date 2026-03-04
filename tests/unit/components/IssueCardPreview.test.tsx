import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

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
  cardCount: 4,
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
      type: 'community',
      tag: '커뮤니티',
      title: '개미 반응',
      quotes: [{ text: '더 간다', mood: 'bullish' }],
      visual: validVisual,
    },
    {
      id: 4,
      type: 'source',
      tag: '출처',
      sources: [{ title: '기사', url: 'https://example.com', domain: 'example.com' }],
      visual: validVisual,
    },
  ],
}

describe('IssueListItem', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

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

  it('초안 버튼 클릭 시 draft 상태 변경 요청을 보낸다', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ id: 'issue-1', status: 'draft' }),
    })
    vi.stubGlobal('fetch', fetchMock)

    render(<IssueListItem issue={baseIssue} />)

    fireEvent.click(screen.getByRole('button', { name: '초안' }))

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith('/api/admin/issues/issue-1', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'draft' }),
      })
    })
  })

  it('태그가 비어 있어도 source 카드 저장 버튼은 활성화된다', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ id: 'issue-1', cards: baseIssue.cardsData }),
    })
    vi.stubGlobal('fetch', fetchMock)

    render(<IssueListItem issue={baseIssue} />)

    fireEvent.click(screen.getByRole('button', { name: /삼성전자 \+3.2% 급등/ }))
    fireEvent.click(screen.getAllByRole('button', { name: '편집' })[3])
    fireEvent.change(screen.getByLabelText('태그'), {
      target: { value: '' },
    })

    expect(screen.getByRole('button', { name: '저장' })).toBeEnabled()
  })

  it('순서를 저장하지 않은 상태에서 카드 저장은 기존 저장 순서를 유지한다', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ id: 'issue-1', cards: baseIssue.cardsData }),
    })
    vi.stubGlobal('fetch', fetchMock)

    render(<IssueListItem issue={baseIssue} />)

    fireEvent.click(screen.getByRole('button', { name: /삼성전자 \+3.2% 급등/ }))
    fireEvent.click(screen.getByRole('button', { name: 'reason 카드를 아래로 이동' }))
    fireEvent.click(screen.getAllByRole('button', { name: '편집' })[1])
    fireEvent.change(screen.getByLabelText('태그'), {
      target: { value: '커뮤니티 수정' },
    })
    fireEvent.click(screen.getByRole('button', { name: '저장' }))

    await waitFor(() => {
      expect(fetchMock).toHaveBeenLastCalledWith('/api/admin/issues/issue-1', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cards: [
            baseIssue.cardsData?.[0],
            baseIssue.cardsData?.[1],
            {
              ...baseIssue.cardsData?.[2],
              tag: '커뮤니티 수정',
            },
            baseIssue.cardsData?.[3],
          ],
        }),
      })
    })
  })

  it('cover와 source는 고정 위치를 벗어나는 이동 버튼이 비활성화된다', () => {
    render(<IssueListItem issue={baseIssue} />)

    fireEvent.click(screen.getByRole('button', { name: /삼성전자 \+3.2% 급등/ }))

    expect(screen.getByRole('button', { name: 'cover 카드를 아래로 이동' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'source 카드를 위로 이동' })).toBeDisabled()
  })
})
