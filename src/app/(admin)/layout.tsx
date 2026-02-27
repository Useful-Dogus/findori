// Admin 레이아웃 — /admin/* 경로 전용
// 인증 게이트는 src/middleware.ts에서 처리

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-surface min-h-screen">
      {/* TODO(#6): Admin 인증/세션 미들웨어 구현 */}
      {/* TODO(#7): Admin 사이드바/네비게이션 */}
      <main>{children}</main>
    </div>
  )
}
