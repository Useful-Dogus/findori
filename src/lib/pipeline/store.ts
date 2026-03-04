import type { SupabaseClient } from '@supabase/supabase-js'

import type { Database } from '@/types/database.types'
import type { GeneratedIssueDraft } from '@/types/pipeline'

export async function ensureDraftFeed(client: SupabaseClient<Database>, date: string) {
  const { data, error } = await client
    .from('feeds')
    .upsert(
      {
        date,
        status: 'draft',
      },
      { onConflict: 'date' },
    )
    .select('*')
    .single()

  if (error) {
    throw new Error(`피드를 준비하지 못했습니다: ${error.message}`)
  }

  return data
}

export async function insertDraftIssues(
  client: SupabaseClient<Database>,
  feedId: string,
  issues: GeneratedIssueDraft[],
) {
  if (issues.length === 0) {
    return []
  }

  const payload = issues.map((issue, index) => ({
    feed_id: feedId,
    entity_id: issue.entityId,
    entity_name: issue.entityName,
    entity_type: issue.entityType,
    title: issue.title,
    channel: issue.channel,
    status: 'draft',
    cards_data: issue.cards,
    display_order: index,
    change_value: issue.changeValue,
  }))

  const { data, error } = await client.from('issues').insert(payload).select('*')

  if (error) {
    throw new Error(`이슈 초안을 저장하지 못했습니다: ${error.message}`)
  }

  return data
}
