export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto min-h-screen max-w-[960px]">
      {/* TODO(#24): 투자 자문 아님 고지 배너 */}
      <main>{children}</main>
    </div>
  )
}
