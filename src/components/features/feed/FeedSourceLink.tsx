import type { CardSource } from '@/types/cards'

type FeedSourceLinkProps = {
  source: CardSource
}

function isSafeExternalUrl(url: string) {
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'https:' || parsed.protocol === 'http:'
  } catch {
    return false
  }
}

export default function FeedSourceLink({ source }: FeedSourceLinkProps) {
  if (!isSafeExternalUrl(source.url)) {
    return (
      <span className="border-border bg-background/25 inline-flex min-h-11 items-center rounded-full border px-3 py-2 text-left">
        <span className="text-foreground text-xs font-medium">{source.domain}</span>
        <span className="text-muted ml-2 text-xs">링크 확인 필요</span>
      </span>
    )
  }

  return (
    <a
      href={source.url}
      target="_blank"
      rel="noopener noreferrer"
      className="border-border bg-background/25 hover:bg-background/40 inline-flex min-h-11 items-center rounded-full border px-3 py-2 text-left transition-colors"
    >
      <span className="text-foreground text-xs font-medium">{source.domain}</span>
      <span className="text-muted ml-2 text-xs">{source.title}</span>
    </a>
  )
}
