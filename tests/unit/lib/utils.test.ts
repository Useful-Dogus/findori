import { describe, it, expect } from 'vitest'
import { cn } from '@/lib/utils'

describe('cn()', () => {
  it('단일 클래스를 그대로 반환한다', () => {
    expect(cn('text-sm')).toBe('text-sm')
  })

  it('여러 클래스를 공백으로 합친다', () => {
    expect(cn('text-sm', 'font-bold')).toBe('text-sm font-bold')
  })

  it('조건부 클래스를 처리한다', () => {
    expect(cn('text-sm', false && 'font-bold')).toBe('text-sm')
    expect(cn('text-sm', true && 'font-bold')).toBe('text-sm font-bold')
  })

  it('Tailwind 충돌 클래스를 병합한다 (뒤 클래스 우선)', () => {
    expect(cn('text-sm', 'text-lg')).toBe('text-lg')
  })

  it('undefined와 null을 무시한다', () => {
    expect(cn('text-sm', undefined, null)).toBe('text-sm')
  })
})
