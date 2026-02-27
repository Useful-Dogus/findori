# Research: 카드 스키마 타입/검증 레이어

**Feature**: 005-cards-schema-types
**Date**: 2026-02-27

---

## Decision 1: 런타임 검증 라이브러리

- **Decision**: Zod 사용
- **Rationale**: 이미 프로젝트 의존성에 포함됨(`src/lib/env.ts`에서 동일 패턴 사용). `z.discriminatedUnion()`으로 7가지 카드 타입의 discriminated union을 자연스럽게 표현 가능. `safeParse()`가 에러 누적/보고에 적합.
- **Alternatives considered**:
  - 수동 타입 가드 (if-else): 각 필드를 직접 검사해야 하므로 코드가 장황하고 누락 위험 높음. Zod보다 유지보수 부담이 큼.
  - `io-ts`: 강력하지만 학습 곡선이 높고 프로젝트에 없음.

---

## Decision 2: 파일 위치

- **Decision**: Zod 스키마 및 검증 함수를 `src/lib/cards.ts`에 배치
- **Rationale**: `src/types/cards.ts`는 "스키마 구조 변경 금지" 주석이 명시되어 있어 수정하지 않는다. `src/lib/`는 기존 `env.ts`, `utils.ts` 패턴과 동일한 위치. 클라이언트/서버 양측에서 import 가능.
- **Alternatives considered**:
  - `src/types/cards.ts`에 Zod 추가: 파일 목적 혼재(타입 정의 + 런타임 로직), 주석 금지 위반.
  - `src/lib/cards/index.ts` (디렉토리 구조): MVP 규모에서 과도. 단일 파일로 충분.

---

## Decision 3: 검증 함수 반환 타입

- **Decision**: Zod `safeParse()` 결과를 래핑하여 `{ success: true; data: Card[] } | { success: false; errors: string[] }` 반환
- **Rationale**: `safeParse()`는 예외 없이 결과를 반환하므로 호출 코드가 try/catch 없이 분기 가능. `null` 입력은 별도로 먼저 처리하여 `{ success: true; data: null }` 반환.
- **Alternatives considered**:
  - `parse()` (예외 throw): 호출 코드가 항상 try/catch 필요, 불편.
  - `undefined` 반환 시 에러 무시: 에러 원인을 알 수 없어 디버깅 불가.

---

## Decision 4: 타입 가드 구현 방식

- **Decision**: `card.type === 'cover'` 비교를 사용하는 단순 타입 가드 함수
- **Rationale**: TypeScript가 리터럴 타입을 이미 알고 있으므로 `card is CoverCard` 타입 술어만 추가하면 컴파일러가 타입을 좁혀줌. Zod schema의 `safeParse()`보다 훨씬 경량.
- **Alternatives considered**:
  - 각 타입마다 Zod schema로 파싱: 이미 배열 검증을 통과한 카드에 중복 검증이 발생.

---

## Decision 5: hex 색상 검증 방식

- **Decision**: `Zod.string().regex(/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/)` 정규식
- **Rationale**: SRS § 4.2에서 `#RGB`와 `#RRGGBB` 형식만 허용, Tailwind 클래스 금지가 명시됨. 정규식으로 간결하게 표현 가능.
- **Alternatives considered**:
  - `color` 라이브러리 사용: 과도한 의존성. CSS named color나 rgba 등을 허용하게 되어 의도와 다름.

---

## 사전 조건 확인

| 항목 | 상태 |
|------|------|
| `zod` 의존성 | ✅ 이미 설치됨 |
| `src/types/cards.ts` 타입 정의 | ✅ 기존 파일 활용, 수정 없음 |
| Vitest 테스트 환경 | ✅ `tests/unit/` 패턴 확립됨 |
| `@/` path alias | ✅ tsconfig + vitest 양쪽에서 동작 확인 |
