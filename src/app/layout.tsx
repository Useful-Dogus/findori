import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '핀도리 — 오늘의 경제 이슈',
  description: '하루 10분, 오늘 경제에서 꼭 알아야 할 이슈를 카드로 정리해드립니다.',
  openGraph: {
    title: '핀도리 — 오늘의 경제 이슈',
    description: '하루 10분, 오늘 경제에서 꼭 알아야 할 이슈를 카드로 정리해드립니다.',
    images: ['/og-default.png'],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  )
}
