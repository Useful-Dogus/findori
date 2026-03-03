// Admin 레이아웃 — /admin/* 경로 전용
// 인증 게이트는 src/middleware.ts에서 처리되고,
// 이 레이아웃은 인증 이후의 화면 컨테이너 역할만 담당한다.

import { AdminNav } from '@/components/features/admin/AdminNav'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-surface min-h-screen">
      <AdminNav />
      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  )
}
