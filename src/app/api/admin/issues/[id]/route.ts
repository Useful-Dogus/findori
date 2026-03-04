import { NextResponse } from 'next/server'

import { updateIssueCards, updateIssueStatus, IssueNotFoundError } from '@/lib/admin/issues'
import { requireAdminSession } from '@/lib/admin/session'
import { parseCards } from '@/lib/cards'

type Params = Promise<{ id: string }>

const issueStatusValues = ['draft', 'approved', 'rejected'] as const

function isIssueStatus(value: unknown): value is (typeof issueStatusValues)[number] {
  return (
    typeof value === 'string' &&
    issueStatusValues.includes(value as (typeof issueStatusValues)[number])
  )
}

export async function PATCH(request: Request, { params }: { params: Params }) {
  const session = await requireAdminSession(request)
  if (!session.valid) {
    return session.response
  }

  const { id } = await params

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: 'invalid_body', message: 'JSON 요청 본문이 필요합니다' },
      { status: 400 },
    )
  }

  const status =
    body && typeof body === 'object' ? (body as { status?: unknown }).status : undefined

  if (!isIssueStatus(status)) {
    return NextResponse.json(
      { error: 'invalid_body', message: 'status는 draft, approved, rejected 중 하나여야 합니다' },
      { status: 400 },
    )
  }

  try {
    await updateIssueStatus(id, status)
    return NextResponse.json({ id, status }, { status: 200 })
  } catch (error) {
    if (error instanceof IssueNotFoundError) {
      return NextResponse.json({ error: 'not_found' }, { status: 404 })
    }

    return NextResponse.json({ error: 'internal_error' }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: Params }) {
  const session = await requireAdminSession(request)
  if (!session.valid) {
    return session.response
  }

  const { id } = await params

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: 'invalid_body', message: 'JSON 요청 본문이 필요합니다' },
      { status: 400 },
    )
  }

  const cards = body && typeof body === 'object' ? (body as { cards?: unknown }).cards : undefined
  const parseResult = parseCards(cards)

  if (!parseResult.success || parseResult.data === null) {
    const message = parseResult.success
      ? '카드 배열이 필요합니다'
      : (parseResult.errors[0] ?? '유효하지 않은 카드 데이터입니다')

    return NextResponse.json({ error: 'invalid_body', message }, { status: 400 })
  }

  try {
    await updateIssueCards(id, parseResult.data)
    return NextResponse.json({ id, cards: parseResult.data }, { status: 200 })
  } catch (error) {
    if (error instanceof IssueNotFoundError) {
      return NextResponse.json({ error: 'not_found' }, { status: 404 })
    }

    return NextResponse.json({ error: 'internal_error' }, { status: 500 })
  }
}
