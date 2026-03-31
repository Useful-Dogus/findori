# Implementation Plan: 카드 뉴스 시각 언어 시스템 구축

**Branch**: `093-image-category-system` | **Date**: 2026-03-31 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `specs/093-image-category-system/spec.md`

## Summary

카드 뉴스에 두 가지 핵심 개선을 동시에 적용한다:

1. **이미지 시각 언어**: 38개 키 × 2-3장 = 80-120장의 WebP 이미지 라이브러리를 `/public/images/cards/`에 구축. AI가 카드 생성 시 적합한 이미지 키를 선택하도록 타입·Zod 스키마·프롬프트·렌더러를 업데이트한다.
2. **4:5 고정 카드 크기**: 현재 카드 타입별로 높이가 달라 스크롤이 튀는 문제를 `aspect-[4/5]` CSS로 해결한다.

기존 gradient 기반 카드는 `imgCategory` 없이도 완전히 동작하며, 이미지는 gradient 위에 오버레이 방식으로 합성된다.

## Technical Context

**Language/Version**: TypeScript 5 (strict mode), Next.js 15 App Router
**Primary Dependencies**: Anthropic SDK (`@anthropic-ai/sdk`), Zod, Tailwind CSS v4
**Storage**: `/public/images/cards/` (WebP 정적 파일), DB는 `cards_data` jsonb 컬럼 그대로 사용 (마이그레이션 불필요)
**Testing**: `npm run build` (타입 검사 + 린트 게이트)
**Target Platform**: Vercel (Web App, Mobile-first)
**Project Type**: Web application (Next.js 15 App Router)
**Performance Goals**: 이미지 총합 20MB 이하, 장당 50-150KB (WebP quality ~80)
**Constraints**: 기존 DB 카드 하위 호환 유지 (`imgCategory`는 optional 필드)
**Scale/Scope**: 초기 38개 키 / 80-120장 이미지

## Constitution Check

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Code Quality | PASS | 기존 Zod/TypeScript 패턴 따름. `resolveImageUrl` 단일 책임 모듈로 분리 |
| II. Tests | PASS | `parseCards()` 기존 테스트에 `imgCategory` optional 필드 케이스 추가 |
| III. UX Consistency | PASS | 기존 gradient 유지 + imgCategory optional. `aspect-[4/5]`로 일관성 강화 |
| IV. Performance | PASS | WebP 압축으로 총 20MB 이하. `aspect-ratio` CSS는 렌더링 성능 영향 없음 |
| V. Small & Reversible | PASS | imgCategory는 optional → 기존 카드 전혀 영향 없음. 이미지 파일만 추가 시 rollback 가능 |

## Project Structure

### Documentation (this feature)

```text
specs/093-image-category-system/
├── plan.md              ← 이 파일
├── research.md          ← Phase 0 완료
├── data-model.md        ← Phase 1 완료
├── contracts/
│   └── image-registry.md
└── tasks.md             ← /speckit.tasks 에서 생성
```

### Source Code

```text
public/
└── images/
    └── cards/
        ├── theme/          (8장)   stock-up, stock-down, currency, ai-chip, earnings, warning, growth, consumer
        ├── emotion/        (4장)   fear, fomo, decision, humor
        ├── env/            (4장)   exchange-kr, exchange-us, financial-district, trading-screen
        ├── company/        (15장)  samsung, sk-hynix, hyundai, lg, kakao, naver, apple, nvidia, tesla,
        │                          microsoft, amazon, meta, generic-kr, generic-us, factory
        ├── symbol/         (5장)   cash-krw, cash-usd, gold, chart-up, chart-down
        └── action/         (2장)   investor-phone, investor-analysis

src/
├── types/
│   └── cards.ts            ← CardVisual에 imgCategory?: string 추가
├── lib/
│   ├── cards.ts            ← cardVisualSchema에 imgCategory optional 추가
│   ├── images/
│   │   └── registry.ts     ← 신규: IMAGE_REGISTRY, resolveImageUrl(), getImageKeysForPrompt()
│   └── pipeline/
│       └── generate.ts     ← 시스템 프롬프트 + tool schema에 imgCategory 추가
└── components/
    └── features/
        └── feed/
            └── FeedCardStack.tsx  ← aspect-[4/5] 고정 + 이미지 렌더링 로직
```

**Structure Decision**: Next.js App Router 단일 프로젝트 구조 유지. 이미지 registry는 `src/lib/images/`에 새 하위 모듈로 추가.

## Implementation Phases

### Phase A: 이미지 수집 (선행 작업, 코드와 병행 가능)

이미지를 수집하고 `/public/images/cards/` 하위에 WebP로 변환하여 저장한다.

**수집 기준**:
- 소스: Unsplash / Pexels (무료 상업적 이용 가능 라이선스 확인)
- 포맷: WebP quality 80, 장당 50-150KB 목표
- 크기: 최소 800×1000px (4:5 기준) 이상 원본 → WebP 변환
- 색상 톤: 상승=초록 계열, 하락=빨강 계열, 중립=회색/네이비 계열
- 기업 이미지: 로고 대신 건물·공장·제품 사진 (저작권 안전)
- 초기 목표: 38개 키 각 2-3장 수집 → 대표 1장 선정

**변환 도구**: Squoosh CLI / cwebp
```bash
cwebp -q 80 input.jpg -o output.webp
```

### Phase B: 타입 시스템 (코드 변경 Step 1)

**변경 파일**: `src/types/cards.ts`, `src/lib/cards.ts`

1. `CardVisual`에 `imgCategory?: string` 추가
2. `cardVisualSchema`에 `imgCategory: z.string().optional()` 추가
3. 기존 `parseCards()` 동작 불변 확인 (빌드 게이트)

### Phase C: 이미지 레지스트리 (코드 변경 Step 2)

**신규 파일**: `src/lib/images/registry.ts`

1. `ImageEntry` 타입 정의
2. `IMAGE_REGISTRY` 상수 (38개 키 전체)
3. `resolveImageUrl(key)` — 알 수 없는 키는 `theme/growth` fallback
4. `getImageKeysForPrompt()` — AI 프롬프트용 키 목록 텍스트

### Phase D: AI 파이프라인 업데이트 (코드 변경 Step 3)

**변경 파일**: `src/lib/pipeline/generate.ts`

1. **Tool schema**: `visual` 객체에 `imgCategory: z.string().optional()` 추가
2. **시스템 프롬프트**: Visual Palette Guide 섹션 뒤에 "이미지 카테고리 키" 섹션 추가
   - 38개 키 전체 목록 + 한 줄 설명
   - 선택 지침: 이슈 주체(기업명 등)가 library에 있으면 company/ 우선, 없으면 theme/ 또는 감정으로 선택
   - `visual.imgCategory`에 선택 키 포함 지시

### Phase E: 렌더러 업데이트 (코드 변경 Step 4)

**변경 파일**: `src/components/features/feed/FeedCardStack.tsx`

1. **`cardStyle()` 함수 확장**: `imageUrl` 인자 추가
   - 이미지 있음: `background-image: linear-gradient(...), url(...)` + `backgroundBlendMode: 'multiply'`
   - 이미지 없음: 기존 gradient만 (하위 호환)
2. **카드 컨테이너**: `aspect-[4/5] w-full overflow-hidden` 클래스 추가, 내부 콘텐츠를 `absolute inset-0`으로 배치
3. **텍스트 오버플로우**: 카드 타입별 텍스트 필드에 `line-clamp-*` 적용하여 overflow 방지

## Key Design Decisions

| 결정 | 내용 |
|------|------|
| 이미지+그라디언트 합성 | 이미지 위에 gradient overlay (`backgroundBlendMode: multiply`)로 텍스트 가독성 유지 |
| Fallback 키 | `theme/growth` (중립적 성장 이미지, 범용적으로 적합) |
| 키 네임스페이싱 | `category/name` 형식으로 AI 선택 오류 감소 및 확장성 확보 |
| 4:5 구현 | `aspect-[4/5]` + `overflow-hidden` + `absolute inset-0` 내부 배치 |
| DB 마이그레이션 없음 | `cards_data`가 jsonb이므로 optional 필드 추가만으로 충분 |
