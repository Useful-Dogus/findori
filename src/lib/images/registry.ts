// 이미지 레지스트리 — 카드 뉴스 시각 언어 시스템 (093-image-category-system)
// 실제 존재하는 파일만 등록. 키는 N단계 가변 (예: "theme/stock-up", "company/tesla/factory")

export type ImageCategory = 'theme' | 'emotion' | 'env' | 'company' | 'symbol' | 'action'

export type ImageEntry = {
  key: string
  category: ImageCategory
  description: string // AI 프롬프트에 노출되는 한 줄 설명
  path: string // public/ 기준 경로
}

export const IMAGE_REGISTRY: Record<string, ImageEntry> = {
  // ── theme ──────────────────────────────────────────────────────────────────

  // stock-up (4장)
  'theme/stock-up': {
    key: 'theme/stock-up',
    category: 'theme',
    description: '주가 상승',
    path: '/images/cards/theme/stock-up.webp',
  },
  'theme/stock-up-2': {
    key: 'theme/stock-up-2',
    category: 'theme',
    description: '주가 상승 (2)',
    path: '/images/cards/theme/stock-up-2.webp',
  },
  'theme/stock-up-3': {
    key: 'theme/stock-up-3',
    category: 'theme',
    description: '주가 상승 (3)',
    path: '/images/cards/theme/stock-up-3.webp',
  },
  'theme/stock-up-4': {
    key: 'theme/stock-up-4',
    category: 'theme',
    description: '주가 상승 (4)',
    path: '/images/cards/theme/stock-up-4.webp',
  },

  // stock-down (1장)
  'theme/stock-down': {
    key: 'theme/stock-down',
    category: 'theme',
    description: '주가 하락',
    path: '/images/cards/theme/stock-down.webp',
  },

  // currency (2장)
  'theme/currency': {
    key: 'theme/currency',
    category: 'theme',
    description: '환율·화폐',
    path: '/images/cards/theme/currency.webp',
  },
  'theme/currency-2': {
    key: 'theme/currency-2',
    category: 'theme',
    description: '환율·화폐 (2)',
    path: '/images/cards/theme/currency-2.webp',
  },

  // ai-chip (4장)
  'theme/ai-chip': {
    key: 'theme/ai-chip',
    category: 'theme',
    description: 'AI·반도체 칩',
    path: '/images/cards/theme/ai-chip.webp',
  },
  'theme/ai-chip-2': {
    key: 'theme/ai-chip-2',
    category: 'theme',
    description: 'AI·반도체 칩 (2)',
    path: '/images/cards/theme/ai-chip-2.webp',
  },
  'theme/ai-chip-3': {
    key: 'theme/ai-chip-3',
    category: 'theme',
    description: 'AI·반도체 칩 (3)',
    path: '/images/cards/theme/ai-chip-3.webp',
  },
  'theme/ai-chip-4': {
    key: 'theme/ai-chip-4',
    category: 'theme',
    description: 'AI·반도체 칩 (4)',
    path: '/images/cards/theme/ai-chip-4.webp',
  },

  // earnings (2장)
  'theme/earnings': {
    key: 'theme/earnings',
    category: 'theme',
    description: '실적발표·보고서',
    path: '/images/cards/theme/earnings.webp',
  },
  'theme/earnings-2': {
    key: 'theme/earnings-2',
    category: 'theme',
    description: '실적발표·보고서 (2)',
    path: '/images/cards/theme/earnings-2.webp',
  },

  // warning (2장)
  'theme/warning': {
    key: 'theme/warning',
    category: 'theme',
    description: '경고·리스크',
    path: '/images/cards/theme/warning.webp',
  },
  'theme/warning-2': {
    key: 'theme/warning-2',
    category: 'theme',
    description: '경고·리스크 (2)',
    path: '/images/cards/theme/warning-2.webp',
  },

  // consumer (7장)
  'theme/consumer': {
    key: 'theme/consumer',
    category: 'theme',
    description: '소비·시장',
    path: '/images/cards/theme/consumer.webp',
  },
  'theme/consumer-2': {
    key: 'theme/consumer-2',
    category: 'theme',
    description: '소비·시장 (2)',
    path: '/images/cards/theme/consumer-2.webp',
  },
  'theme/consumer/market': {
    key: 'theme/consumer/market',
    category: 'theme',
    description: '소비·시장 (전통 시장)',
    path: '/images/cards/theme/consumer/market.webp',
  },
  'theme/consumer/shopping-mall': {
    key: 'theme/consumer/shopping-mall',
    category: 'theme',
    description: '소비·시장 (쇼핑몰)',
    path: '/images/cards/theme/consumer/shopping-mall.webp',
  },
  'theme/consumer/super-market': {
    key: 'theme/consumer/super-market',
    category: 'theme',
    description: '소비·시장 (슈퍼마켓)',
    path: '/images/cards/theme/consumer/super-market.webp',
  },
  'theme/consumer/super-market-2': {
    key: 'theme/consumer/super-market-2',
    category: 'theme',
    description: '소비·시장 (슈퍼마켓 2)',
    path: '/images/cards/theme/consumer/super-market-2.webp',
  },
  'theme/consumer/luxury': {
    key: 'theme/consumer/luxury',
    category: 'theme',
    description: '소비·시장 (명품·럭셔리)',
    path: '/images/cards/theme/consumer/luxury.webp',
  },

  // 기타 테마 (4장)
  'theme/us': {
    key: 'theme/us',
    category: 'theme',
    description: '미국·월스트리트',
    path: '/images/cards/theme/us.webp',
  },
  'theme/ai': {
    key: 'theme/ai',
    category: 'theme',
    description: 'AI·인공지능',
    path: '/images/cards/theme/ai.webp',
  },
  'theme/us/building': {
    key: 'theme/us/building',
    category: 'theme',
    description: '미국 빌딩·도심',
    path: '/images/cards/theme/us/building.webp',
  },
  'theme/ai/lobot': {
    key: 'theme/ai/lobot',
    category: 'theme',
    description: 'AI 로봇',
    path: '/images/cards/theme/ai/lobot.webp',
  },

  // ── emotion ────────────────────────────────────────────────────────────────

  'emotion/fomo': {
    key: 'emotion/fomo',
    category: 'emotion',
    description: 'FOMO·기대감 (급등 기회)',
    path: '/images/cards/emotion/fomo.webp',
  },
  'emotion/determined': {
    key: 'emotion/determined',
    category: 'emotion',
    description: '결의·의지 (투자 결단)',
    path: '/images/cards/emotion/determined.webp',
  },
  'emotion/empowered': {
    key: 'emotion/empowered',
    category: 'emotion',
    description: '자신감·활기',
    path: '/images/cards/emotion/empowered.webp',
  },
  'emotion/empowered-2': {
    key: 'emotion/empowered-2',
    category: 'emotion',
    description: '자신감·활기 (2)',
    path: '/images/cards/emotion/empowered-2.webp',
  },
  'emotion/angry': {
    key: 'emotion/angry',
    category: 'emotion',
    description: '분노·좌절 (손실 반응)',
    path: '/images/cards/emotion/angry.webp',
  },
  'emotion/stunned': {
    key: 'emotion/stunned',
    category: 'emotion',
    description: '충격·경악 (급락 순간)',
    path: '/images/cards/emotion/stunned.webp',
  },
  'emotion/doubt': {
    key: 'emotion/doubt',
    category: 'emotion',
    description: '의심·망설임 (매수 고민)',
    path: '/images/cards/emotion/doubt.webp',
  },
  'emotion/doubt-2': {
    key: 'emotion/doubt-2',
    category: 'emotion',
    description: '의심·망설임 (2)',
    path: '/images/cards/emotion/doubt-2.webp',
  },
  'emotion/exhilarating': {
    key: 'emotion/exhilarating',
    category: 'emotion',
    description: '흥분·설렘 (급등 장세)',
    path: '/images/cards/emotion/exhilarating.webp',
  },
  'emotion/uneasy': {
    key: 'emotion/uneasy',
    category: 'emotion',
    description: '불안·긴장 (하락 전조)',
    path: '/images/cards/emotion/uneasy.webp',
  },
  'emotion/resentment': {
    key: 'emotion/resentment',
    category: 'emotion',
    description: '억울함·후회 (손실 감정)',
    path: '/images/cards/emotion/resentment.webp',
  },

  // ── env ────────────────────────────────────────────────────────────────────

  'env/financial-district': {
    key: 'env/financial-district',
    category: 'env',
    description: '도심 금융가·빌딩숲',
    path: '/images/cards/env/financial-district.webp',
  },
  'env/financial-district-2': {
    key: 'env/financial-district-2',
    category: 'env',
    description: '도심 금융가·빌딩숲 (2)',
    path: '/images/cards/env/financial-district-2.webp',
  },

  // ── company ────────────────────────────────────────────────────────────────

  // 삼성 (7장)
  'company/samsung': {
    key: 'company/samsung',
    category: 'company',
    description: '삼성전자',
    path: '/images/cards/company/samsung.webp',
  },
  'company/samsung-2': {
    key: 'company/samsung-2',
    category: 'company',
    description: '삼성전자 (2)',
    path: '/images/cards/company/samsung-2.webp',
  },
  'company/samsung/jaeyong-lee': {
    key: 'company/samsung/jaeyong-lee',
    category: 'company',
    description: '삼성전자 이재용 회장',
    path: '/images/cards/company/samsung/jaeyong-lee.webp',
  },
  'company/samsung/factory': {
    key: 'company/samsung/factory',
    category: 'company',
    description: '삼성전자 반도체 공장',
    path: '/images/cards/company/samsung/factory.webp',
  },
  'company/samsung/factory-2': {
    key: 'company/samsung/factory-2',
    category: 'company',
    description: '삼성전자 반도체 공장 (2)',
    path: '/images/cards/company/samsung/factory-2.webp',
  },
  'company/samsung/building': {
    key: 'company/samsung/building',
    category: 'company',
    description: '삼성전자 사옥',
    path: '/images/cards/company/samsung/building.webp',
  },
  'company/samsung/logo': {
    key: 'company/samsung/logo',
    category: 'company',
    description: '삼성전자 로고',
    path: '/images/cards/company/samsung/logo.webp',
  },

  // SK하이닉스 (3장)
  'company/sk-hynix': {
    key: 'company/sk-hynix',
    category: 'company',
    description: 'SK하이닉스',
    path: '/images/cards/company/sk-hynix.webp',
  },
  'company/sk-hynix/factory': {
    key: 'company/sk-hynix/factory',
    category: 'company',
    description: 'SK하이닉스 공장',
    path: '/images/cards/company/sk-hynix/factory.webp',
  },
  'company/sk-hynix/logo': {
    key: 'company/sk-hynix/logo',
    category: 'company',
    description: 'SK하이닉스 로고',
    path: '/images/cards/company/sk-hynix/logo.webp',
  },

  // 현대차 (5장)
  'company/hyundai': {
    key: 'company/hyundai',
    category: 'company',
    description: '현대차',
    path: '/images/cards/company/hyundai.webp',
  },
  'company/hyundai-2': {
    key: 'company/hyundai-2',
    category: 'company',
    description: '현대차 (2)',
    path: '/images/cards/company/hyundai-2.webp',
  },
  'company/hyundai/factory': {
    key: 'company/hyundai/factory',
    category: 'company',
    description: '현대차 공장',
    path: '/images/cards/company/hyundai/factory.webp',
  },
  'company/hyundai/factory-2': {
    key: 'company/hyundai/factory-2',
    category: 'company',
    description: '현대차 공장 (2)',
    path: '/images/cards/company/hyundai/factory-2.webp',
  },
  'company/hyundai/factory-line': {
    key: 'company/hyundai/factory-line',
    category: 'company',
    description: '현대차 생산 라인',
    path: '/images/cards/company/hyundai/factory-line.webp',
  },

  // LG (2장)
  'company/lg': {
    key: 'company/lg',
    category: 'company',
    description: 'LG',
    path: '/images/cards/company/lg.webp',
  },
  'company/lg/building': {
    key: 'company/lg/building',
    category: 'company',
    description: 'LG 사옥',
    path: '/images/cards/company/lg/building.webp',
  },

  // 카카오 (2장)
  'company/kakao': {
    key: 'company/kakao',
    category: 'company',
    description: '카카오',
    path: '/images/cards/company/kakao.webp',
  },
  'company/kakao/office': {
    key: 'company/kakao/office',
    category: 'company',
    description: '카카오 오피스',
    path: '/images/cards/company/kakao/office.webp',
  },

  // 네이버 (2장)
  'company/naver': {
    key: 'company/naver',
    category: 'company',
    description: '네이버',
    path: '/images/cards/company/naver.webp',
  },
  'company/naver-2': {
    key: 'company/naver-2',
    category: 'company',
    description: '네이버 (2)',
    path: '/images/cards/company/naver-2.webp',
  },

  // 애플 (2장)
  'company/apple/logo': {
    key: 'company/apple/logo',
    category: 'company',
    description: '애플 로고',
    path: '/images/cards/company/apple/logo.webp',
  },
  'company/apple/office-building': {
    key: 'company/apple/office-building',
    category: 'company',
    description: '애플 사옥',
    path: '/images/cards/company/apple/office-building.webp',
  },

  // 엔비디아 (4장)
  'company/nvidia': {
    key: 'company/nvidia',
    category: 'company',
    description: '엔비디아',
    path: '/images/cards/company/nvidia.webp',
  },
  'company/nvidia/jensen-huang': {
    key: 'company/nvidia/jensen-huang',
    category: 'company',
    description: '엔비디아 젠슨 황 CEO',
    path: '/images/cards/company/nvidia/jensen-huang.webp',
  },
  'company/nvidia/logo': {
    key: 'company/nvidia/logo',
    category: 'company',
    description: '엔비디아 로고',
    path: '/images/cards/company/nvidia/logo.webp',
  },
  'company/nvidia/factory': {
    key: 'company/nvidia/factory',
    category: 'company',
    description: '엔비디아 공장',
    path: '/images/cards/company/nvidia/factory.webp',
  },
  'company/microsoft': {
    key: 'company/microsoft',
    category: 'company',
    description: '마이크로소프트 사옥',
    path: '/images/cards/company/microsoft.webp',
  },

  // 테슬라 (6장)
  'company/tesla': {
    key: 'company/tesla',
    category: 'company',
    description: '테슬라',
    path: '/images/cards/company/tesla.webp',
  },
  'company/tesla-2': {
    key: 'company/tesla-2',
    category: 'company',
    description: '테슬라 (2)',
    path: '/images/cards/company/tesla-2.webp',
  },
  'company/tesla/elon-musk': {
    key: 'company/tesla/elon-musk',
    category: 'company',
    description: '테슬라 일론 머스크',
    path: '/images/cards/company/tesla/elon-musk.webp',
  },
  'company/tesla/elon-musk-2': {
    key: 'company/tesla/elon-musk-2',
    category: 'company',
    description: '테슬라 일론 머스크 (2)',
    path: '/images/cards/company/tesla/elon-musk-2.webp',
  },
  'company/tesla/factory': {
    key: 'company/tesla/factory',
    category: 'company',
    description: '테슬라 기가팩토리',
    path: '/images/cards/company/tesla/factory.webp',
  },
  'company/tesla/logo': {
    key: 'company/tesla/logo',
    category: 'company',
    description: '테슬라 로고',
    path: '/images/cards/company/tesla/logo.webp',
  },

  // 메타 (2장)
  'company/meta': {
    key: 'company/meta',
    category: 'company',
    description: '메타',
    path: '/images/cards/company/meta.webp',
  },
  'company/meta-2': {
    key: 'company/meta-2',
    category: 'company',
    description: '메타 (2)',
    path: '/images/cards/company/meta-2.webp',
  },

  // 아마존 (2장)
  'company/amazon': {
    key: 'company/amazon',
    category: 'company',
    description: '아마존',
    path: '/images/cards/company/amazon.webp',
  },
  'company/amazon/office-building': {
    key: 'company/amazon/office-building',
    category: 'company',
    description: '아마존 사옥',
    path: '/images/cards/company/amazon/office-building.webp',
  },

  // 기아 (2장)
  'company/kia': {
    key: 'company/kia',
    category: 'company',
    description: '기아',
    path: '/images/cards/company/kia.webp',
  },
  'company/kia/logo': {
    key: 'company/kia/logo',
    category: 'company',
    description: '기아 로고',
    path: '/images/cards/company/kia/logo.webp',
  },

  // 한국 일반 기업 (3장)
  'company/generic-kr': {
    key: 'company/generic-kr',
    category: 'company',
    description: '한국 일반 기업·건물',
    path: '/images/cards/company/generic-kr.webp',
  },
  'company/generic-kr-2': {
    key: 'company/generic-kr-2',
    category: 'company',
    description: '한국 일반 기업·건물 (2)',
    path: '/images/cards/company/generic-kr-2.webp',
  },
  'company/generic-kr-3': {
    key: 'company/generic-kr-3',
    category: 'company',
    description: '한국 일반 기업·건물 (3)',
    path: '/images/cards/company/generic-kr-3.webp',
  },

  // 미국 일반 기업 (4장)
  'company/generic-us': {
    key: 'company/generic-us',
    category: 'company',
    description: '미국 일반 기업·건물',
    path: '/images/cards/company/generic-us.webp',
  },
  'company/generic-us-2': {
    key: 'company/generic-us-2',
    category: 'company',
    description: '미국 일반 기업·건물 (2)',
    path: '/images/cards/company/generic-us-2.webp',
  },
  'company/generic-us-3': {
    key: 'company/generic-us-3',
    category: 'company',
    description: '미국 일반 기업·건물 (3)',
    path: '/images/cards/company/generic-us-3.webp',
  },
  'company/generic-us-4': {
    key: 'company/generic-us-4',
    category: 'company',
    description: '미국 일반 기업·건물 (4)',
    path: '/images/cards/company/generic-us-4.webp',
  },

  // 공장·제조 (3장)
  'company/factory': {
    key: 'company/factory',
    category: 'company',
    description: '공장·제조시설',
    path: '/images/cards/company/factory.webp',
  },
  'company/factory-2': {
    key: 'company/factory-2',
    category: 'company',
    description: '공장·제조시설 (2)',
    path: '/images/cards/company/factory-2.webp',
  },
  'company/factory-3': {
    key: 'company/factory-3',
    category: 'company',
    description: '공장·제조시설 (3)',
    path: '/images/cards/company/factory-3.webp',
  },

  // ── symbol ─────────────────────────────────────────────────────────────────

  'symbol/gold': {
    key: 'symbol/gold',
    category: 'symbol',
    description: '금·귀금속',
    path: '/images/cards/symbol/gold.webp',
  },
  'symbol/cash-usd': {
    key: 'symbol/cash-usd',
    category: 'symbol',
    description: '달러·환전',
    path: '/images/cards/symbol/cash-usd.webp',
  },
  'symbol/cash-usd-2': {
    key: 'symbol/cash-usd-2',
    category: 'symbol',
    description: '달러·환전 (2)',
    path: '/images/cards/symbol/cash-usd-2.webp',
  },
  'symbol/cash-krw': {
    key: 'symbol/cash-krw',
    category: 'symbol',
    description: '원화·지폐',
    path: '/images/cards/symbol/cash-krw.webp',
  },
  'symbol/cash-krw-2': {
    key: 'symbol/cash-krw-2',
    category: 'symbol',
    description: '원화·지폐 (2)',
    path: '/images/cards/symbol/cash-krw-2.webp',
  },
  'symbol/chart-down': {
    key: 'symbol/chart-down',
    category: 'symbol',
    description: '하락 차트 그래픽',
    path: '/images/cards/symbol/chart-down.webp',
  },
  'symbol/chart-down-2': {
    key: 'symbol/chart-down-2',
    category: 'symbol',
    description: '하락 차트 그래픽 (2)',
    path: '/images/cards/symbol/chart-down-2.webp',
  },
  'symbol/chart-down-3': {
    key: 'symbol/chart-down-3',
    category: 'symbol',
    description: '하락 차트 그래픽 (3)',
    path: '/images/cards/symbol/chart-down-3.webp',
  },
  'symbol/chart-down-4': {
    key: 'symbol/chart-down-4',
    category: 'symbol',
    description: '하락 차트 그래픽 (4)',
    path: '/images/cards/symbol/chart-down-4.webp',
  },
  'symbol/chart-up': {
    key: 'symbol/chart-up',
    category: 'symbol',
    description: '상승 차트 그래픽',
    path: '/images/cards/symbol/chart-up.webp',
  },
  'symbol/chart-up-2': {
    key: 'symbol/chart-up-2',
    category: 'symbol',
    description: '상승 차트 그래픽 (2)',
    path: '/images/cards/symbol/chart-up-2.webp',
  },

  // ── action ─────────────────────────────────────────────────────────────────

  'action/investor-analysis': {
    key: 'action/investor-analysis',
    category: 'action',
    description: '투자자 분석·고민 장면',
    path: '/images/cards/action/investor-analysis.webp',
  },
}

// theme/growth 파일 미수집 — theme/stock-up을 fallback으로 사용
export const FALLBACK_IMAGE_KEY = 'theme/stock-up'

/**
 * 이미지 키를 받아 public 경로를 반환.
 * - undefined → null (gradient만 표시)
 * - 알 수 없는 키 → fallback 경로 반환
 */
export function resolveImageUrl(key: string | undefined): string | null {
  if (!key) return null
  const entry = IMAGE_REGISTRY[key] ?? IMAGE_REGISTRY[FALLBACK_IMAGE_KEY]
  return entry.path
}

/**
 * AI 시스템 프롬프트에 삽입할 이미지 키 목록 텍스트.
 */
export function getImageKeysForPrompt(): string {
  return Object.values(IMAGE_REGISTRY)
    .map((entry) => `${entry.key}: ${entry.description}`)
    .join('\n')
}
