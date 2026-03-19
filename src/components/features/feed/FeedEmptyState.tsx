import Link from 'next/link'

type FeedEmptyStateProps = {
  date?: string
}

export default function FeedEmptyState({ date }: FeedEmptyStateProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 text-center">
      <div className="flex flex-col items-center gap-2">
        <p className="text-2xl">📭</p>
        <h1 className="text-foreground text-lg font-semibold">
          {date ? `${date} 피드가 없습니다` : '발행된 피드가 없습니다'}
        </h1>
        <p className="text-muted text-sm">
          {date
            ? '해당 날짜에 발행된 이슈 카드 스트림이 없습니다.'
            : '아직 발행된 이슈 카드 스트림이 없습니다.'}
        </p>
      </div>
      <Link
        href="/"
        className="bg-surface text-foreground hover:bg-surface-raised rounded-lg px-5 py-2.5 text-sm font-medium transition-colors"
      >
        홈으로 이동
      </Link>
    </div>
  )
}
