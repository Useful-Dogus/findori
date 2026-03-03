// 상태 배지 컴포넌트 — Feed/Issue 상태를 색상 배지로 표시 (Server Component)

type FeedStatus = 'draft' | 'published'
type IssueStatus = 'draft' | 'approved' | 'rejected'
type StatusBadgeProps = {
  status: FeedStatus | IssueStatus
}

const STATUS_CONFIG: Record<FeedStatus | IssueStatus, { label: string; className: string }> = {
  draft: {
    label: '대기',
    className: 'bg-gray-100 text-gray-600',
  },
  published: {
    label: '발행',
    className: 'bg-blue-100 text-blue-700',
  },
  approved: {
    label: '승인',
    className: 'bg-green-100 text-green-700',
  },
  rejected: {
    label: '반려',
    className: 'bg-red-100 text-red-700',
  },
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status]

  if (!config) {
    return (
      <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">
        {status}
      </span>
    )
  }

  return (
    <span className={`rounded px-2 py-0.5 text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  )
}
