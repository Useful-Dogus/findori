import Link from 'next/link'

import { IssueList } from '@/components/features/admin/IssueList'
import { PublishFeedButton } from '@/components/features/admin/PublishFeedButton'
import { StatusBadge } from '@/components/features/admin/StatusBadge'
import { getAdminFeedByDate, isValidDate } from '@/lib/admin/feeds'

type Params = Promise<{ date: string }>

export default async function AdminFeedDatePage({ params }: { params: Params }) {
  const { date } = await params

  if (!isValidDate(date)) {
    return (
      <section className="space-y-4">
        <h1 className="text-3xl font-bold text-slate-50">잘못된 날짜 형식</h1>
        <p className="text-sm text-slate-300">날짜 형식은 `YYYY-MM-DD`여야 합니다.</p>
        <Link href="/admin" className="text-sm font-medium text-sky-300 hover:text-sky-200">
          /admin으로 돌아가기
        </Link>
      </section>
    )
  }

  try {
    const { feed, issues } = await getAdminFeedByDate(date)

    if (!feed) {
      return (
        <section className="space-y-4">
          <h1 className="text-3xl font-bold text-slate-50">피드를 찾을 수 없습니다</h1>
          <p className="text-sm text-slate-300">{date}에 해당하는 피드가 없습니다.</p>
          <Link href="/admin" className="text-sm font-medium text-sky-300 hover:text-sky-200">
            피드 목록으로 돌아가기
          </Link>
        </section>
      )
    }

    return (
      <section className="space-y-6">
        <div className="space-y-3">
          <Link href="/admin" className="text-sm font-medium text-sky-300 hover:text-sky-200">
            ← 피드 목록
          </Link>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-bold text-slate-50">{feed.date} 피드</h1>
              <StatusBadge status={feed.status} />
            </div>
            <PublishFeedButton date={feed.date} feedStatus={feed.status} />
          </div>
          <p className="text-sm text-slate-300">이슈 {feed.issueCount}건을 검토할 수 있습니다.</p>
        </div>
        <IssueList issues={issues} />
      </section>
    )
  } catch {
    return (
      <section className="space-y-3">
        <h1 className="text-3xl font-bold text-slate-50">피드 검토</h1>
        <div className="rounded-2xl bg-rose-950/40 px-5 py-4 text-sm text-rose-100">
          이슈 목록을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.
        </div>
      </section>
    )
  }
}
