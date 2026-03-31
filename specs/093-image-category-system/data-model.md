# Data Model: 카드 뉴스 시각 언어 시스템

**Feature**: 093-image-category-system
**Phase**: 1 — Design
**Date**: 2026-03-31

---

## 1. 변경되는 타입: `CardVisual`

**파일**: `src/types/cards.ts`

```ts
// Before
export type CardVisual = {
  bg_from: string
  bg_via: string
  bg_to: string
  accent: string
}

// After
export type CardVisual = {
  bg_from: string
  bg_via: string
  bg_to: string
  accent: string
  imgCategory?: string  // 이미지 라이브러리 키. 예: "theme/stock-up", "company/samsung"
}
```

- `imgCategory`는 옵셔널. 기존 카드는 undefined → gradient만 표시.
- 값은 `IMAGE_REGISTRY`에 정의된 키여야 하지만, 런타임 오류 대신 fallback 처리.

---

## 2. 변경되는 스키마: `cardVisualSchema`

**파일**: `src/lib/cards.ts`

```ts
// Before
const cardVisualSchema = z.object({
  bg_from: hexColorSchema,
  bg_via: hexColorSchema,
  bg_to: hexColorSchema,
  accent: hexColorSchema,
})

// After
const cardVisualSchema = z.object({
  bg_from: hexColorSchema,
  bg_via: hexColorSchema,
  bg_to: hexColorSchema,
  accent: hexColorSchema,
  imgCategory: z.string().optional(),  // 검증은 런타임 registry 조회에서 수행
})
```

---

## 3. 신규 엔티티: `ImageEntry`

**파일**: `src/lib/images/registry.ts`

```ts
export type ImageCategory =
  | 'theme'
  | 'emotion'
  | 'env'
  | 'company'
  | 'symbol'
  | 'action'

export type ImageEntry = {
  key: string           // 예: "theme/stock-up"
  category: ImageCategory
  description: string   // AI 프롬프트에 제공되는 한 줄 설명
  path: string          // 예: "/images/cards/theme/stock-up.webp"
}
```

---

## 4. 신규 엔티티: `IMAGE_REGISTRY`

**파일**: `src/lib/images/registry.ts`

```ts
export const IMAGE_REGISTRY: Record<string, ImageEntry> = {
  // theme (8)
  'theme/stock-up':    { key: 'theme/stock-up',    category: 'theme',   description: '주가 상승', path: '/images/cards/theme/stock-up.webp' },
  'theme/stock-down':  { key: 'theme/stock-down',  category: 'theme',   description: '주가 하락', path: '/images/cards/theme/stock-down.webp' },
  'theme/currency':    { key: 'theme/currency',    category: 'theme',   description: '환율',     path: '/images/cards/theme/currency.webp' },
  'theme/ai-chip':     { key: 'theme/ai-chip',     category: 'theme',   description: 'AI·반도체', path: '/images/cards/theme/ai-chip.webp' },
  'theme/earnings':    { key: 'theme/earnings',    category: 'theme',   description: '실적발표', path: '/images/cards/theme/earnings.webp' },
  'theme/warning':     { key: 'theme/warning',     category: 'theme',   description: '경고·리스크', path: '/images/cards/theme/warning.webp' },
  'theme/growth':      { key: 'theme/growth',      category: 'theme',   description: '성장·확장', path: '/images/cards/theme/growth.webp' },
  'theme/consumer':    { key: 'theme/consumer',    category: 'theme',   description: '소비·유통', path: '/images/cards/theme/consumer.webp' },
  // emotion (4)
  'emotion/fear':      { key: 'emotion/fear',      category: 'emotion', description: '공포·불안 (시장 급락)', path: '/images/cards/emotion/fear.webp' },
  'emotion/fomo':      { key: 'emotion/fomo',      category: 'emotion', description: 'FOMO·기대 (급등 기회)', path: '/images/cards/emotion/fomo.webp' },
  'emotion/decision':  { key: 'emotion/decision',  category: 'emotion', description: '결정의 순간 (매수/매도)', path: '/images/cards/emotion/decision.webp' },
  'emotion/humor':     { key: 'emotion/humor',     category: 'emotion', description: '유머·공감 (투자자 일상)', path: '/images/cards/emotion/humor.webp' },
  // env (4)
  'env/exchange-kr':         { key: 'env/exchange-kr',         category: 'env', description: '한국거래소·여의도 금융가', path: '/images/cards/env/exchange-kr.webp' },
  'env/exchange-us':         { key: 'env/exchange-us',         category: 'env', description: 'NYSE·NASDAQ·월스트리트', path: '/images/cards/env/exchange-us.webp' },
  'env/financial-district':  { key: 'env/financial-district',  category: 'env', description: '도심 금융가·빌딩숲', path: '/images/cards/env/financial-district.webp' },
  'env/trading-screen':      { key: 'env/trading-screen',      category: 'env', description: '주식 거래 화면·전광판', path: '/images/cards/env/trading-screen.webp' },
  // company (15)
  'company/samsung':    { key: 'company/samsung',    category: 'company', description: '삼성전자', path: '/images/cards/company/samsung.webp' },
  'company/sk-hynix':   { key: 'company/sk-hynix',   category: 'company', description: 'SK하이닉스', path: '/images/cards/company/sk-hynix.webp' },
  'company/hyundai':    { key: 'company/hyundai',    category: 'company', description: '현대차', path: '/images/cards/company/hyundai.webp' },
  'company/lg':         { key: 'company/lg',         category: 'company', description: 'LG', path: '/images/cards/company/lg.webp' },
  'company/kakao':      { key: 'company/kakao',      category: 'company', description: '카카오', path: '/images/cards/company/kakao.webp' },
  'company/naver':      { key: 'company/naver',      category: 'company', description: '네이버', path: '/images/cards/company/naver.webp' },
  'company/apple':      { key: 'company/apple',      category: 'company', description: '애플', path: '/images/cards/company/apple.webp' },
  'company/nvidia':     { key: 'company/nvidia',     category: 'company', description: '엔비디아', path: '/images/cards/company/nvidia.webp' },
  'company/tesla':      { key: 'company/tesla',      category: 'company', description: '테슬라', path: '/images/cards/company/tesla.webp' },
  'company/microsoft':  { key: 'company/microsoft',  category: 'company', description: '마이크로소프트', path: '/images/cards/company/microsoft.webp' },
  'company/amazon':     { key: 'company/amazon',     category: 'company', description: '아마존', path: '/images/cards/company/amazon.webp' },
  'company/meta':       { key: 'company/meta',       category: 'company', description: '메타', path: '/images/cards/company/meta.webp' },
  'company/generic-kr': { key: 'company/generic-kr', category: 'company', description: '한국 일반 기업·건물 (인지도 낮은 기업 대체)', path: '/images/cards/company/generic-kr.webp' },
  'company/generic-us': { key: 'company/generic-us', category: 'company', description: '미국 일반 기업·건물', path: '/images/cards/company/generic-us.webp' },
  'company/factory':    { key: 'company/factory',    category: 'company', description: '공장·제조시설', path: '/images/cards/company/factory.webp' },
  // symbol (5)
  'symbol/cash-krw':    { key: 'symbol/cash-krw',    category: 'symbol', description: '원화·지폐', path: '/images/cards/symbol/cash-krw.webp' },
  'symbol/cash-usd':    { key: 'symbol/cash-usd',    category: 'symbol', description: '달러·환전', path: '/images/cards/symbol/cash-usd.webp' },
  'symbol/gold':        { key: 'symbol/gold',        category: 'symbol', description: '금·귀금속', path: '/images/cards/symbol/gold.webp' },
  'symbol/chart-up':    { key: 'symbol/chart-up',    category: 'symbol', description: '상승 차트 그래픽', path: '/images/cards/symbol/chart-up.webp' },
  'symbol/chart-down':  { key: 'symbol/chart-down',  category: 'symbol', description: '하락 차트 그래픽', path: '/images/cards/symbol/chart-down.webp' },
  // action (2)
  'action/investor-phone':    { key: 'action/investor-phone',    category: 'action', description: '스마트폰으로 투자 앱 확인', path: '/images/cards/action/investor-phone.webp' },
  'action/investor-analysis': { key: 'action/investor-analysis', category: 'action', description: '투자자 분석·고민 장면', path: '/images/cards/action/investor-analysis.webp' },
}

export const FALLBACK_IMAGE_KEY = 'theme/growth'

export function resolveImageUrl(key: string | undefined): string | null {
  if (!key) return null
  const entry = IMAGE_REGISTRY[key] ?? IMAGE_REGISTRY[FALLBACK_IMAGE_KEY]
  return entry.path
}
```

---

## 5. 이미지 파일 구조

**위치**: `public/images/cards/`

```text
public/images/cards/
├── theme/
│   ├── stock-up.webp
│   ├── stock-down.webp
│   ├── currency.webp
│   ├── ai-chip.webp
│   ├── earnings.webp
│   ├── warning.webp
│   ├── growth.webp           ← fallback 기본 이미지
│   └── consumer.webp
├── emotion/
│   ├── fear.webp
│   ├── fomo.webp
│   ├── decision.webp
│   └── humor.webp
├── env/
│   ├── exchange-kr.webp
│   ├── exchange-us.webp
│   ├── financial-district.webp
│   └── trading-screen.webp
├── company/
│   ├── samsung.webp
│   ├── sk-hynix.webp
│   ├── hyundai.webp
│   ├── lg.webp
│   ├── kakao.webp
│   ├── naver.webp
│   ├── apple.webp
│   ├── nvidia.webp
│   ├── tesla.webp
│   ├── microsoft.webp
│   ├── amazon.webp
│   ├── meta.webp
│   ├── generic-kr.webp
│   ├── generic-us.webp
│   └── factory.webp
├── symbol/
│   ├── cash-krw.webp
│   ├── cash-usd.webp
│   ├── gold.webp
│   ├── chart-up.webp
│   └── chart-down.webp
└── action/
    ├── investor-phone.webp
    └── investor-analysis.webp
```

총 키: 38개 (초기 1장/키 = 38장. 키당 2-3개 수집 시 76-114장 → 80-120장 목표)

---

## 6. 카드 컨테이너 레이아웃 변경

**파일**: `src/components/features/feed/FeedCardStack.tsx`

```tsx
// Before: 가변 높이
<div className="rounded-[28px] border px-4 py-5 sm:px-6 sm:py-6" style={cardStyle(card.visual)}>

// After: 4:5 고정 비율
<div
  className="relative aspect-[4/5] w-full overflow-hidden rounded-[28px] border"
  style={cardStyle(card.visual, resolveImageUrl(card.visual.imgCategory))}
>
  <div className="absolute inset-0 px-4 py-5 sm:px-6 sm:py-6 flex flex-col">
    {/* 기존 카드 내용 */}
  </div>
</div>
```

`cardStyle()` 함수도 확장:
```ts
function cardStyle(visual: CardVisual, imageUrl: string | null): React.CSSProperties {
  const gradient = `linear-gradient(160deg, ${visual.bg_from}cc, ${visual.bg_via}99, ${visual.bg_to})`
  if (imageUrl) {
    return {
      backgroundImage: `${gradient}, url(${imageUrl})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundBlendMode: 'multiply',
    }
  }
  return {
    backgroundImage: gradient,
  }
}
```
