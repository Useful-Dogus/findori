import { DraftFeedAlert } from '@/components/features/admin/DraftFeedAlert'
import { FeedList } from '@/components/features/admin/FeedList'
import { getAdminFeeds } from '@/lib/admin/feeds'

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  try {
    const feeds = await getAdminFeeds()

    return (
      <section className="space-y-6">
        <div className="space-y-2">
          <p className="text-sm tracking-[0.2em] text-slate-400 uppercase">Feed Review</p>
          <h1 className="text-3xl font-bold text-slate-50">날짜별 피드 검토</h1>
          <p className="text-sm text-slate-300">
            최신 피드부터 확인하고 날짜별 이슈 검토 화면으로 이동합니다.
          </p>
        </div>
        <DraftFeedAlert feeds={feeds} />
        <FeedList feeds={feeds} />
      </section>
    )
  } catch {
    return (
      <section className="space-y-3">
        <h1 className="text-3xl font-bold text-slate-50">날짜별 피드 검토</h1>
        <div className="rounded-2xl bg-rose-950/40 px-5 py-4 text-sm text-rose-100">
          피드 목록을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.
        </div>
      </section>
    )
  }
}
