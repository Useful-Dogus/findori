import { SourcesManager } from '@/components/features/admin/SourcesManager'
import { getAdminSources } from '@/lib/admin/sources'

export const dynamic = 'force-dynamic'

export default async function AdminSourcesPage() {
  try {
    const sources = await getAdminSources()

    return (
      <section className="space-y-6">
        <div className="space-y-2">
          <p className="text-sm tracking-[0.2em] text-slate-400 uppercase">Sources</p>
          <h1 className="text-3xl font-bold text-slate-50">화이트리스트 매체 관리</h1>
          <p className="text-sm text-slate-300">
            파이프라인이 RSS를 수집할 매체를 등록하고 활성/비활성을 관리합니다.
          </p>
        </div>
        <SourcesManager initialSources={sources} />
      </section>
    )
  } catch {
    return (
      <section className="space-y-3">
        <h1 className="text-3xl font-bold text-slate-50">화이트리스트 매체 관리</h1>
        <div className="rounded-2xl bg-rose-950/40 px-5 py-4 text-sm text-rose-100">
          매체 목록을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.
        </div>
      </section>
    )
  }
}
