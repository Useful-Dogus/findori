// TODO(#16): 공유 링크 SSR 진입 구현

type Params = Promise<{ date: string; id: string }>

export default async function IssueSharePage({ params }: { params: Params }) {
  const { date, id } = await params

  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-muted">
        이슈 로딩 중... ({date} / {id})
      </p>
    </div>
  )
}
