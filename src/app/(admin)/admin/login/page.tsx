'use client'

import { useState, type FormEvent } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

import { cn } from '@/lib/utils'

const STATUS_MESSAGE: Record<string, string> = {
  expired: '세션이 만료되어 다시 로그인해야 합니다.',
  logged_out: '로그아웃되었습니다.',
}

export default function AdminLoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = searchParams.get('next') ?? '/admin'
  const reason = searchParams.get('reason')

  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const statusMessage = reason ? (STATUS_MESSAGE[reason] ?? null) : null

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({ password, next }),
      })

      const body = (await response.json()) as
        | { ok: true; redirect_to: string }
        | { ok: false; error: string }

      if (!response.ok || !body.ok) {
        setError(
          !body.ok && body.error === 'invalid_password'
            ? '비밀번호가 올바르지 않습니다.'
            : '로그인 요청 형식이 올바르지 않습니다.',
        )
        return
      }

      window.location.assign(body.redirect_to)
      router.refresh()
    } catch {
      setError('로그인 요청에 실패했습니다. 다시 시도해주세요.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="bg-surface-raised w-full max-w-sm rounded-xl p-8">
        <h1 className="mb-6 text-center text-xl font-bold">Admin 로그인</h1>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label className="block text-sm font-medium" htmlFor="admin-password">
              비밀번호
            </label>
            <input
              id="admin-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="border-border bg-surface w-full rounded-lg border px-4 py-3 outline-none focus:ring-2"
              disabled={isSubmitting}
              required
            />
          </div>

          {statusMessage ? (
            <p className="rounded-lg bg-slate-700/70 px-3 py-2 text-sm">{statusMessage}</p>
          ) : null}
          {error ? (
            <p className="rounded-lg bg-rose-900/40 px-3 py-2 text-sm text-rose-100">{error}</p>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting || password.length === 0}
            className={cn(
              'w-full rounded-lg px-4 py-3 text-sm font-semibold',
              'bg-white text-slate-950 disabled:cursor-not-allowed disabled:opacity-50',
            )}
          >
            {isSubmitting ? '로그인 중...' : '로그인'}
          </button>
        </form>
      </div>
    </div>
  )
}
