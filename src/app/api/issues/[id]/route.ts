import { NextResponse } from 'next/server'

import { getPublicIssueById } from '@/lib/public/feeds'

type Params = Promise<{ id: string }>

export async function GET(_request: Request, { params }: { params: Params }) {
  const { id } = await params

  try {
    const issue = await getPublicIssueById(id)

    if (issue === null) {
      return NextResponse.json(
        { error: 'not_found', message: '이슈를 찾을 수 없습니다' },
        { status: 404 },
      )
    }

    return NextResponse.json(issue, { status: 200 })
  } catch {
    return NextResponse.json({ error: 'internal_error' }, { status: 500 })
  }
}
