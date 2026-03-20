import { describe, expect, it, vi, beforeEach } from 'vitest'

import { trackFeedEvent } from '@/lib/analytics'

describe('trackFeedEvent', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('sendBeacon이 있으면 beacon으로 이벤트를 전송한다', () => {
    const sendBeaconMock = vi.fn().mockReturnValue(true)
    Object.defineProperty(navigator, 'sendBeacon', {
      configurable: true,
      value: sendBeaconMock,
    })

    trackFeedEvent({ event: 'feed_opened', entityType: 'stock', entityId: '005930' })

    expect(sendBeaconMock).toHaveBeenCalledWith(
      'http://localhost:3000/api/events',
      expect.any(Blob),
    )
  })
})
