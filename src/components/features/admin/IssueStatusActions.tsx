'use client'

type IssueStatusActionsProps = {
  currentStatus: 'draft' | 'approved' | 'rejected'
  disabled?: boolean
  onStatusChange: (status: 'draft' | 'approved' | 'rejected') => void
}

function getButtonClassName(active: boolean, palette: 'slate' | 'emerald' | 'rose') {
  const base =
    'cursor-pointer rounded-lg px-3 py-1.5 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50'

  if (palette === 'emerald') {
    return `${base} ${active ? 'bg-emerald-500 text-white' : 'bg-emerald-600 text-white hover:bg-emerald-500'}`
  }

  if (palette === 'rose') {
    return `${base} ${active ? 'bg-rose-600 text-white' : 'bg-rose-700 text-white hover:bg-rose-600'}`
  }

  return `${base} ${
    active
      ? 'bg-slate-200 text-slate-950'
      : 'border border-slate-600 bg-slate-900 text-slate-200 hover:bg-slate-800'
  }`
}

export function IssueStatusActions({
  currentStatus,
  disabled = false,
  onStatusChange,
}: IssueStatusActionsProps) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => onStatusChange('draft')}
        disabled={disabled || currentStatus === 'draft'}
        className={getButtonClassName(currentStatus === 'draft', 'slate')}
      >
        초안
      </button>
      <button
        type="button"
        onClick={() => onStatusChange('approved')}
        disabled={disabled || currentStatus === 'approved'}
        className={getButtonClassName(currentStatus === 'approved', 'emerald')}
      >
        승인
      </button>
      <button
        type="button"
        onClick={() => onStatusChange('rejected')}
        disabled={disabled || currentStatus === 'rejected'}
        className={getButtonClassName(currentStatus === 'rejected', 'rose')}
      >
        반려
      </button>
    </div>
  )
}
