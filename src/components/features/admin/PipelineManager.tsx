'use client'

import { useState } from 'react'

import type { PipelineLogRow, PipelineStatus } from '@/types/pipeline'

type Props = {
  initialLogs: PipelineLogRow[]
  initialTotal: number
}

const STATUS_LABEL: Record<PipelineStatus, string> = {
  running: '실행 중',
  success: '성공',
  partial: '부분 성공',
  failed: '실패',
}

const STATUS_CLASS: Record<PipelineStatus, string> = {
  running: 'bg-blue-950/50 text-blue-200',
  success: 'bg-emerald-950/50 text-emerald-200',
  partial: 'bg-amber-950/50 text-amber-200',
  failed: 'bg-rose-950/50 text-rose-200',
}

function formatDuration(startedAt: string, completedAt: string | null) {
  if (!completedAt) return '—'
  const ms = new Date(completedAt).getTime() - new Date(startedAt).getTime()
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(1)}s`
}

export function PipelineManager({ initialLogs, initialTotal }: Props) {
  const [logs, setLogs] = useState(initialLogs)
  const [total, setTotal] = useState(initialTotal)
  const [running, setRunning] = useState(false)
  const [message, setMessage] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null)

  async function handleRun() {
    setRunning(true)
    setMessage(null)

    try {
      const res = await fetch('/api/admin/pipeline/run', { method: 'POST' })
      const body = await res.json()

      if (res.status === 409) {
        setMessage({ kind: 'error', text: '파이프라인이 이미 실행 중입니다.' })
        return
      }

      if (!res.ok) {
        setMessage({ kind: 'error', text: body.message ?? '실행 실패' })
        return
      }

      setMessage({
        kind: 'ok',
        text: `실행 완료 — ${body.date} / 이슈 ${body.issues_created}건 생성`,
      })

      // Refresh log list
      const logsRes = await fetch('/api/admin/pipeline/logs?limit=20')
      if (logsRes.ok) {
        const logsBody = await logsRes.json()
        setLogs(logsBody.logs)
        setTotal(logsBody.total)
      }
    } catch {
      setMessage({ kind: 'error', text: '네트워크 오류가 발생했습니다.' })
    } finally {
      setRunning(false)
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={handleRun}
          disabled={running}
          className="rounded-xl bg-sky-700 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-sky-600 disabled:opacity-60"
        >
          {running ? '실행 중...' : '수동 재실행'}
        </button>
        {message && (
          <p
            className={[
              'rounded-lg px-4 py-2 text-sm',
              message.kind === 'ok'
                ? 'bg-emerald-950/50 text-emerald-200'
                : 'bg-rose-950/50 text-rose-200',
            ].join(' ')}
          >
            {message.text}
          </p>
        )}
      </div>

      <p className="text-sm text-slate-400">최근 {total}건 중 최대 20건 표시</p>

      {logs.length === 0 ? (
        <p className="text-sm text-slate-400">실행 이력이 없습니다.</p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-800">
          <table className="w-full text-sm">
            <thead className="bg-slate-900/60">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-slate-300">날짜</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-300">상태</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-300">트리거</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-300">기사</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-300">이슈</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-300">소요시간</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-300">오류</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {logs.map((log) => {
                const errors = Array.isArray(log.errors) ? log.errors : []
                const status = log.status as PipelineStatus
                return (
                  <tr key={log.id} className="text-slate-200 hover:bg-slate-800/30">
                    <td className="px-4 py-3">{log.date}</td>
                    <td className="px-4 py-3">
                      <span
                        className={[
                          'rounded-full px-2.5 py-0.5 text-xs font-medium',
                          STATUS_CLASS[status],
                        ].join(' ')}
                      >
                        {STATUS_LABEL[status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-400">{log.triggered_by}</td>
                    <td className="px-4 py-3 text-right">{log.articles_collected ?? '—'}</td>
                    <td className="px-4 py-3 text-right">{log.issues_created ?? '—'}</td>
                    <td className="px-4 py-3 text-right text-slate-400">
                      {formatDuration(log.started_at, log.completed_at)}
                    </td>
                    <td className="px-4 py-3">
                      {errors.length === 0 ? (
                        <span className="text-slate-600">—</span>
                      ) : (
                        <span className="text-rose-300">{errors.length}건</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
