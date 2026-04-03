'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

type PublishFeedButtonProps = {
  date: string
  feedStatus: 'draft' | 'published'
}

type ErrorCode = 'not_found' | 'already_published' | 'no_approved_issues' | 'generic'

function getErrorMessage(code: ErrorCode): string {
  switch (code) {
    case 'no_approved_issues':
      return '승인된 이슈가 없습니다. 이슈를 승인한 후 발행해주세요.'
    case 'already_published':
      return '이미 발행된 피드입니다.'
    case 'not_found':
      return '피드를 찾을 수 없습니다.'
    default:
      return '발행에 실패했습니다. 다시 시도해주세요.'
  }
}

export function PublishFeedButton({ date, feedStatus }: PublishFeedButtonProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [errorCode, setErrorCode] = useState<ErrorCode | null>(null)

  const isPublished = feedStatus === 'published'

  async function handlePublish() {
    if (isLoading || isPublished) return

    setIsLoading(true)
    setErrorCode(null)

    try {
      const response = await fetch(`/api/admin/feeds/${date}/publish`, {
        method: 'POST',
      })

      if (response.ok) {
        router.refresh()
        return
      }

      const payload = (await response.json().catch(() => null)) as { error?: string } | null
      const code = payload?.error

      if (code === 'no_approved_issues') {
        setErrorCode('no_approved_issues')
      } else if (code === 'already_published') {
        setErrorCode('already_published')
      } else if (code === 'not_found') {
        setErrorCode('not_found')
      } else {
        setErrorCode('generic')
      }
    } catch {
      setErrorCode('generic')
    } finally {
      setIsLoading(false)
    }
  }

  if (isPublished) {
    return (
      <span className="rounded-lg bg-emerald-900/40 px-3 py-1.5 text-sm font-semibold text-emerald-300">
        발행 완료
      </span>
    )
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        type="button"
        onClick={handlePublish}
        disabled={isLoading}
        className="cursor-pointer rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isLoading ? '발행 중...' : '피드 발행'}
      </button>
      {errorCode ? (
        <p className="max-w-xs text-right text-xs text-rose-300">{getErrorMessage(errorCode)}</p>
      ) : null}
    </div>
  )
}
