import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import FeedEmptyState from '@/components/features/feed/FeedEmptyState'

describe('FeedEmptyState', () => {
  it('이전 발행일이 있으면 재탐색 CTA를 함께 렌더링한다', () => {
    render(<FeedEmptyState date="2026-03-20" previousDate="2026-03-19" />)

    expect(screen.getByText('2026-03-20 피드가 없습니다')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '이전 발행일 보기' })).toHaveAttribute(
      'href',
      '/feed/2026-03-19',
    )
    expect(screen.getByRole('link', { name: '최신 피드 보기' })).toHaveAttribute(
      'href',
      '/feed/latest',
    )
  })
})
