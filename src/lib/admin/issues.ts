import { createAdminClient } from '@/lib/supabase/admin'
import type { Card } from '@/types/cards'

export class IssueNotFoundError extends Error {
  constructor(id: string) {
    super(`issue not found: ${id}`)
    this.name = 'IssueNotFoundError'
  }
}

export async function updateIssueStatus(
  id: string,
  status: 'draft' | 'approved' | 'rejected',
): Promise<void> {
  const client = createAdminClient()
  const { data, error } = await client
    .from('issues')
    .update({ status })
    .eq('id', id)
    .select('id')
    .maybeSingle()

  if (error) {
    throw new Error(`status 업데이트 실패: ${error.message}`)
  }

  if (!data) {
    throw new IssueNotFoundError(id)
  }
}

export async function updateIssueCards(id: string, cards: Card[]): Promise<void> {
  const client = createAdminClient()
  const { data, error } = await client
    .from('issues')
    .update({ cards_data: cards })
    .eq('id', id)
    .select('id')
    .maybeSingle()

  if (error) {
    throw new Error(`cards 업데이트 실패: ${error.message}`)
  }

  if (!data) {
    throw new IssueNotFoundError(id)
  }
}
