'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { Route } from 'next'
import { usePathname, useRouter } from 'next/navigation'

import { cn } from '@/lib/utils'

const NAV_ITEMS: Array<{ href: Route; label: string }> = [
  { href: '/admin', label: '피드' },
  { href: '/admin/sources', label: '매체' },
  { href: '/admin/pipeline', label: '파이프라인' },
]

export function AdminNav() {
  const pathname = usePathname()
  const router = useRouter()
  const [pending, setPending] = useState(false)

  async function handleLogout() {
    setPending(true)

    try {
      await fetch('/api/admin/auth/logout', { method: 'POST' })
    } finally {
      window.location.assign('/admin/login?reason=logged_out')
      router.refresh()
    }
  }

  return (
    <header className="border-border bg-surface/95 sticky top-0 z-10 border-b backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
        <div className="space-y-1">
          <p className="text-xs tracking-[0.2em] text-slate-400 uppercase">Findori Admin</p>
          <div className="flex items-center gap-2 text-sm text-slate-300">
            <span>현재 경로</span>
            <code className="rounded bg-slate-900/70 px-2 py-1 text-slate-100">{pathname}</code>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <nav className="flex items-center gap-2">
            {NAV_ITEMS.map((item) => {
              const active =
                pathname === item.href ||
                (item.href !== '/admin' && pathname.startsWith(`${item.href}/`))

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'rounded-full px-3 py-2 text-sm transition',
                    active
                      ? 'bg-white text-slate-950'
                      : 'bg-slate-800 text-slate-200 hover:bg-slate-700',
                  )}
                >
                  {item.label}
                </Link>
              )
            })}
          </nav>
          <button
            type="button"
            onClick={handleLogout}
            disabled={pending}
            className="rounded-full bg-rose-950/70 px-3 py-2 text-sm text-rose-100 transition hover:bg-rose-900 disabled:opacity-60"
          >
            {pending ? '로그아웃 중...' : '로그아웃'}
          </button>
        </div>
      </div>
    </header>
  )
}
