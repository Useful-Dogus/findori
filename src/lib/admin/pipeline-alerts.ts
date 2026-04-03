// 파이프라인 소스 연속 실패 감지 로직
// pipeline_logs.errors 컬럼을 파싱해 소스별 연속 실패 여부를 계산한다.

import type { Json } from '@/types/database.types'
import type { PipelineError } from '@/types/pipeline'

export type SourceFailureAlert = {
  sourceName: string
  consecutiveFailures: number
}

const CONSECUTIVE_FAILURE_THRESHOLD = 2

/**
 * JSON 타입의 errors 컬럼을 PipelineError[] 로 안전하게 파싱한다.
 */
function parseErrors(errors: Json): PipelineError[] {
  if (!Array.isArray(errors)) return []
  return errors.filter(
    (e): e is PipelineError =>
      typeof e === 'object' &&
      e !== null &&
      typeof (e as Record<string, unknown>).source === 'string' &&
      typeof (e as Record<string, unknown>).message === 'string',
  )
}

/**
 * 최근 N개의 파이프라인 로그에서 소스별 연속 실패 횟수를 계산한다.
 *
 * - 로그는 최신순(내림차순)으로 정렬되어 있어야 한다.
 * - 동일 소스에 대해 가장 최근 로그부터 연속으로 오류가 있을 때 카운트한다.
 * - 한 번이라도 오류가 없으면 연속 횟수를 초기화한다.
 * - CONSECUTIVE_FAILURE_THRESHOLD 이상이면 경고로 반환한다.
 */
export function detectSourceFailures(
  logs: Array<{ errors: Json; status: string }>,
): SourceFailureAlert[] {
  // 소스별 연속 실패 횟수 추적
  // null = 아직 성공 기록 없음(카운팅 중), number = 연속 실패 횟수
  const consecutiveCount: Map<string, number> = new Map()
  // 소스별로 연속 체인이 끊겼는지 여부
  const chainBroken: Set<string> = new Set()

  for (const log of logs) {
    const errors = parseErrors(log.errors)
    // 이번 로그에서 오류가 발생한 소스 집합
    const failedSources = new Set(errors.map((e) => e.source))

    // 이번 로그에서 오류가 발생하지 않은 소스는 연속 체인 끊김
    // (단, 체인이 이미 끊긴 소스는 무시)
    for (const [source] of consecutiveCount) {
      if (!chainBroken.has(source) && !failedSources.has(source)) {
        chainBroken.add(source)
      }
    }

    // 이번 로그에서 오류가 있는 소스 카운트
    for (const source of failedSources) {
      if (chainBroken.has(source)) continue
      consecutiveCount.set(source, (consecutiveCount.get(source) ?? 0) + 1)
    }
  }

  const alerts: SourceFailureAlert[] = []
  for (const [sourceName, count] of consecutiveCount) {
    if (!chainBroken.has(sourceName) && count >= CONSECUTIVE_FAILURE_THRESHOLD) {
      alerts.push({ sourceName, consecutiveFailures: count })
    }
  }

  // 연속 실패 횟수 내림차순 정렬
  alerts.sort((a, b) => b.consecutiveFailures - a.consecutiveFailures)
  return alerts
}
