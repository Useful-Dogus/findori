import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import FeedShareButton from '@/components/features/feed/FeedShareButton'

const shareMock = vi.fn()
const writeTextMock = vi.fn()

describe('FeedShareButton', () => {
  beforeEach(() => {
    shareMock.mockReset()
    writeTextMock.mockReset()

    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { origin: 'https://findori.app' },
    })

    Object.defineProperty(navigator, 'share', {
      configurable: true,
      value: shareMock,
    })

    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: writeTextMock },
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('Web Share API가 있으면 공유 패널을 호출한다', async () => {
    shareMock.mockResolvedValue(undefined)

    render(
      <FeedShareButton
        permalink="https://findori.app/feed/2026-03-20/issue/issue-1"
        title="삼성전자 급등"
        summary="삼성전자 이슈 카드 스트림"
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: '공유' }))

    await waitFor(() =>
      expect(shareMock).toHaveBeenCalledWith({
        title: '삼성전자 급등',
        text: '삼성전자 이슈 카드 스트림',
        url: 'https://findori.app/feed/2026-03-20/issue/issue-1',
      }),
    )

    expect(screen.getByRole('status')).toHaveTextContent('공유 패널을 열었습니다.')
    expect(writeTextMock).not.toHaveBeenCalled()
  })

  it('share가 실패하면 링크 복사 fallback을 시도한다', async () => {
    shareMock.mockRejectedValue(new Error('share failed'))
    writeTextMock.mockResolvedValue(undefined)

    render(
      <FeedShareButton
        permalink="https://findori.app/feed/2026-03-20/issue/issue-1"
        title="삼성전자 급등"
        summary="삼성전자 이슈 카드 스트림"
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: '공유' }))

    await waitFor(() =>
      expect(writeTextMock).toHaveBeenCalledWith(
        'https://findori.app/feed/2026-03-20/issue/issue-1',
      ),
    )

    expect(screen.getByRole('status')).toHaveTextContent('링크를 복사했습니다.')
  })
})
