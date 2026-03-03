import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { StatusBadge } from '@/components/features/admin/StatusBadge'

describe('StatusBadge', () => {
  it.each([
    ['draft', '대기', 'bg-gray-100', 'text-gray-600'],
    ['published', '발행', 'bg-blue-100', 'text-blue-700'],
    ['approved', '승인', 'bg-green-100', 'text-green-700'],
    ['rejected', '반려', 'bg-red-100', 'text-red-700'],
  ] as const)('%s 상태를 올바른 텍스트와 스타일로 렌더링한다', (status, label, bg, text) => {
    render(<StatusBadge status={status} />)

    const badge = screen.getByText(label)
    expect(badge).toBeInTheDocument()
    expect(badge).toHaveClass(bg)
    expect(badge).toHaveClass(text)
  })
})
