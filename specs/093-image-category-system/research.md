# Research: 카드 뉴스 시각 언어 시스템

**Feature**: 093-image-category-system
**Phase**: 0 — Research
**Date**: 2026-03-31

---

## Q1: 이미지 키 분류 체계 (Image Key Taxonomy)

**Decision**: 6개 역할 분류 × 총 ~38개 키. 각 키당 초기 2-3개 이미지 파일을 수집하여 총 80-120장 확보. 현 스코프에서는 키당 대표 이미지 1장만 사용.

**Rationale**: 키가 너무 세분화되면 AI 선택 오류 증가. 너무 뭉뚱그리면 시각 다양성 부족. 역할 분류 prefix(`theme/`, `company/` 등)로 네임스페이싱하면 AI 선택 정확도와 미래 확장성을 동시에 확보.

**완전한 키 목록**:

### 테마 (theme/) — 8개
| 키 | 설명 |
|----|------|
| `theme/stock-up` | 주가 상승 |
| `theme/stock-down` | 주가 하락 |
| `theme/currency` | 환율 |
| `theme/ai-chip` | AI·반도체 |
| `theme/earnings` | 실적발표 |
| `theme/warning` | 경고·리스크 |
| `theme/growth` | 성장·확장 |
| `theme/consumer` | 소비·유통 |

### 감정 (emotion/) — 4개
| 키 | 설명 |
|----|------|
| `emotion/fear` | 공포·불안 (시장 급락, 손실) |
| `emotion/fomo` | FOMO·기대 (급등주, 상승 기회) |
| `emotion/decision` | 결정의 순간 (매수/매도 고민) |
| `emotion/humor` | 유머·공감 (투자자 일상 밈) |

### 환경 (env/) — 4개
| 키 | 설명 |
|----|------|
| `env/exchange-kr` | 한국거래소(KRX)·여의도 금융가 |
| `env/exchange-us` | NYSE·NASDAQ·월스트리트 |
| `env/financial-district` | 도심 금융가·빌딩숲 |
| `env/trading-screen` | 주식 거래 화면·전광판 |

### 기업 (company/) — 15개
| 키 | 설명 |
|----|------|
| `company/samsung` | 삼성전자 |
| `company/sk-hynix` | SK하이닉스 |
| `company/hyundai` | 현대차 |
| `company/lg` | LG |
| `company/kakao` | 카카오 |
| `company/naver` | 네이버 |
| `company/apple` | 애플 |
| `company/nvidia` | 엔비디아 |
| `company/tesla` | 테슬라 |
| `company/microsoft` | 마이크로소프트 |
| `company/amazon` | 아마존 |
| `company/meta` | 메타 |
| `company/generic-kr` | 한국 일반 기업·건물 (인지도 낮은 기업 대체) |
| `company/generic-us` | 미국 일반 기업·건물 |
| `company/factory` | 공장·제조시설 |

### 상징 (symbol/) — 5개
| 키 | 설명 |
|----|------|
| `symbol/cash-krw` | 원화·지폐 |
| `symbol/cash-usd` | 달러·환전 |
| `symbol/gold` | 금·귀금속 |
| `symbol/chart-up` | 상승 차트 그래픽 |
| `symbol/chart-down` | 하락 차트 그래픽 |

### 행동 (action/) — 2개
| 키 | 설명 |
|----|------|
| `action/investor-phone` | 스마트폰으로 투자 앱 확인 |
| `action/investor-analysis` | 투자자 분석·고민 장면 |

**기본 폴백 키**: `theme/growth` (중립적, 범용)

**이미지 수량 계산**:
- 38개 키 × 2-3장/키 = 76-114장 → 80-120장 목표 달성

---

## Q2: 이미지 렌더링 방식 (Background vs. Split Layout)

**Decision**: 이미지를 카드 전체 배경으로 사용 + 기존 gradient를 반투명 오버레이로 활용하여 텍스트 가독성 확보.

**Rationale**:
- 기존 `cardStyle()` 함수가 inline gradient를 배경으로 이미 적용 중
- `background-image: url(...), linear-gradient(...)` CSS 다중 배경으로 이미지 + 그라디언트 오버레이를 한 번에 처리
- Split layout(이미지 상단 / 텍스트 하단)은 4:5 비율에서 텍스트 영역이 너무 좁아지는 카드 타입이 발생(impact, compare 등)

**Alternatives considered**:
- **Split layout (이미지 50% + 텍스트 50%)**: 구현 단순하지만 텍스트 많은 카드(compare, impact)에서 하단 영역 부족 → 기각
- **이미지만 표시 (gradient 제거)**: 텍스트 가독성 보장이 어렵고 기존 카드 호환성 깨짐 → 기각

---

## Q3: 4:5 고정 비율 구현 방식

**Decision**: 카드 컨테이너에 Tailwind `aspect-[4/5]` + `overflow-hidden` 적용. 내부 텍스트 오버플로우는 `line-clamp` 처리.

**Rationale**:
- 현재 `FeedCardStack.tsx`의 카드 컨테이너(`rounded-[28px] border px-4 py-5`)에 고정 높이가 없어 카드별로 높이가 달라짐
- `aspect-ratio: 4/5`는 부모 너비에 비례해 높이를 자동 계산 → 반응형 유지
- `overflow-hidden`으로 내용이 넘쳐도 카드 외부 레이아웃에 영향 없음
- 텍스트 잘림 방지: 폰트 크기를 카드 타입별로 최적화하거나 `line-clamp`로 제한

**Alternatives considered**:
- **`min-h-[500px]` 고정 픽셀**: 해상도별 비율 불일치, 반응형 대응 어려움 → 기각
- **`h-screen` 풀스크린**: 모바일 UI 맥락과 맞지 않음 → 기각

---

## Q4: `imgCategory` 필드 위치

**Decision**: `CardVisual` 타입에 `imgCategory?: string` 옵셔널 필드로 추가.

**Rationale**:
- 모든 카드 타입이 `visual: CardVisual`을 공유하므로 한 곳에만 추가하면 모든 타입에 자동 적용
- Optional 필드이므로 기존 저장된 카드의 Zod 파싱은 영향 없음
- DB 마이그레이션 불필요 (`cards_data`는 jsonb 타입)

---

## Q5: AI 프롬프트에 이미지 키 제공 방식

**Decision**: 시스템 프롬프트의 `visual` 팔레트 섹션 뒤에 "이미지 카테고리 키 목록" 섹션을 추가. 키 전체 목록 + 설명을 텍스트로 제공하고, visual 객체의 `imgCategory` 필드에 선택 키를 포함하도록 지시.

**Rationale**:
- 현재 프롬프트에 Visual Palette Guide 섹션이 이미 있어 확장이 자연스러움
- Tool schema의 `visual` 객체에 `imgCategory` 필드를 추가하면 Zod 검증까지 자동 연동
- 키 설명을 한 줄씩 제공하면 AI가 맥락에 맞는 키를 선택할 수 있음
