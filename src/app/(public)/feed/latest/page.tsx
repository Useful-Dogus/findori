import { redirect } from 'next/navigation'

import FeedEmptyState from '@/components/features/feed/FeedEmptyState'
import FeedErrorState from '@/components/features/feed/FeedErrorState'
import { getLatestPublishedDate } from '@/lib/public/feeds'

export default async function FeedLatestPage() {
  let date: string | null

  try {
    date = await getLatestPublishedDate()
  } catch {
    return <FeedErrorState />
  }

  if (!date) {
    return <FeedEmptyState />
  }

  redirect(`/feed/${date}`)
}
