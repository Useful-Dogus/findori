// @vitest-environment node
// 파일시스템 접근이 필요하므로 node 환경에서 실행

import { existsSync } from 'fs'
import { join } from 'path'
import { describe, test, expect } from 'vitest'
import {
  IMAGE_REGISTRY,
  FALLBACK_IMAGE_KEY,
  resolveImageUrl,
  getImageKeysForPrompt,
} from './registry'

const PUBLIC_DIR = join(process.cwd(), 'public')

// ── 정합성: 레지스트리 ↔ 파일시스템 ─────────────────────────────────────

describe('IMAGE_REGISTRY 정합성', () => {
  test('모든 등록 키의 파일이 실제 존재해야 한다', () => {
    const missing: string[] = []
    for (const [key, entry] of Object.entries(IMAGE_REGISTRY)) {
      const fullPath = join(PUBLIC_DIR, entry.path)
      if (!existsSync(fullPath)) {
        missing.push(`${key} → ${entry.path}`)
      }
    }
    expect(missing).toEqual([])
  })

  test('entry.key가 레지스트리 맵 키와 일치해야 한다', () => {
    const mismatches = Object.entries(IMAGE_REGISTRY)
      .filter(([mapKey, entry]) => mapKey !== entry.key)
      .map(([mapKey, entry]) => `map key: "${mapKey}", entry.key: "${entry.key}"`)
    expect(mismatches).toEqual([])
  })

  test('각 entry.path가 /images/cards/로 시작해야 한다', () => {
    const invalid = Object.entries(IMAGE_REGISTRY)
      .filter(([, entry]) => !entry.path.startsWith('/images/cards/'))
      .map(([key, entry]) => `${key} → ${entry.path}`)
    expect(invalid).toEqual([])
  })

  test('중복 path가 없어야 한다', () => {
    const paths = Object.values(IMAGE_REGISTRY).map((e) => e.path)
    const seen = new Set<string>()
    const duplicates: string[] = []
    for (const p of paths) {
      if (seen.has(p)) duplicates.push(p)
      seen.add(p)
    }
    expect(duplicates).toEqual([])
  })
})

// ── FALLBACK ──────────────────────────────────────────────────────────────

describe('FALLBACK_IMAGE_KEY', () => {
  test('레지스트리에 존재해야 한다', () => {
    expect(IMAGE_REGISTRY[FALLBACK_IMAGE_KEY]).toBeDefined()
  })

  test('실제 파일도 존재해야 한다', () => {
    const entry = IMAGE_REGISTRY[FALLBACK_IMAGE_KEY]
    expect(existsSync(join(PUBLIC_DIR, entry.path))).toBe(true)
  })
})

// ── resolveImageUrl ───────────────────────────────────────────────────────

describe('resolveImageUrl', () => {
  test('undefined 입력 → null 반환', () => {
    expect(resolveImageUrl(undefined)).toBeNull()
  })

  test('빈 문자열 입력 → null 반환', () => {
    expect(resolveImageUrl('')).toBeNull()
  })

  test('유효한 키 → 해당 path 반환', () => {
    expect(resolveImageUrl('theme/stock-up')).toBe('/images/cards/theme/stock-up.webp')
  })

  test('알 수 없는 키 → fallback path 반환', () => {
    const fallbackPath = IMAGE_REGISTRY[FALLBACK_IMAGE_KEY].path
    expect(resolveImageUrl('nonexistent/key')).toBe(fallbackPath)
  })
})

// ── getImageKeysForPrompt ─────────────────────────────────────────────────

describe('getImageKeysForPrompt', () => {
  test('비어있지 않은 문자열을 반환해야 한다', () => {
    const result = getImageKeysForPrompt()
    expect(result.length).toBeGreaterThan(0)
  })

  test('모든 키가 출력에 포함되어야 한다', () => {
    const result = getImageKeysForPrompt()
    for (const key of Object.keys(IMAGE_REGISTRY)) {
      expect(result).toContain(key)
    }
  })
})
