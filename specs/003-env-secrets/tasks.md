# Tasks: 환경변수/시크릿 체계 구축

**Input**: Design documents from `/specs/003-env-secrets/`
**Branch**: `003-env-secrets`
**Generated**: 2026-02-27

**Organization**: 3개의 User Story를 독립적으로 구현·테스트할 수 있도록 스토리별로 구성됨.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: 다른 파일, 의존 없음 → 병렬 실행 가능
- **[Story]**: 해당 User Story 라벨 (US1, US2, US3)

---

## Phase 1: Setup

**Purpose**: zod 패키지 추가 (US3의 Zod 스키마 구현에 필요)

- [x] T001 Install zod package as a dependency (`npm install zod`)

**Checkpoint**: `package.json`에 `zod`가 추가됨. US1·US2는 즉시 시작 가능. US3은 T001 완료 후 시작.

---

## Phase 2: 없음 (No Blocking Foundational Prerequisites)

US1·US2는 파일·문서 작업으로 Phase 1 없이도 독립 시작 가능.
US3은 T001(zod 설치) 완료 후 시작 가능.

---

## Phase 3: User Story 1 - 개발자 로컬 환경 즉시 진입 (Priority: P1) 🎯 MVP

**Goal**: 개발자가 `.env.example`을 복사하고 값을 채우는 것만으로 5분 이내에 개발 서버를 기동할 수 있다.

**Independent Test**: `.env.example`을 `.env.local`로 복사 → 값 입력 → `npm run dev` → 서버 정상 기동.
`.env.example` 내용만 보고 각 변수의 용도와 발급처를 알 수 있는지 확인.

### Implementation for User Story 1

- [x] T002 [US1] Update `.env.example` to add missing variables and improve documentation

  현재 5개 변수에 누락된 2개(`ADMIN_SESSION_SECRET`, `ANTHROPIC_API_KEY`) 추가.
  각 변수 그룹 헤더 주석, 용도 설명, 발급처 URL, 생성 명령어(`openssl rand -hex N`) 포함.
  최종 내용:
  ```
  # ── Supabase (DB 접근) — Dashboard > Settings > API ─────────────
  NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
  NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
  # 서버 전용 (절대 NEXT_PUBLIC_ 붙이지 말 것, RLS 우회)
  SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

  # ── Admin 인증 ────────────────────────────────────────────────────
  # 최소 16자: openssl rand -hex 10
  ADMIN_PASSWORD=your-admin-password-min-16-chars
  # 세션 서명 키, 최소 32자: openssl rand -hex 32
  ADMIN_SESSION_SECRET=your-session-secret-min-32-chars

  # ── Anthropic (AI) — console.anthropic.com > API Keys ────────────
  ANTHROPIC_API_KEY=sk-ant-your-key-here

  # ── Cron 보안 — openssl rand -hex 16 ─────────────────────────────
  CRON_SECRET=your-random-cron-secret-min-16-chars
  ```

**Checkpoint**: `.env.example`만 읽고 7개 변수 전부 설정 가능. US1 독립 완료.

---

## Phase 4: User Story 2 - 운영자 Vercel 안전 관리 (Priority: P2)

**Goal**: 운영자가 `docs/env-setup.md` 문서만 보고 Vercel 대시보드에서 7개 변수를 모두 설정할 수 있다. 코드베이스에 하드코딩된 시크릿이 없다.

**Independent Test**: `docs/env-setup.md` 읽기만으로 Vercel Production 범위에 변수 등록 완료.
`git check-ignore -v .env.local` → gitignore에 포함 확인.
코드베이스 grep 검사 → 하드코딩 시크릿 0건.

### Implementation for User Story 2

- [x] T003 [P] [US2] Verify `.gitignore` covers all env file patterns in repo root

  현재 `.gitignore`에 `.env`, `.env.local`, `.env.*.local` 패턴이 있는지 확인.
  누락 패턴 있으면 추가. `.env.example`은 git 추적 대상임을 주석으로 명시.

- [x] T004 [US2] Create `docs/env-setup.md` with Vercel deployment guide

  포함 내용:
  - 변수 전체 목록 (7개) + Production 범위 등록 필수 여부
  - 각 변수 발급처 URL (Supabase Dashboard, Anthropic Console 등)
  - `NEXT_PUBLIC_` 변수가 빌드 시 인라인되므로 변경 후 재배포 필요하다는 경고
  - 시크릿 생성 명령어 (`openssl rand -hex N`)
  - Vercel 환경변수 설정 경로: Project > Settings > Environment Variables

**Checkpoint**: 운영자가 문서만으로 Vercel 설정 완료 가능. US2 독립 완료.

---

## Phase 5: User Story 3 - 시스템 시작 시 자동 검증 (Priority: P3)

**Goal**: `npm run dev` / `npm run build` 실행 시 누락·불량 환경변수를 시작 즉시 명확한 오류로 보고한다.

**Independent Test**: 필수 변수 1개 제거 후 `npm run dev` → 해당 변수명 명시한 오류 출력, 서버 미기동.
모든 변수 정상 제공 시 오류 없이 기동.

### Tests for User Story 3 (Constitution 요구사항: 신규 로직 → 단위 테스트 필수)

> **NOTE**: 아래 테스트를 먼저 작성하고 실패를 확인한 뒤 구현 시작

- [x] T005 [US3] Write failing unit tests in `tests/unit/lib/env.test.ts`

  4가지 시나리오:
  1. 모든 변수 정상값 제공 → `validateEnv()` 오류 없이 통과
  2. 필수 변수 1개 누락 → 해당 변수명을 포함한 오류 throw
  3. `ADMIN_SESSION_SECRET` 길이 미달(31자) → 오류 throw
  4. `ANTHROPIC_API_KEY`가 `sk-ant-` 미시작 → 오류 throw

### Implementation for User Story 3

- [x] T006 [US3] Create `src/lib/env.ts` with Zod schema, validateEnv function, and type exports

  포함 내용:
  - 서버 전용 변수 스키마 (5개): `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET`, `ANTHROPIC_API_KEY`, `CRON_SECRET`
  - 클라이언트+서버 변수 스키마 (2개): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `validateEnv()`: Zod parse 실패 시 누락 변수 목록 `console.error` + `process.exit(1)`
  - data-model.md의 검증 규칙 (url, min lengths, startsWith) 반영
  - `env` 객체 export (검증 통과 후 타입 안전 접근)

- [x] T007 [US3] Update `next.config.ts` to call validateEnv() before config definition

  `validateEnv()`를 `const nextConfig = ...` 전에 호출.
  빌드(`next build`)와 개발 서버(`next dev`) 모두에서 실행됨.

**Checkpoint**: 누락 변수 → 시작 즉시 오류. 정상 변수 → 오류 없이 기동. US3 독립 완료.

---

## Phase 6: Polish & Verification

**Purpose**: 전체 통합 검증 및 품질 확인

- [x] T008 [P] Run `npm run validate` and confirm type-check, lint, and format all pass

- [x] T009 [P] Run `npm run test` and confirm all env.test.ts scenarios pass

- [x] T010 Perform end-to-end quickstart validation per `specs/003-env-secrets/quickstart.md`

  단계:
  1. `.env.example` → `.env.local` 복사 후 실제 값 입력
  2. `npm run dev` 실행 → 오류 없이 기동 확인
  3. `.env.local`에서 `ADMIN_SESSION_SECRET` 제거 후 `npm run dev` → 오류 메시지 확인
  4. `git status`에서 `.env.local`이 추적되지 않음 확인

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: 즉시 시작 가능
- **US1 (Phase 3)**: Phase 1 불필요 — 즉시 시작 가능 (파일 수정만)
- **US2 (Phase 4)**: Phase 1 불필요 — 즉시 시작 가능 (파일 수정 + 문서 생성)
- **US3 (Phase 5)**: T001(zod 설치) 완료 후 시작
- **Polish (Phase 6)**: T005~T007 완료 후 시작

### User Story Dependencies

- **US1 (P1)**: 즉시 시작 가능 — 다른 스토리에 의존 없음
- **US2 (P2)**: 즉시 시작 가능 — 다른 스토리에 의존 없음 (US1과 병렬 가능)
- **US3 (P3)**: T001(zod) 완료 후 시작 — US1·US2와 병렬 가능

> **참고**: US1 수락 시나리오 2("누락 시 오류 메시지")는 US3 구현 후 완전히 검증 가능.
> US1의 핵심 가치(.env.example 파일 자체)는 US3 없이도 독립 달성 가능.

### Parallel Opportunities

- T002(US1)와 T003·T004(US2)는 동시 진행 가능 (서로 다른 파일)
- T001 완료 후 T005·T006은 순서대로, T003·T004는 계속 병렬 진행 가능
- T008·T009는 T007 완료 후 동시 실행 가능

---

## Parallel Example: US1 + US2 동시 진행

```
# US1과 US2를 동시에 진행:
Agent A: T002 — .env.example 업데이트
Agent B: T003 — .gitignore 확인 → T004 — docs/env-setup.md 생성

# T001 완료 후 US3 시작:
Agent A (or same): T005 → T006 → T007
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete T002 (`.env.example` 업데이트)
2. **STOP and VALIDATE**: `.env.example`만 보고 변수 설정 가능한지 확인
3. 나머지 스토리로 진행

### Incremental Delivery

1. T001 (Setup) → 즉시
2. T002 (US1) → `.env.example` 완성 → 개발자 진입 가능
3. T003 + T004 (US2) → `docs/env-setup.md` 완성 → 운영자 설정 가능
4. T005 → T006 → T007 (US3) → 자동 검증 가능 → US1 완전 달성
5. T008 + T009 + T010 (Polish) → 전체 검증

---

## Notes

- [P] 태스크 = 다른 파일, 의존 없음 → 병렬 실행 가능
- US3의 테스트(T005)는 구현(T006) 전에 작성하고 실패 확인 필수 (Constitution II 준수)
- `ADMIN_SESSION_SECRET`·`ANTHROPIC_API_KEY`는 현재 코드 미참조이나 스키마에 선행 등록 (향후 #6, #13 이슈 준비)
- `NEXT_PUBLIC_SUPABASE_URL` 등 클라이언트 노출 변수는 Zod `z.string().url()`으로 형식 검증
- 완료 후 커밋 전 `npm run validate` 통과 필수
