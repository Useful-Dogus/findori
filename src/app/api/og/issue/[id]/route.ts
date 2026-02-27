// TODO(#25): Satori로 동적 OG 이미지 생성 구현

import { NextResponse } from 'next/server'

type Params = Promise<{ id: string }>

export async function GET(_request: Request, { params }: { params: Params }) {
  await params // id는 향후 OG 이미지 생성 시 사용

  // Stub: 기본 OG 이미지로 리다이렉트
  return NextResponse.redirect(new URL('/og-default.png', _request.url))
}
