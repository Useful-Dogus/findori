// Admin 레이아웃 — /admin/* 경로 전용
// 인증 게이트는 src/middleware.ts에서 처리되고,
// 이 레이아웃은 인증 이후의 화면 컨테이너 역할만 담당한다.

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-surface min-h-screen">
      {/* TODO(#7): Admin 사이드바/네비게이션 */}
      <main>{children}</main>
    </div>
  )
}
