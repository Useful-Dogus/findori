# Contract: Image Registry

**Feature**: 093-image-category-system
**Type**: Internal module interface
**Date**: 2026-03-31

---

## 모듈: `src/lib/images/registry.ts`

### Exports

#### `IMAGE_REGISTRY`
```ts
const IMAGE_REGISTRY: Record<string, ImageEntry>
```
- 38개 키의 전체 이미지 메타데이터 맵
- 키 형식: `"{category}/{name}"` (예: `"theme/stock-up"`, `"company/samsung"`)

#### `FALLBACK_IMAGE_KEY`
```ts
const FALLBACK_IMAGE_KEY = 'theme/growth'
```
- 정의되지 않은 키 또는 null 입력 시 사용되는 기본 키

#### `resolveImageUrl(key)`
```ts
function resolveImageUrl(key: string | undefined): string | null
```
- 입력: 이미지 키 (예: `"company/nvidia"`)
- 반환: public 경로 문자열 (예: `"/images/cards/company/nvidia.webp"`)
- 알 수 없는 키 → fallback 키의 경로 반환 (null 반환 없음)
- undefined 입력 → null 반환 (이미지 없음, gradient만 표시)

#### `getImageKeysForPrompt()`
```ts
function getImageKeysForPrompt(): string
```
- AI 시스템 프롬프트에 삽입할 이미지 키 목록 텍스트를 반환
- 형식: 각 키와 설명을 한 줄씩 나열한 문자열

---

## 사용 예시

```ts
// 렌더러
import { resolveImageUrl } from '@/lib/images/registry'
const imageUrl = resolveImageUrl(card.visual.imgCategory)
// → "/images/cards/theme/stock-up.webp" 또는 fallback URL 또는 null

// 파이프라인 프롬프트 생성
import { getImageKeysForPrompt } from '@/lib/images/registry'
const keysText = getImageKeysForPrompt()
// → "theme/stock-up: 주가 상승\ntheme/stock-down: 주가 하락\n..."
```

---

## 제약 조건

- `path` 값은 반드시 `public/` 하위 경로여야 한다 (Next.js static serving)
- 모든 경로는 `/images/cards/` prefix를 가진다
- 이미지 파일 확장자는 `.webp`로 통일
- 키 추가 시 `IMAGE_REGISTRY`와 `public/images/cards/` 파일 모두 업데이트 필요
