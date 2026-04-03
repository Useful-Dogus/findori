import type { SourceFailureAlert } from '@/lib/admin/pipeline-alerts'

type Props = {
  alerts: SourceFailureAlert[]
}

export function SourceFailureAlertBanner({ alerts }: Props) {
  if (alerts.length === 0) return null

  return (
    <div className="rounded-2xl border border-amber-800/50 bg-amber-950/40 px-5 py-4">
      <div className="flex items-start gap-3">
        <svg
          className="mt-0.5 h-5 w-5 shrink-0 text-amber-400"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
            clipRule="evenodd"
          />
        </svg>
        <div className="space-y-1.5">
          <p className="text-sm font-semibold text-amber-200">
            소스 연속 실패 감지 — {alerts.length}개 소스
          </p>
          <ul className="space-y-1">
            {alerts.map((alert) => (
              <li key={alert.sourceName} className="text-sm text-amber-300">
                <span className="font-medium">{alert.sourceName}</span>
                <span className="text-amber-400/80">
                  {' '}
                  — {alert.consecutiveFailures}일 연속 오류
                </span>
              </li>
            ))}
          </ul>
          <p className="text-xs text-amber-500">
            RSS 수집 오류가 2일 이상 지속되고 있습니다. 소스 URL 또는 피드 상태를 확인하세요.
          </p>
        </div>
      </div>
    </div>
  )
}
