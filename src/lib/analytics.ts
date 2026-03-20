export type FeedEventName = 'feed_opened' | 'card_swiped' | 'share_clicked' | 'source_clicked'

export type FeedEventPayload = {
  event: FeedEventName
  entityType?: string
  entityId?: string
  cardIndex?: number
  totalCards?: number
  platform?: 'web'
  isLoggedIn?: boolean
  url?: string
  path?: string
}

export function trackFeedEvent(payload: FeedEventPayload) {
  if (typeof window === 'undefined') {
    return
  }

  const endpoint = new URL('/api/events', window.location.origin).toString()
  const body = JSON.stringify({
    ...payload,
    platform: 'web',
    path: window.location.pathname,
  })

  if (navigator.sendBeacon) {
    const blob = new Blob([body], { type: 'application/json' })
    navigator.sendBeacon(endpoint, blob)
    return
  }

  void fetch(endpoint, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body,
    keepalive: true,
  })
}
