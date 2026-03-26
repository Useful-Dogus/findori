import { PipelineManager } from '@/components/features/admin/PipelineManager'
import { listPipelineLogs } from '@/lib/pipeline'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export default async function AdminPipelinePage() {
  try {
    const client = createAdminClient()
    const { logs, total } = await listPipelineLogs(client, { page: 1, limit: 20 })

    return (
      <section className="space-y-6">
        <div className="space-y-2">
          <p className="text-sm tracking-[0.2em] text-slate-400 uppercase">Pipeline</p>
          <h1 className="text-3xl font-bold text-slate-50">파이프라인 운영</h1>
          <p className="text-sm text-slate-300">
            파이프라인 실행 이력을 확인하고 수동으로 재실행합니다.
          </p>
        </div>
        <PipelineManager initialLogs={logs} initialTotal={total} />
      </section>
    )
  } catch {
    return (
      <section className="space-y-3">
        <h1 className="text-3xl font-bold text-slate-50">파이프라인 운영</h1>
        <div className="rounded-2xl bg-rose-950/40 px-5 py-4 text-sm text-rose-100">
          파이프라인 로그를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.
        </div>
      </section>
    )
  }
}
