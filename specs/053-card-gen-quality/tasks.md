# Tasks: 카드 생성 품질 개선 — 투자자 내러티브 + 비주얼 디자인 가이드

**Input**: Design documents from `/specs/053-card-gen-quality/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅

**Organization**: 3개 User Story 순서대로 구성. 모두 단일 파일(`generate.ts`) 수정이므로 [P] 없음.

## Format: `[ID] [Story] Description`

- **[Story]**: US1/US2/US3 (spec.md 사용자 스토리 매핑)
- Phase 1/2는 Story 라벨 없음 (공통 선결 조건)

---

## Phase 1: Setup

**Purpose**: 053 브랜치에 #13(buildSystemPrompt 첫 구현) 변경 사항 통합

- [ ] T001 `git merge origin/main` 실행하여 buildSystemPrompt + generateContextIssues를 053 브랜치에 통합

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: main merge 후 발생하는 테스트 불일치 수정 및 기반 확인

⚠️ CRITICAL: Phase 3+ 작업 전 완료 필수

- [ ] T002 `tests/unit/lib/pipeline-generate.test.ts` — `channel: 'default'` 기대값을 `'v1'`으로 수정 (main의 #13 변경 반영)
- [ ] T003 `tests/unit/lib/pipeline-generate.test.ts` — `generateIssues` 호출 시 `messages.create` 인자에 `system` 필드가 포함되는지 검증하는 테스트 추가
- [ ] T004 `tests/unit/lib/pipeline-generate.test.ts` — `generateContextIssues` 호출 시 `messages.create` 인자에 `system` 필드가 포함되는지 검증하는 테스트 추가 (generateContextIssues import 추가 필요)
- [ ] T005 `npm run test` 실행 → T002~T004 반영 후 기존 테스트 포함 전체 통과 확인

**Checkpoint**: 테스트 통과 — buildSystemPrompt 개선 작업 시작 가능

---

## Phase 3: User Story 1 — 투자자 질문 중심 내러티브 흐름 (Priority: P1) 🎯 MVP

**Goal**: `buildSystemPrompt()`에 투자자 7단계 질문 흐름과 카드 생략 기준을 추가하여, 자동 파이프라인에서도 cover→reason/bullish/bearish→community→stats→source 순서로 스토리가 구성되도록 한다.

**Independent Test**: `generateIssues()`를 mock 호출 후 캡처한 `system` 파라미터 텍스트에 "내러티브 흐름" 또는 "뭔 일이야" 등의 키워드가 포함되어 있어야 한다. (quickstart.md 수동 검증 참조)

- [ ] T006 [US1] `src/lib/pipeline/generate.ts` — `buildSystemPrompt()` 내 `## 내러티브 흐름` 섹션 추가: 투자자 7단계 질문(뭔 일이야→왜→더 오를까→리스크→커뮤니티→수치→출처)과 대응 카드 타입 명시
- [ ] T007 [US1] `src/lib/pipeline/generate.ts` — `buildSystemPrompt()` 내 cover 카드 작성 가이드 강화: title 첫 줄에 종목명/수치/핵심 결론 필수, `sub`는 "±N% · YYYY-MM-DD" 형식, 나쁜 예시(수치 없는 title) 포함
- [ ] T008 [US1] `src/lib/pipeline/generate.ts` — `buildSystemPrompt()` 내 카드별 생략 기준 명시: bullish(긍정 근거 없으면 생략), bearish(리스크 없으면 생략), community(커뮤니티 반응 유추 불가 시 생략), stats(수치 추출 불가 시 생략). 최소 구성 3장(cover + reason/bullish 중 1개 + source) 명시

**Checkpoint**: 파이프라인 실행 시 카드 순서가 투자자 관점 흐름을 따르는지 Admin UI에서 확인 가능

---

## Phase 4: User Story 2 — 이슈 분위기 반영 비주얼 팔레트 (Priority: P2)

**Goal**: `buildSystemPrompt()`에 분위기별 hex 팔레트 가이드와 이슈 내 일관성 규칙을 추가하여, 상승/하락/중립 이슈가 시각적으로 구분되는 색상을 가지도록 한다.

**Independent Test**: 생성된 카드의 `visual.bg_from` hex 값이 이슈 방향성(상승/하락)에 맞는 hue 범위에 속하는지 Admin UI에서 확인.

- [ ] T009 [US2] `src/lib/pipeline/generate.ts` — `buildSystemPrompt()` 내 `## 비주얼 팔레트 가이드` 섹션 추가: 상승(warm hue 0–60 또는 vivid green 100–150), 하락(cool hue 200–280), 중립(monochrome/slate) 세 분류와 각 분류별 hex 예시 팔레트 2~3세트 포함 (reference.md의 예시 활용)
- [ ] T010 [US2] `src/lib/pipeline/generate.ts` — `buildSystemPrompt()` 내 팔레트 일관성 규칙 추가: 동일 이슈 내 모든 카드는 같은 계열(hue 범위 60° 이내), bg_from은 가장 어둡고 bg_to로 갈수록 약간 밝아지는 그라디언트, 올바른/잘못된 예시 포함

**Checkpoint**: 상승 이슈와 하락 이슈의 카드 색상이 시각적으로 명확히 구분되는지 Admin UI에서 확인 가능

---

## Phase 5: User Story 3 — community·stats 카드 콘텐츠 품질 (Priority: P3)

**Goal**: `buildSystemPrompt()`에 community 카드의 투자자 커뮤니티 어조 가이드와 stats 카드의 이슈 유형별 우선 지표 가이드를 추가한다.

**Independent Test**: 생성된 community.quotes가 실제 커뮤니티 어조를 반영하는지, stats.items에 날짜/종목명 반복이 없고 수치 기반 지표가 포함되는지 Admin UI에서 확인.

- [ ] T011 [US3] `src/lib/pipeline/generate.ts` — `buildSystemPrompt()` 내 community 카드 콘텐츠 가이드 추가: 주식 갤러리·네이버 종목 토론 스타일 어조 명시, 감정 표현 및 속어 허용, mood 분포(positive/negative/neutral) 적절 배분, 기사에서 커뮤니티 반응 유추 불가 시 생략 강조 (reference.md 4.4절 quotes 예시 활용)
- [ ] T012 [US3] `src/lib/pipeline/generate.ts` — `buildSystemPrompt()` 내 stats 카드 우선 지표 가이드 추가: 이슈 유형별(주식 상승/하락/실적, 지수, 통화) 우선 지표 테이블, 나쁜 예시(날짜·종목명·"상승" 등 수치 없는 items) 명시 (reference.md 4.5절 활용)

**Checkpoint**: 모든 3개 User Story 기능 완성 — Admin 검토 파일럿 테스트 진행 가능

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: 품질 게이트 통과 및 최종 검증

- [ ] T013 `npm run validate` 실행 (type-check + lint + format:check) → 통과 확인
- [ ] T014 `npm run test` 실행 → 전체 테스트 통과 확인
- [ ] T015 `npm run build` 실행 → 빌드 통과 확인
- [ ] T016 quickstart.md의 수동 검증 체크리스트에 따라 실제 카드 생성 결과 확인 (선택)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: 즉시 시작 가능
- **Foundational (Phase 2)**: Phase 1 완료 후 — Phase 3+ 시작 전 필수
- **US1 (Phase 3)**: Phase 2 완료 후 — 다른 User Story와 독립적
- **US2 (Phase 4)**: Phase 2 완료 후 — US1과 독립적 (같은 파일이지만 다른 섹션)
- **US3 (Phase 5)**: Phase 2 완료 후 — US1/US2와 독립적
- **Polish (Phase 6)**: 원하는 User Story 모두 완료 후

### User Story Dependencies

- **US1 (P1)**: Phase 2 완료 후 독립 시작 가능 — MVP
- **US2 (P2)**: Phase 2 완료 후 독립 시작 가능 — US1 불필요
- **US3 (P3)**: Phase 2 완료 후 독립 시작 가능 — US1/US2 불필요

> **참고**: 모든 변경이 단일 함수(`buildSystemPrompt()`) 내에 있으므로 실제 구현은 순서대로 진행 권장

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1: `git merge origin/main`
2. Phase 2: 테스트 수정 + 통과 확인
3. Phase 3 (T006~T008): 내러티브 흐름 추가
4. Phase 6 (T013~T015): 품질 게이트
5. **STOP & VALIDATE**: Admin UI에서 커버 카드 헤드라인 및 카드 순서 확인

### Full Delivery (All Stories)

Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5 → Phase 6
각 Phase 완료 시 Admin UI에서 해당 Story 검증 후 다음 진행

---

## Notes

- 모든 변경은 `src/lib/pipeline/generate.ts`의 `buildSystemPrompt()` 함수 텍스트만 수정
- `generateIssues()` / `generateContextIssues()` 시그니처 변경 없음
- `parseCards()` 스키마 검증 변경 없음
- DB/API/UI 변경 없음
- 총 태스크: 16개 (Setup 1 + Foundational 4 + US1 3 + US2 2 + US3 2 + Polish 4)
