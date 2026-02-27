// TODO(#16): SSR 진입 플로우 구현
// TODO(#17): 피드 카드 렌더러 구현

type Params = Promise<{ date: string }>

export default async function FeedDatePage({ params }: { params: Params }) {
  const { date } = await params

  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-muted">피드 로딩 중... ({date})</p>
    </div>
  )
}
