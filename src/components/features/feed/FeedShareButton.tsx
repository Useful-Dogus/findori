'use client'

import { useState } from 'react'

import { trackFeedEvent } from '@/lib/analytics'

type FeedShareButtonProps = {
  permalink: string
  title: string
  summary: string
  entityType?: string
  entityId?: string
}

type ShareStatus = 'idle' | 'shared' | 'copied' | 'error'

export default function FeedShareButton({
  permalink,
  title,
  summary,
  entityType,
  entityId,
}: FeedShareButtonProps) {
  const [status, setStatus] = useState<ShareStatus>('idle')

  async function copyLink() {
    if (!navigator.clipboard?.writeText) {
      setStatus('error')
      return false
    }

    await navigator.clipboard.writeText(permalink)
    setStatus('copied')
    return true
  }

  async function handleShare() {
    trackFeedEvent({
      event: 'share_clicked',
      entityType,
      entityId,
      url: permalink,
      isLoggedIn: false,
    })

    try {
      if (navigator.share) {
        await navigator.share({
          title,
          text: summary,
          url: permalink,
        })
        setStatus('shared')
        return
      }

      await copyLink()
    } catch {
      try {
        await copyLink()
      } catch {
        setStatus('error')
      }
    }
  }

  const statusMessage =
    status === 'shared'
      ? '공유 패널을 열었습니다.'
      : status === 'copied'
        ? '링크를 복사했습니다.'
        : status === 'error'
          ? '공유 링크를 복사하지 못했습니다.'
          : null

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        type="button"
        onClick={handleShare}
        className="min-h-11 cursor-pointer rounded-full border border-white/12 px-4 py-2 text-sm font-medium text-white/80 transition hover:border-white/30 hover:text-white focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-1 focus-visible:outline-none"
      >
        공유
      </button>
      {statusMessage ? (
        <p className="text-right text-xs text-slate-300" role="status">
          {statusMessage}
        </p>
      ) : null}
    </div>
  )
}
