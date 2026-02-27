// TODO(#7): Admin 날짜별 이슈 검토 화면 구현

type Params = Promise<{ date: string }>

export default async function AdminFeedDatePage({ params }: { params: Params }) {
  const { date } = await params

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold">피드 검토 — {date}</h1>
      <p className="text-muted mt-2">이슈 목록 및 검토 화면 (구현 예정)</p>
    </div>
  )
}
