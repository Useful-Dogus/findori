# Tasks: 카드 뉴스 시각 언어 시스템 구축

**Input**: Design documents from `specs/093-image-category-system/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅

**Organization**: 5개 User Story + 공통 기반(Foundation) 순서로 구성. US4(4:5 고정 크기)는 이미지 수집 없이 즉시 구현 가능한 P1이므로 첫 번째 User Story 페이즈로 배치.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 다른 파일, 병렬 실행 가능
- **[Story]**: 해당 User Story 레이블 (US1-US5)

---

## Phase 1: Setup

**Purpose**: 이미지 파일 디렉터리 구조 초기화

- [X] T001 `public/images/cards/` 하위 6개 서브디렉터리 생성: `theme/`, `emotion/`, `env/`, `company/`, `symbol/`, `action/`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: 모든 User Story가 공유하는 타입·스키마·레지스트리 기반. 이 Phase 완료 전에 어떤 User Story도 시작 불가.

**⚠️ CRITICAL**: 이 Phase가 완료되어야 모든 User Story 작업 시작 가능

- [X] T002 `src/types/cards.ts`의 `CardVisual` 타입에 `imgCategory?: string` 옵셔널 필드 추가
- [X] T003 `src/lib/cards.ts`의 `cardVisualSchema`에 `imgCategory: z.string().optional()` 추가
- [X] T004 `src/lib/images/registry.ts` 신규 파일 생성 — `ImageEntry` 타입, `ImageCategory` union 타입, `IMAGE_REGISTRY` (38개 키 전체), `FALLBACK_IMAGE_KEY = 'theme/growth'`, `resolveImageUrl()`, `getImageKeysForPrompt()` 구현 (data-model.md 참고)
- [X] T005 `npm run build`로 타입 검사 통과 확인 (T002-T004 완료 후)

**Checkpoint**: Foundation 완료 — 모든 User Story 작업 시작 가능

---

## Phase 3: User Story 4 — 카드 간 일정한 크기로 매끄러운 탐색 (Priority: P1) 🎯 MVP

**Goal**: 이미지 수집 없이 즉시 적용 가능한 4:5 고정 카드 크기로 스크롤 점프 제거

**Independent Test**: 카드 타입이 다른 카드들(cover, stats, compare, verdict 등)을 연속으로 탐색하며 높이 변화 없음을 확인. 모바일/데스크탑 양쪽에서 종횡비 동일함을 확인.

- [X] T006 [US4] `src/components/features/feed/FeedCardStack.tsx` — 카드 컨테이너 클래스에 `aspect-[4/5] w-full overflow-hidden` 추가, 내부 콘텐츠를 `relative` 컨테이너 안 `absolute inset-0 flex flex-col px-4 py-5 sm:px-6 sm:py-6`으로 재배치
- [X] T007 [US4] `src/components/features/feed/FeedCardStack.tsx` — 텍스트 오버플로우 방지: 카드 타입별 body/cause/reveal 등 긴 텍스트 필드에 `line-clamp-3` 또는 `line-clamp-4` 적용
- [X] T008 [US4] `npm run build`로 타입·빌드 게이트 통과 확인

**Checkpoint**: 이 시점에서 US4 독립 검증 가능 — 이미지 없이도 4:5 고정 크기 동작 확인

---

## Phase 4: User Story 1 — 이미지로 카드 맥락 즉시 파악 (Priority: P1)

**Goal**: 테마·상징·행동 이미지 라이브러리 구축 + 렌더러에 이미지 표시

**Independent Test**: 테마 8종, 상징 5종, 행동 2종 이미지가 각 카드에 표시됨. `imgCategory` 없는 기존 카드는 gradient만 표시됨. 미정의 키는 fallback(`theme/growth`)으로 표시됨.

### 이미지 수집 (수동 작업)

- [ ] T009 [P] [US1] 테마 이미지 8장 수집 및 WebP 변환 후 `public/images/cards/theme/`에 저장 — `stock-up`, `stock-down`, `currency`, `ai-chip`, `earnings`, `warning`, `growth`(fallback), `consumer` (Unsplash/Pexels, WebP quality 80, 장당 50-150KB 목표)
- [ ] T010 [P] [US1] 상징 이미지 5장 + 행동 이미지 2장 수집 및 WebP 변환 후 `public/images/cards/symbol/`, `public/images/cards/action/`에 저장 — `cash-krw`, `cash-usd`, `gold`, `chart-up`, `chart-down`, `investor-phone`, `investor-analysis`

### 렌더러 구현

- [X] T011 [US1] `src/components/features/feed/FeedCardStack.tsx` — `cardStyle()` 함수 시그니처 확장: `imageUrl: string | null` 인자 추가. 이미지 있을 때 `backgroundImage: \`${gradient}, url(${imageUrl})\`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundBlendMode: 'multiply'` 적용 (data-model.md 참고)
- [X] T012 [US1] `src/components/features/feed/FeedCardStack.tsx` — 카드 렌더링 시 `resolveImageUrl(card.visual.imgCategory)` 호출하여 `cardStyle()`에 전달. `imgCategory` undefined인 기존 카드는 null 반환으로 gradient만 표시
- [X] T013 [US1] `npm run build`로 타입·빌드 게이트 통과 확인 (T009-T012 완료 후)

**Checkpoint**: 이 시점에서 US1 독립 검증 가능 — 테마/상징/행동 이미지가 카드에 표시되며, imgCategory 없는 카드는 기존 gradient로 표시됨

---

## Phase 5: User Story 2 + 3 — 감정·기업·환경 이미지로 라이브러리 확장 (Priority: P2)

**Goal**: 감정 4종 + 환경 4종 + 기업 15종 이미지 수집으로 라이브러리를 80-120장 규모로 확장. 코드 변경 없이 이미지 파일 추가만으로 완료.

**Independent Test**: 감정/환경/기업 관련 카드에 각 대응 이미지가 표시됨. 주요 기업(삼성, 애플, 엔비디아 등) 카드에서 해당 기업을 연상할 수 있는 이미지 확인.

- [ ] T014 [P] [US2] 감정 이미지 4장 수집 및 WebP 변환 후 `public/images/cards/emotion/`에 저장 — `fear`, `fomo`, `decision`, `humor` (투자자 심리, 유머 스톡 이미지. 과도한 자극·공포 이미지 배제)
- [ ] T015 [P] [US3] 환경 이미지 4장 수집 및 WebP 변환 후 `public/images/cards/env/`에 저장 — `exchange-kr`(여의도 KRX), `exchange-us`(NYSE/NASDAQ 월스트리트), `financial-district`, `trading-screen`
- [ ] T016 [US3] 기업 이미지 15장 수집 및 WebP 변환 후 `public/images/cards/company/`에 저장 — 한국 6개사(samsung, sk-hynix, hyundai, lg, kakao, naver), 미국 6개사(apple, nvidia, tesla, microsoft, amazon, meta), 공통 3개(generic-kr, generic-us, factory). 로고 대신 건물·제품·공장 사진으로 수집 (저작권 안전)

**Checkpoint**: 이 시점에서 US2+US3 독립 검증 가능 — 전체 6개 역할 분류 이미지 구비 완료

---

## Phase 6: User Story 5 — AI의 풍부한 이미지 키 선택 (Priority: P3)

**Goal**: AI가 카드 생성 시 이미지 라이브러리 전체 키에서 맥락에 맞는 키를 선택하도록 프롬프트·스키마 업데이트

**Independent Test**: 다양한 뉴스 유형으로 파이프라인 실행 시 생성된 카드의 `imgCategory` 필드가 라이브러리 내 유효한 키이며, 내용과 관련성 높은 키가 선택됨.

- [X] T017 [US5] `src/lib/pipeline/generate.ts` — `generate_cards` tool schema의 `visual` 객체에 `imgCategory: z.string().optional()` 필드 추가
- [X] T018 [US5] `src/lib/pipeline/generate.ts` — 시스템 프롬프트의 Visual Palette Guide 섹션 뒤에 "이미지 카테고리 키" 섹션 추가: `getImageKeysForPrompt()` 반환값 삽입. 이슈 주체(기업명)가 `company/` 키에 있으면 해당 키 우선 선택, 없으면 `theme/` 또는 `emotion/` 중 선택하도록 지침 명시
- [X] T019 [US5] `npm run build`로 타입·빌드 게이트 통과 확인

**Checkpoint**: 이 시점에서 US5 독립 검증 가능 — 파이프라인 실행 후 카드에 imgCategory 필드 생성됨

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: 전체 품질 검증 및 마무리

- [ ] T020 [P] 수집된 이미지 총 용량 확인: 20MB 이하 목표. 초과 시 추가 WebP 압축 적용 (`cwebp -q 70` 재압축)
- [ ] T021 [P] `src/lib/images/registry.ts` — `public/images/cards/` 내 실제 파일 경로와 `IMAGE_REGISTRY`의 `path` 값 일치 여부 최종 확인
- [ ] T022 브라우저에서 수동 검증: (1) imgCategory 있는 카드 — 이미지 표시 확인, (2) imgCategory 없는 카드 — gradient만 표시 확인, (3) 미정의 키 — fallback 이미지 표시 확인, (4) 카드 간 4:5 크기 일정함 확인

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: 즉시 시작 가능
- **Phase 2 (Foundation)**: Phase 1 완료 후 — 모든 User Story를 블로킹
- **Phase 3 (US4)**: Phase 2 완료 후 — 이미지 수집 불필요, 즉시 구현 가능
- **Phase 4 (US1)**: Phase 2 완료 후 — T009, T010 이미지 수집 완료 후 T011, T012 구현
- **Phase 5 (US2+US3)**: Phase 4 완료 후 — 코드 변경 없이 이미지 수집만
- **Phase 6 (US5)**: Phase 4 완료 후 — Phase 5와 병렬 진행 가능
- **Phase 7 (Polish)**: Phase 5 + Phase 6 완료 후

### User Story Dependencies

- **US4 (P1)**: Phase 2 완료 후 바로 시작 가능. 이미지와 완전히 독립
- **US1 (P1)**: Phase 2 완료 + T009·T010 이미지 수집 완료 후 시작
- **US2 (P2)**: Phase 4(US1) 완료 후 — 코드 변경 없이 이미지 파일 추가만
- **US3 (P2)**: Phase 4(US1) 완료 후 — 코드 변경 없이 이미지 파일 추가만
- **US5 (P3)**: Phase 4(US1) 완료 후 — US2·US3과 병렬 진행 가능

### Parallel Opportunities

- T009, T010 — 이미지 수집은 병렬로 동시에 진행 가능
- T014, T015 — 감정/환경 이미지 수집 병렬 진행 가능
- T020, T021 — Polish 내 검증 태스크 병렬 진행 가능

---

## Parallel Example: Phase 4 (US1)

```
# T009, T010 동시 수집 (이미지 수집은 독립 작업):
Task T009: 테마 8장 수집 → public/images/cards/theme/
Task T010: 상징 5장 + 행동 2장 수집 → public/images/cards/symbol/, action/

# T009, T010 완료 후 T011, T012 순차 진행:
Task T011: cardStyle() 함수 imageUrl 인자 추가
Task T012: resolveImageUrl() 렌더러 연동
```

---

## Implementation Strategy

### MVP First (US4 + US1)

1. Phase 1: Setup 완료
2. Phase 2: Foundation 완료 (T002-T005)
3. Phase 3: US4 구현 (T006-T008) — 이미지 없이 즉시 배포 가능한 레이아웃 개선
4. Phase 4: US1 구현 (T009-T013) — 테마·상징·행동 이미지 라이브러리 + 렌더러
5. **STOP and VALIDATE**: 스크롤 점프 없음 + 기본 이미지 표시 확인 → MVP 배포

### Incremental Delivery

1. Phase 1+2 → 타입 기반 준비 완료
2. Phase 3 (US4) → 4:5 고정 크기 배포 (이미지 없이도 즉시 가치 전달)
3. Phase 4 (US1) → 기본 이미지 시각 언어 배포
4. Phase 5 (US2+US3) → 감정·기업·환경 이미지로 라이브러리 풍부화
5. Phase 6 (US5) → AI가 스스로 최적 이미지 선택
6. Phase 7 → 최종 품질 검증

---

## Notes

- [P] 태스크 = 다른 파일, 의존성 없음, 병렬 실행 가능
- 이미지 수집(T009, T010, T014, T015, T016)은 수동 작업으로, 코드 작업과 병행 진행 권장
- 이미지 저작권: Unsplash/Pexels의 무료 상업적 이용 가능(Free to use) 라이선스 이미지만 수집
- `npm run build`를 각 Phase 완료 시 반드시 실행하여 타입 오류 조기 발견
- US4는 이미지 없이 독립적으로 배포 가능한 유일한 P1 Story — 빠른 UX 개선에 활용 가능
