import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import FeedEmptyState from '@/components/features/feed/FeedEmptyState'
import FeedErrorState from '@/components/features/feed/FeedErrorState'
import FeedView from '@/components/features/feed/FeedView'
import { getPublicFeedByDate, isValidDate } from '@/lib/public/feeds'

type Params = Promise<{ date: string }>

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { date } = await params

  if (!isValidDate(date)) {
    return { title: '찾을 수 없음 | 핀도리' }
  }

  const formattedDate = date.replace(/-/g, '.')

  return {
    title: `${formattedDate} 피드 | 핀도리`,
    openGraph: {
      title: `${formattedDate} 이슈 카드 스트림 | 핀도리`,
      description: '오늘의 국내 주식 시장 이슈를 슬라이드로 정리했습니다.',
      url: `https://findori.app/feed/${date}`,
      images: [{ url: '/og-default.png' }],
    },
  }
}

export default async function FeedDatePage({ params }: { params: Params }) {
  const { date } = await params

  if (!isValidDate(date)) {
    notFound()
  }

  let feed: { date: string } | null
  let issues: Awaited<ReturnType<typeof getPublicFeedByDate>>['issues']

  try {
    const result = await getPublicFeedByDate(date)
    feed = result.feed
    issues = result.issues
  } catch {
    return <FeedErrorState />
  }

  if (!feed) {
    return <FeedEmptyState date={date} />
  }

  return <FeedView date={date} issues={issues} />
}
