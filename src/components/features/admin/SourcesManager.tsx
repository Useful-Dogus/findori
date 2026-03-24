'use client'

import { useState } from 'react'

import type { AdminMediaSource } from '@/lib/admin/sources'

type Props = {
  initialSources: AdminMediaSource[]
}

export function SourcesManager({ initialSources }: Props) {
  const [sources, setSources] = useState(initialSources)
  const [name, setName] = useState('')
  const [rssUrl, setRssUrl] = useState('')
  const [adding, setAdding] = useState(false)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [message, setMessage] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null)

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setAdding(true)
    setMessage(null)

    try {
      const res = await fetch('/api/admin/sources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), rssUrl: rssUrl.trim() }),
      })
      const body = await res.json()

      if (res.status === 409) {
        setMessage({ kind: 'error', text: '이미 등록된 RSS URL입니다.' })
        return
      }

      if (!res.ok) {
        setMessage({ kind: 'error', text: body.error ?? '등록 실패' })
        return
      }

      setSources((prev) => [...prev, body.source as AdminMediaSource])
      setName('')
      setRssUrl('')
      setMessage({ kind: 'ok', text: `"${(body.source as AdminMediaSource).name}" 매체가 등록되었습니다.` })
    } catch {
      setMessage({ kind: 'error', text: '네트워크 오류가 발생했습니다.' })
    } finally {
      setAdding(false)
    }
  }

  async function handleToggle(source: AdminMediaSource) {
    setTogglingId(source.id)
    setMessage(null)

    try {
      const res = await fetch(`/api/admin/sources/${source.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !source.active }),
      })
      const body = await res.json()

      if (!res.ok) {
        setMessage({ kind: 'error', text: body.error ?? '업데이트 실패' })
        return
      }

      const updated = body.source as AdminMediaSource
      setSources((prev) => prev.map((s) => (s.id === updated.id ? updated : s)))
    } catch {
      setMessage({ kind: 'error', text: '네트워크 오류가 발생했습니다.' })
    } finally {
      setTogglingId(null)
    }
  }

  return (
    <div className="space-y-8">
      {/* 매체 추가 폼 */}
      <form onSubmit={handleAdd} className="space-y-4 rounded-2xl border border-slate-800 p-5">
        <p className="text-sm font-semibold text-slate-200">새 매체 등록</p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            type="text"
            placeholder="매체명 (예: 연합인포맥스)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="flex-1 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-sky-500 focus:outline-none"
          />
          <input
            type="url"
            placeholder="RSS URL (https://...)"
            value={rssUrl}
            onChange={(e) => setRssUrl(e.target.value)}
            required
            className="flex-[2] rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-sky-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={adding}
            className="rounded-xl bg-sky-700 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-sky-600 disabled:opacity-60"
          >
            {adding ? '등록 중...' : '등록'}
          </button>
        </div>
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
      </form>

      {/* 매체 목록 */}
      {sources.length === 0 ? (
        <p className="text-sm text-slate-400">등록된 매체가 없습니다.</p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-800">
          <table className="w-full text-sm">
            <thead className="bg-slate-900/60">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-slate-300">매체명</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-300">RSS URL</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-300">등록일</th>
                <th className="px-4 py-3 text-center font-semibold text-slate-300">상태</th>
                <th className="px-4 py-3 text-center font-semibold text-slate-300">활성화</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {sources.map((source) => (
                <tr key={source.id} className="text-slate-200 hover:bg-slate-800/30">
                  <td className="px-4 py-3 font-medium">{source.name}</td>
                  <td className="max-w-xs truncate px-4 py-3 text-slate-400">
                    <a
                      href={source.rssUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-sky-300 hover:underline"
                    >
                      {source.rssUrl}
                    </a>
                  </td>
                  <td className="px-4 py-3 text-slate-400">
                    {new Date(source.createdAt).toLocaleDateString('ko-KR')}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={[
                        'rounded-full px-2.5 py-0.5 text-xs font-medium',
                        source.active
                          ? 'bg-emerald-950/50 text-emerald-200'
                          : 'bg-slate-800 text-slate-400',
                      ].join(' ')}
                    >
                      {source.active ? '활성' : '비활성'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      type="button"
                      disabled={togglingId === source.id}
                      onClick={() => handleToggle(source)}
                      className={[
                        'rounded-lg px-3 py-1.5 text-xs font-medium transition disabled:opacity-60',
                        source.active
                          ? 'bg-rose-950/50 text-rose-200 hover:bg-rose-900/50'
                          : 'bg-emerald-950/50 text-emerald-200 hover:bg-emerald-900/50',
                      ].join(' ')}
                    >
                      {togglingId === source.id
                        ? '처리 중...'
                        : source.active
                          ? '비활성화'
                          : '활성화'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
