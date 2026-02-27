import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

// Tailwind 클래스 병합 유틸리티
// 조건부 클래스와 중복 클래스 충돌을 해결
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
