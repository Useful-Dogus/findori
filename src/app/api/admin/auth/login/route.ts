// TODO(#6): Admin 인증 구현

import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { password } = await request.json()

  if (password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'invalid_password' }, { status: 401 })
  }

  // TODO(#6): httpOnly 세션 쿠키 발급
  return NextResponse.json({ ok: true }, { status: 200 })
}
