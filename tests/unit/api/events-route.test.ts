import { describe, expect, it, vi } from 'vitest'

import { POST } from '@/app/api/events/route'

describe('POST /api/events', () => {
  it('유효한 이벤트를 수신하면 ok를 반환한다', async () => {
    const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {})

    const response = await POST(
      new Request('http://localhost/api/events', {
        method: 'POST',
        body: JSON.stringify({ event: 'feed_opened', entityType: 'stock', entityId: '005930' }),
      }),
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ ok: true })
    expect(infoSpy).toHaveBeenCalledWith(
      '[feed-event]',
      expect.objectContaining({ event: 'feed_opened', entityId: '005930' }),
    )
  })

  it('이벤트가 유효하지 않으면 400을 반환한다', async () => {
    const response = await POST(
      new Request('http://localhost/api/events', {
        method: 'POST',
        body: JSON.stringify({ event: 'unknown' }),
      }),
    )

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({ error: 'invalid_event' })
  })
})
