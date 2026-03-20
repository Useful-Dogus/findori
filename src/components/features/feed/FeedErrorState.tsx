'use client'

import Link from 'next/link'

export default function FeedErrorState() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 text-center">
      <div className="flex flex-col items-center gap-2">
        <p className="text-2xl">⚠️</p>
        <h1 className="text-foreground text-lg font-semibold">피드를 불러오지 못했습니다</h1>
        <p className="text-muted text-sm">잠시 후 다시 시도해 주세요.</p>
      </div>
      <div className="flex gap-3">
        <button
          onClick={() => window.location.reload()}
          className="bg-accent-blue text-foreground rounded-lg px-5 py-2.5 text-sm font-medium transition-opacity hover:opacity-80"
        >
          다시 시도
        </button>
        <Link
          href="/"
          className="bg-surface text-foreground hover:bg-surface-raised rounded-lg px-5 py-2.5 text-sm font-medium transition-colors"
        >
          홈으로 이동
        </Link>
      </div>
    </div>
  )
}
