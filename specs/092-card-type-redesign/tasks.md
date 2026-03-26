# Tasks: 카드뉴스 품질 개선 Phase 2 — 카드 타입 재설계

**Input**: Design documents from `specs/092-card-type-redesign/`
**Prerequisites**: plan.md ✅ | spec.md ✅ | research.md ✅ | data-model.md ✅ | contracts/ ✅ | quickstart.md ✅

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1–US4)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: 신규 타입 추가를 위한 기반 파일 파악 및 브랜치 상태 확인

- [x] T001 기존 `src/types/cards.ts` 읽기 — 신규 타입 추가 전 현재 구조 확인
- [x] T002 기존 `src/lib/cards/index.ts` 읽기 — Zod 스키마 구조 확인
- [x] T003 [P] 기존 `src/lib/pipeline/generate.ts` 읽기 — system prompt 및 tool schema 구조 확인
- [x] T004 [P] 기존 `src/components/features/feed/FeedCardStack.tsx` 읽기 — 렌더러 switch 구조 확인

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: 모든 신규 카드 타입의 공통 기반 — 타입 정의와 Zod 파서. 이 Phase가 완료되어야 이후 모든 Phase가 진행 가능.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T005 `src/types/cards.ts`에 8개 신규 카드 타입 추가: `DeltaCard`, `DeltaIntroCard`, `CauseCard`, `StatCard`, `CompareRow`, `CompareCard`, `ImpactItem`, `ImpactCard`, `VerdictCard`, `QuestionCard` — `contracts/card-types.ts` 참고, 기존 7개 타입 유지, `CommunityCard`에 `@deprecated` JSDoc 주석 추가, 통합 `Card` union 타입에 신규 8개 타입 추가
- [x] T006 `src/types/cards.ts`의 `CARD_COUNT_MIN`(3), `CARD_COUNT_MAX`(7) 상수 유지 확인 및 첫 카드 허용 타입 목록을 주석으로 문서화 (`cover | delta | delta-intro | question`)
- [x] T007 `src/lib/cards/index.ts`에 Zod 서브 스키마 추가: `compareRowSchema`, `impactItemSchema` (공통 서브타입)
- [x] T008 `src/lib/cards/index.ts`에 8개 신규 카드 Zod 스키마 추가: `deltaCardSchema`, `deltaIntroCardSchema`, `causeCardSchema`, `statCardSchema`, `compareCardSchema`, `impactCardSchema`, `verdictCardSchema`, `questionCardSchema` — `data-model.md` 필드 제약 참고
- [x] T009 `src/lib/cards/index.ts`의 `cardSchema` discriminatedUnion에 8개 신규 타입 추가
- [x] T010 `src/lib/cards/index.ts`의 `cardsArraySchema` 첫 번째 카드 제약 업데이트: `cards[0].type === 'cover'` → `['cover', 'delta', 'delta-intro', 'question'].includes(cards[0].type)`
- [x] T011 `src/lib/cards/index.ts`에 8개 신규 타입 가드 함수 추가: `isDeltaCard`, `isDeltaIntroCard`, `isCauseCard`, `isStatCard`, `isCompareCard`, `isImpactCard`, `isVerdictCard`, `isQuestionCard`
- [x] T012 `npx tsc --noEmit` 실행해 타입 에러 0개 확인 — Phase 2 품질 게이트

**Checkpoint**: T012 통과 후 신규 카드 타입 파서 완성. US1, US2, US3, US4 병렬 시작 가능.

---

## Phase 3: User Story 1 — 다양한 형식의 카드뉴스 생성 (Priority: P1) 🎯 MVP

**Goal**: 파이프라인이 8개 타입의 다른 필드 구조를 가진 카드를 생성하고, 독자가 화면에서 확인 가능

**Independent Test**: Admin UI에서 파이프라인 수동 실행 후 생성된 이슈의 카드 타입이 2개 이상이고, 연속된 두 카드가 다른 타입인지 확인

### Implementation for User Story 1

- [x] T013 [US1] `src/lib/pipeline/generate.ts`의 `buildToolSchema()` 수정: 기존 7개 타입 외 8개 신규 타입 properties 추가 (`delta`, `delta-intro`, `cause`, `stat`, `compare`, `impact`, `verdict`, `question`) — `contracts/card-types.ts` 필드 정의 참고
- [x] T014 [US1] `src/lib/pipeline/generate.ts`의 `buildSystemPrompt()` 수정:
  - 스토리 아키타입 섹션을 `research.md`의 5개 아키타입(BREAKING/EARNINGS/MACRO/THEME/EDUCATION) 시퀀스 맵핑으로 교체
  - `community` 카드 생성 금지 명시
  - Δ 우선, 결과→원인, 3줄 압축, 말투 금지 패턴 원칙 강화
  - `verdict` 카드는 `source` 바로 앞에 위치 규칙 명시
  - 첫 카드로 허용 타입 명시: `delta`, `delta-intro`, `question` (아키타입에 따라 선택)
- [x] T015 [US1] `src/components/features/feed/FeedCardStack.tsx`의 `CardBody` switch 문에 8개 신규 타입 case 추가:
  - `delta`: 큰 수치(before → after) + period 뱃지 + context 텍스트
  - `delta-intro`: delta 레이아웃 + what/whatDesc 박스 + trigger
  - `cause`: result 강조 뱃지 + cause 본문 + SourceList
  - `stat`: 대형 number + label + 구분선 + reveal + SourceList
  - `compare`: 질문(q) + rows 리스트(dir 아이콘 포함: ↑/↓/↓↓) + footer
  - `impact`: items 리스트 (label / before → after / diff 뱃지)
  - `verdict`: verdict 한 문장 + reasons 불릿 리스트
  - `question`: 질문 텍스트 + 구분선 + hint
- [x] T016 [US1] `npm run build` 실행해 빌드 성공 확인 — TypeScript exhaustive check로 누락 case 없음 검증

**Checkpoint**: T016 통과 시 파이프라인이 새 타입 카드를 생성하고 화면에 표시 가능. MVP 완성.

---

## Phase 4: User Story 2 — 수치 기반 신뢰 콘텐츠 (Priority: P2)

**Goal**: 생성된 카드에서 Δ 수치와 비교 데이터가 구조적으로 강제됨

**Independent Test**: 생성된 이슈에서 `delta` 또는 `delta-intro` 타입 카드의 `before`, `after`, `period` 필드가 모두 채워진 것을 확인

### Implementation for User Story 2

- [x] T017 [US2] `src/lib/pipeline/generate.ts`의 `buildSystemPrompt()` 보강: Δ 수치 필수 규칙 강화 — `delta`/`delta-intro` 카드의 `before`, `after`, `period` 필드는 반드시 실제 수치를 포함해야 함을 명시 (빈 문자열 또는 placeholder 금지)
- [x] T018 [US2] `src/lib/pipeline/generate.ts`의 `buildSystemPrompt()` 보강: `compare` 카드의 `rows` 최소 2개 규칙, `stat` 카드의 `reveal`은 상식을 반박하는 해석이어야 함 명시
- [x] T019 [US2] `src/lib/cards/index.ts`의 `deltaCardSchema`에 `before`/`after`/`period` 비어있음 방지 `.min(1)` 제약 추가, `compareCardSchema`에 `rows.min(2)` 제약 추가, `verdictCardSchema`에 `reasons.min(2).max(3)` 제약 추가
- [x] T020 [US2] `npx tsc --noEmit` 및 `npm run build` 실행 — 타입 에러 0개, 빌드 성공 확인

**Checkpoint**: T020 통과 시 Zod 스키마 레벨에서 수치 기반 구조 강제.

---

## Phase 5: User Story 3 — 독자 실생활 연결 (Priority: P2)

**Goal**: 환율/물가/금리 이슈에 `impact` 카드가 포함되어 독자 지갑 영향이 구체적으로 제시됨

**Independent Test**: 환율 또는 소비 관련 RSS 기사가 있을 때 파이프라인 실행 후 `impact` 타입 카드가 생성된 이슈에 포함되어 있는지 확인

### Implementation for User Story 3

- [x] T021 [US3] `src/lib/pipeline/generate.ts`의 `buildSystemPrompt()` 보강: MACRO 아키타입(환율·금리·지수) 이슈에는 `impact` 카드를 포함시키도록 강제 — `impact_available` 플래그 기반 조건 명시
- [x] T022 [US3] `src/lib/pipeline/generate.ts`의 system prompt에 `impact` 카드 few-shot 예시 1개 추가: 환율 이슈 예시 (`해외직구 100달러 상품: 128,000원 → 150,000원 (+22,000원)` 스타일)
- [x] T023 [US3] `src/lib/cards/index.ts`의 `impactCardSchema`에 `items.min(2).max(4)` 제약 추가, 각 `ImpactItem`의 `before`/`after` `.min(1)` 제약 추가
- [x] T024 [US3] `npm run build` 실행 — 빌드 성공 확인

**Checkpoint**: T024 통과 시 실생활 연결 카드 생성 가능.

---

## Phase 6: User Story 4 — 2단계 LLM 팩트 추출 (Priority: P3)

**Goal**: Haiku가 기사에서 팩트를 구조화한 뒤 Sonnet이 카드를 생성하는 2단계 흐름 완성

**Independent Test**: `extractFacts`를 인위적으로 실패시켰을 때 파이프라인이 에러 없이 완료되는지 확인

### Implementation for User Story 4

- [x] T025 [US4] `src/lib/pipeline/extract.ts` 신규 생성: `ExtractedFacts` 반환하는 `extractFacts(articles, deps?)` 함수 구현
  - Haiku 모델(`claude-haiku-4-5-20250107` 또는 환경변수 `HAIKU_MODEL`) 사용
  - tool_use 패턴으로 `extract_facts` 도구 정의 — `contracts/card-types.ts`의 `ExtractedFacts` 스키마 기반
  - Zod로 응답 검증: `ExtractedIssue` 배열 (최대 3개)
  - 실패 시 `null` 반환 (throw 하지 않음)
  - 토큰 사용량(`TokenUsage`) 반환
- [x] T026 [US4] `src/lib/pipeline/extract.ts`의 `buildExtractPrompt(articles)` 구현:
  - 기사 제목 + 요약을 입력으로 받아 아키타입 분류 + 팩트 구조화 지시
  - `archetype`, `delta`, `is_subject_unfamiliar`, `compare_available`, `impact_available`, `verdict` 필드 추출 지시 포함
- [x] T027 [US4] `src/lib/pipeline/generate.ts`의 `generateIssues` 함수 시그니처 업데이트: `extractedFacts?: ExtractedFacts | null` 파라미터 추가
- [x] T028 [US4] `src/lib/pipeline/generate.ts`의 `buildPrompt(articles, extractedFacts?)` 수정: `extractedFacts`가 있을 때 기사 원문 대신 팩트 구조 + 기사 제목만 포함하도록 분기 처리
- [x] T029 [US4] `src/lib/pipeline/index.ts`의 `runPipeline` 수정:
  - `filterArticles` 후 `extractFacts` 호출 추가
  - `extractFacts` 결과(또는 `null` fallback)를 `generateIssues`에 전달
  - `tokenUsage` 집계에 extract 단계 `usage` 포함
- [x] T030 [US4] `npx tsc --noEmit` 및 `npm run build` 실행 — 타입 에러 0개, 빌드 성공 확인

**Checkpoint**: T030 통과 시 2단계 LLM 파이프라인 완성.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: 품질 게이트 최종 확인 및 스펙 성공 기준 검증

- [x] T031 [P] `npm run lint` 실행 — 린트 에러 0개 확인
- [x] T032 [P] `npx tsc --noEmit` 실행 — 타입 에러 0개 최종 확인
- [x] T033 `npm run build` 실행 — 프로덕션 빌드 성공 최종 확인
- [x] T034 [P] `src/lib/cards/index.ts`에서 `community` 타입이 Zod 스키마에 유지되어 있는지 확인 (기존 DB 데이터 호환 보장)
- [x] T035 [P] `src/components/features/feed/FeedCardStack.tsx`에서 `community` case 렌더러가 유지되어 있는지 확인 (기존 데이터 표시 가능)
- [ ] T036 `quickstart.md`의 검증 항목(SC-001~SC-007) 기준으로 Admin UI에서 파이프라인 수동 실행 후 결과 확인

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: T001-T004 병렬 시작 가능
- **Foundational (Phase 2)**: Phase 1 완료 후. T005→T006 순서, T007-T011 병렬 가능, T012로 마감
- **User Stories (Phase 3-6)**: Phase 2(T012) 완료 후 병렬 시작 가능
  - Phase 3(US1)은 MVP이므로 우선 완료
  - Phase 4(US2)와 Phase 5(US3)는 서로 독립적으로 병렬 진행 가능
  - Phase 6(US4)는 Phase 3 완료 후 시작 권장 (generate.ts 충돌 방지)
- **Polish (Phase 7)**: Phase 3-6 원하는 만큼 완료 후 시작

### User Story Dependencies

- **US1 (P1)**: Phase 2 완료 후 즉시 시작 — 다른 US에 의존 없음
- **US2 (P2)**: Phase 2 완료 후 시작 — US1과 독립적 (별도 Zod 제약 추가)
- **US3 (P2)**: Phase 2 완료 후 시작 — US1, US2와 독립적 (별도 prompt 보강)
- **US4 (P3)**: Phase 2 완료 + US1 generate.ts 수정 완료 후 시작 권장

### 파일 수정 충돌 방지

| 파일 | 수정 Phase |
|------|-----------|
| `src/types/cards.ts` | Phase 2 (T005-T006) |
| `src/lib/cards/index.ts` | Phase 2 (T007-T011) + Phase 4 (T019) + Phase 5 (T023) |
| `src/lib/pipeline/generate.ts` | Phase 3 (T013-T014) + Phase 4 (T017-T018) + Phase 5 (T021-T022) + Phase 6 (T027-T028) |
| `src/lib/pipeline/extract.ts` | Phase 6 신규 생성 (T025-T026) |
| `src/lib/pipeline/index.ts` | Phase 6 (T029) |
| `src/components/features/feed/FeedCardStack.tsx` | Phase 3 (T015) |

### Parallel Opportunities

- T001-T004 (읽기 작업): 모두 병렬 가능
- T007-T011 (Zod 스키마): 모두 병렬 가능
- T013-T015 (generate.ts + FeedCardStack.tsx): T013-T014는 같은 파일이므로 순차, T015는 병렬 가능
- T017-T018 (generate.ts 보강): 같은 함수 수정이므로 순차
- T025-T026 (extract.ts 신규): 같은 파일이므로 순차

---

## Parallel Example: Phase 2 Foundational

```bash
# T007-T011 병렬 실행 예시 (각각 독립 작업):
Task: "compareRowSchema, impactItemSchema Zod 서브스키마 추가 in src/lib/cards/index.ts"
Task: "8개 신규 카드 Zod 스키마 작성 in src/lib/cards/index.ts"
# 주의: 같은 파일이므로 실제로는 순차 권장 또는 섹션 분리
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1 완료 (T001-T004)
2. Phase 2 완료 (T005-T012) — **CRITICAL**
3. Phase 3 완료 (T013-T016)
4. **STOP and VALIDATE**: Admin UI에서 파이프라인 실행, 신규 카드 타입 생성 및 화면 표시 확인
5. MVP 배포 가능

### Incremental Delivery

1. Phase 1 + 2 → 파서 기반 완성
2. Phase 3 (US1) → 카드 다양성 MVP
3. Phase 4 (US2) → 수치 강제 강화
4. Phase 5 (US3) → 실생활 연결 카드
5. Phase 6 (US4) → 2단계 LLM 완성

---

## Notes

- [P] tasks = 다른 파일 또는 독립 작업 (병렬 가능)
- `generate.ts` system prompt는 Phase 3→4→5→6 순으로 누적 수정 — 각 Phase에서 함수 내 별도 섹션 추가 방식으로 충돌 최소화
- `community` 타입은 파서·렌더러에서 **제거하지 않음** — 기존 DB 데이터 호환 보장
- 각 Phase 완료 후 `npm run build` + `npx tsc --noEmit` 실행 권장
