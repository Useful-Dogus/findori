import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-foreground text-2xl font-bold">페이지를 찾을 수 없어요</h1>
      <p className="text-muted">요청하신 페이지가 존재하지 않거나 이동되었습니다.</p>
      <Link
        href="/"
        className="bg-accent-blue mt-2 rounded-lg px-6 py-3 text-sm font-medium text-white"
      >
        홈으로 돌아가기
      </Link>
    </div>
  )
}
