'use client'

import Link from 'next/link'

type FeedEmptyStateProps = {
  date?: string
  previousDate?: string | null
}

export default function FeedEmptyState({ date, previousDate }: FeedEmptyStateProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 text-center">
      <div className="flex flex-col items-center gap-2">
        <p className="text-2xl" role="img" aria-label="빈 피드">
          📭
        </p>
        <h1 className="text-foreground text-lg font-semibold">
          {date ? `${date} 피드가 없습니다` : '발행된 피드가 없습니다'}
        </h1>
        <p className="text-muted text-sm">
          {date
            ? '해당 날짜에 발행된 이슈 카드 스트림이 없습니다.'
            : '아직 발행된 이슈 카드 스트림이 없습니다.'}
        </p>
      </div>
      <div className="flex flex-wrap justify-center gap-3">
        <button
          onClick={() => window.location.reload()}
          className="bg-accent-blue text-foreground cursor-pointer rounded-lg px-5 py-2.5 text-sm font-medium transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
        >
          재시도
        </button>
        {previousDate ? (
          <Link
            href={`/feed/${previousDate}`}
            className="bg-surface text-foreground hover:bg-surface-raised rounded-lg px-5 py-2.5 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            이전 발행일 보기
          </Link>
        ) : null}
        <Link
          href="/feed/latest"
          className="bg-surface text-foreground hover:bg-surface-raised rounded-lg px-5 py-2.5 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
        >
          최신 피드 보기
        </Link>
        <Link
          href="/"
          className="bg-surface text-foreground hover:bg-surface-raised rounded-lg px-5 py-2.5 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
        >
          홈으로 이동
        </Link>
      </div>
    </div>
  )
}
