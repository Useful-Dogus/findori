import type { AdminIssueSummary } from '@/lib/admin/feeds'

import { IssueListItem } from './IssueListItem'

type IssueListProps = {
  issues: AdminIssueSummary[]
}

export function IssueList({ issues }: IssueListProps) {
  if (issues.length === 0) {
    return (
      <div className="bg-surface-raised border-border rounded-2xl border px-5 py-8 text-center text-sm text-slate-300">
        이 날짜에는 등록된 이슈가 없습니다.
      </div>
    )
  }

  return (
    <ul className="space-y-3">
      {issues.map((issue) => (
        <IssueListItem key={issue.id} issue={issue} />
      ))}
    </ul>
  )
}
