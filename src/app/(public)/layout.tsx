import FeedDisclaimer from '@/components/features/feed/FeedDisclaimer'

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto min-h-screen max-w-[960px]">
      <main>{children}</main>
      <FeedDisclaimer />
    </div>
  )
}
