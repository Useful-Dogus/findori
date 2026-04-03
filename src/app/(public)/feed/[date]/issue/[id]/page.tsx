import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import FeedErrorState from '@/components/features/feed/FeedErrorState'
import FeedView from '@/components/features/feed/FeedView'
import {
  getPreviousPublishedDate,
  getPublicFeedByDate,
  getPublicIssueById,
  isValidDate,
} from '@/lib/public/feeds'

// 이슈 상세 페이지도 10분 ISR (SNS 공유 링크의 메타데이터 포함)
export const revalidate = 600

type Params = Promise<{ date: string; id: string }>

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { date, id } = await params

  if (!isValidDate(date)) {
    return { title: '찾을 수 없음 | 핀도리' }
  }

  try {
    const issue = await getPublicIssueById(id)

    if (!issue || issue.feedDate !== date) {
      return { title: '찾을 수 없음 | 핀도리' }
    }

    const formattedDate = date.replace(/-/g, '.')
    const description = [issue.entityName, issue.changeValue, formattedDate]
      .filter(Boolean)
      .join(' · ')

    return {
      title: `${issue.title} | 핀도리`,
      openGraph: {
        title: issue.title,
        description,
        url: `https://findori.app/feed/${date}/issue/${id}`,
        images: [{ url: `/api/og/issue/${id}` }],
      },
    }
  } catch {
    return { title: '핀도리' }
  }
}

export default async function IssueSharePage({ params }: { params: Params }) {
  const { date, id } = await params

  if (!isValidDate(date)) {
    notFound()
  }

  // 이슈 조회
  let issue: Awaited<ReturnType<typeof getPublicIssueById>>

  try {
    issue = await getPublicIssueById(id)
  } catch {
    return <FeedErrorState />
  }

  if (!issue || issue.feedDate !== date) {
    notFound()
  }

  // 해당 날짜 전체 피드 조회 (FeedView에 이슈 목록 전달용)
  let issues: Awaited<ReturnType<typeof getPublicFeedByDate>>['issues']
  let previousDate: string | null = null

  try {
    const result = await getPublicFeedByDate(date)

    if (!result.feed) {
      notFound()
    }

    issues = result.issues
    previousDate = await getPreviousPublishedDate(date)
  } catch {
    return <FeedErrorState />
  }

  return <FeedView date={date} issues={issues} initialIssueId={id} previousDate={previousDate} />
}
