// TODO(#6): Admin 인증/세션/미들웨어 구현

export default function AdminLoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="bg-surface-raised w-full max-w-sm rounded-xl p-8">
        <h1 className="mb-6 text-center text-xl font-bold">Admin 로그인</h1>
        {/* TODO(#6): 비밀번호 입력 폼 + POST /api/admin/auth/login */}
        <p className="text-muted text-center text-sm">로그인 폼 구현 예정</p>
      </div>
    </div>
  )
}
