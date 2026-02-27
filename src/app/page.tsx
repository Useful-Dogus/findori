import { redirect } from 'next/navigation'

export default function HomePage() {
  // 최신 발행 피드 날짜로 리다이렉트
  // TODO(#15): /api/feeds/latest 구현 후 동적 날짜로 교체
  redirect('/feed/latest')
}
