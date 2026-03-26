# Quick Start: 카드뉴스 품질 개선 Phase 2 구현 가이드

**Branch**: `092-card-type-redesign`

---

## 전제 조건

- Phase 1(#98) 브랜치가 main에 머지된 상태
- `ANTHROPIC_API_KEY` 환경변수 설정 완료
- `npm install` 완료

---

## 구현 순서 (의존성 순)

### Step 1. 타입 추가 (`src/types/cards.ts`)

`contracts/card-types.ts`의 인터페이스를 참고해 8개 신규 타입을 `src/types/cards.ts`에 추가한다.
- 기존 7개 타입은 그대로 유지
- `CommunityCard` 상단에 `@deprecated` 주석 추가
- `CARD_COUNT_MIN`, `CARD_COUNT_MAX` 상수 유지
- 통합 `Card` 타입에 신규 타입 추가

### Step 2. Zod 스키마 추가 (`src/lib/cards/index.ts`)

- 각 신규 카드 타입에 대한 Zod 스키마 작성
- `cardSchema` discriminatedUnion에 신규 타입 추가
- `cardsArraySchema`의 첫 번째 카드 제약 업데이트:
  - 기존: `cards[0].type === 'cover'`
  - 변경: `['cover', 'delta', 'delta-intro', 'question'].includes(cards[0].type)`
- 마지막 카드 `source` 제약 유지
- 타입 가드 함수 8개 추가

### Step 3. 팩트 추출 모듈 신규 생성 (`src/lib/pipeline/extract.ts`)

- `ExtractedFacts` 구조를 출력하는 Haiku tool_use 호출
- `contracts/card-types.ts`의 `ExtractedFacts` 인터페이스 기반 Zod 스키마 작성
- 실패 시 `null` 반환 (파이프라인 계속 진행)

### Step 4. 생성 모듈 수정 (`src/lib/pipeline/generate.ts`)

- `buildToolSchema()`: 신규 카드 타입 properties 추가
- `buildSystemPrompt()`:
  - 기존 스토리 아키타입 섹션 교체 (research.md의 시퀀스 맵핑 참고)
  - `community` 카드 생성 금지 명시
  - Δ 우선, 결과→원인, 3줄 압축 원칙 강화
- `generateIssues(articles, extractedFacts?)`: `ExtractedFacts`를 옵셔널 파라미터로 받아 user prompt에 포함

### Step 5. 파이프라인 오케스트레이터 수정 (`src/lib/pipeline/index.ts`)

```
collect → filter → [extract] → generate → store
```

- `filterArticles` 후 `extractFacts` 호출
- `extractFacts` 실패 시 `null`로 fallback (기존 방식으로 `generateIssues` 호출)
- `tokenUsage` 집계에 extract 단계 포함

### Step 6. 렌더러 수정 (`src/components/features/feed/FeedCardStack.tsx`)

`CardBody` 컴포넌트의 `switch` 문에 8개 신규 타입 case 추가:

| 타입 | 레이아웃 |
|------|---------|
| `delta` | 큰 수치(before → after) + period 뱃지 + context 1줄 |
| `delta-intro` | delta 레이아웃 + 주체 설명 박스 (what / whatDesc) + trigger |
| `cause` | result 강조 뱃지 + cause 본문 + sources |
| `stat` | 대형 number + label + 구분선 + reveal + sources |
| `compare` | 질문 제목 + rows 리스트(방향 아이콘) + footer |
| `impact` | items 리스트 (label / before→after / diff 뱃지) |
| `verdict` | verdict 한 문장 + reasons 불릿 리스트 |
| `question` | 질문 텍스트 + 구분선 + hint |

---

## 품질 게이트

```bash
npx tsc --noEmit   # 타입 에러 0개
npm run build      # 빌드 성공
npm run lint       # 린트 에러 0개
```

---

## 로컬 파이프라인 테스트

```bash
# 1. extract 단계 단독 테스트
# src/lib/pipeline/extract.ts 에 간단한 테스트용 main() 작성 후

# 2. 전체 파이프라인 Admin UI에서 수동 실행
npm run dev
# → /admin 접속 → Pipeline → Run 버튼
```

---

## 주요 파일 참조 경로

```
specs/092-card-type-redesign/
├── contracts/card-types.ts   # 구현 시 참조할 타입 계약
├── data-model.md             # 카드 타입 상세 제약 조건
└── research.md               # 설계 결정 근거

src/
├── types/cards.ts            # 타입 정의 (Step 1)
├── lib/cards/index.ts        # Zod 파서 (Step 2)
├── lib/pipeline/extract.ts   # 신규 파일 (Step 3)
├── lib/pipeline/generate.ts  # 수정 (Step 4)
├── lib/pipeline/index.ts     # 수정 (Step 5)
└── components/features/feed/FeedCardStack.tsx  # 수정 (Step 6)
```
