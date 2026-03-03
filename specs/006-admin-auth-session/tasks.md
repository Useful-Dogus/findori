# Tasks: Admin 인증/세션/미들웨어 구현

**Input**: Design documents from `/Users/chanheepark/dev/laboratory/findori/specs/006-admin-auth-session/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅, quickstart.md ✅

**Tests**: 명시적으로 포함 — Constitution II, spec의 Success Criteria, plan의 테스트 전략 요구사항 반영

**Organization**: User Story별 단계로 구성하여 각 스토리를 독립적으로 구현·검증 가능하게 정리

## Format: `[ID] [P?] [Story?] Description with file path`

- **[P]**: 다른 파일, 선행 미완료 작업에 의존하지 않음
- **[Story]**: 연관 User Story (`US1`, `US2`, `US3`)

---

## Phase 1: Setup

**Purpose**: 인증 기능 구현에 필요한 파일 뼈대와 공통 테스트 파일 준비

- [x] T001 Create `src/lib/admin/session.ts` with file header, exported constants, type placeholders, and TODO sections for token/cookie helpers
- [x] T002 Create `tests/unit/lib/admin-session.test.ts` with describe blocks scaffold for session token, cookie helpers, login route, and logout route scenarios

**Checkpoint**: 구현 대상 파일이 준비되어 이후 단계 작업을 순차적으로 채울 수 있음

---

## Phase 2: Foundational (모든 스토리 공통 기반)

**Purpose**: 모든 인증 흐름이 공유하는 세션 모델, 쿠키 정책, 검증 유틸리티를 완성

**⚠️ CRITICAL**: 이 단계 완료 전에는 로그인/미들웨어/API 보호 로직을 구현하지 않음

- [x] T003 Implement `AdminSessionPayload`, `AdminSessionVerificationResult`, cookie constants, and TTL constants in `src/lib/admin/session.ts`
- [x] T004 Implement token encode/sign and verify helpers in `src/lib/admin/session.ts` using `ADMIN_SESSION_SECRET` to support issued-at and expiry validation
- [x] T005 Implement `setAdminSessionCookie()`, `clearAdminSessionCookie()`, `readAdminSessionFromRequest()`, and `sanitizeAdminRedirectPath()` in `src/lib/admin/session.ts`
- [x] T006 Add foundational unit tests in `tests/unit/lib/admin-session.test.ts` for valid token verification, expired token rejection, tampered token rejection, safe redirect path sanitization, and cookie option assertions

**Checkpoint**: 공통 세션 유틸리티와 기본 단위 테스트 준비 완료

---

## Phase 3: User Story 1 - 운영자가 보호된 Admin 화면에 안전하게 진입한다 (Priority: P1) 🎯 MVP

**Goal**: 올바른 비밀번호로 로그인해 Admin 세션을 발급받고, 비로그인 상태에서는 `/admin` 보호 경로가 로그인 화면으로 강제 이동된다.

**Independent Test**: 인증되지 않은 상태에서 `/admin` 접근 시 `/admin/login`으로 이동하고, 올바른 비밀번호 로그인 후 `/admin` 또는 요청한 내부 경로로 진입할 수 있으면 통과

### Tests for User Story 1

- [x] T007 [P] [US1] Add login route tests in `tests/unit/lib/admin-session.test.ts` for `POST /api/admin/auth/login` success response, `redirect_to` handling, and `Set-Cookie` issuance
- [x] T008 [P] [US1] Add middleware-oriented tests in `tests/unit/lib/admin-session.test.ts` for unauthenticated `/admin` access redirect and authenticated `/admin/feed/[date]` pass-through expectations

### Implementation for User Story 1

- [x] T009 [US1] Implement `POST /api/admin/auth/login` in `src/app/api/admin/auth/login/route.ts` to parse body, validate password, sanitize `next`, and issue Admin session cookie on success
- [x] T010 [US1] Implement `/admin` guard flow in `src/middleware.ts` to redirect unauthenticated requests to `/admin/login?next=...` while preserving existing Supabase session update behavior
- [x] T011 [US1] Implement login form UI and submit behavior in `src/app/(admin)/admin/login/page.tsx` for password entry, next-path preservation, and successful Admin redirect
- [x] T012 [US1] Update `src/app/(admin)/layout.tsx` comments and structure so Admin layout reflects middleware-protected authenticated surface without adding extra auth logic

**Checkpoint**: 운영자가 로그인 후 Admin 보호 화면에 진입 가능, 비로그인 접근은 차단됨

---

## Phase 4: User Story 2 - 운영자가 세션 만료 및 로그아웃을 예측 가능하게 처리한다 (Priority: P2)

**Goal**: 로그인 후 세션이 7일 동안 유지되고, 로그아웃 또는 만료 시 보호 영역 접근이 즉시 끊긴다.

**Independent Test**: 로그인 후 새로고침/새 탭에서 세션이 유지되고, 로그아웃 직후 또는 만료 세션 사용 시 다시 로그인 화면으로 이동하면 통과

### Tests for User Story 2

- [x] T013 [P] [US2] Add logout route and cookie-clearing tests in `tests/unit/lib/admin-session.test.ts` covering idempotent logout and expired cookie emission
- [x] T014 [P] [US2] Add session-lifecycle tests in `tests/unit/lib/admin-session.test.ts` covering valid-session reuse and expired-session redirect behavior

### Implementation for User Story 2

- [x] T015 [US2] Implement `POST /api/admin/auth/logout` in `src/app/api/admin/auth/logout/route.ts` to always clear the Admin session cookie and return `{ ok: true }`
- [x] T016 [US2] Update `src/middleware.ts` to clear invalid or expired Admin session cookies and redirect authenticated users away from `/admin/login` to `/admin` or a safe `next` path
- [x] T017 [US2] Update `src/app/(admin)/admin/login/page.tsx` to surface session-expired/logged-out states consistently and to avoid showing the form as the default post-login path

**Checkpoint**: 세션 유지, 만료, 로그아웃 흐름이 모두 일관되게 동작함

---

## Phase 5: User Story 3 - 운영자가 실패 상황을 이해하고 다시 시도할 수 있다 (Priority: P3)

**Goal**: 잘못된 요청, 잘못된 비밀번호, 손상된 세션, 인증 없는 Admin API 호출이 민감 정보 노출 없이 일관된 실패 응답을 반환한다.

**Independent Test**: 잘못된 비밀번호와 잘못된 요청 본문은 각각 구분된 실패 응답을 주고, 손상된 세션과 인증 없는 Admin API는 모두 보호 데이터 접근을 차단하면 통과

### Tests for User Story 3

- [x] T018 [P] [US3] Add failure-case login tests in `tests/unit/lib/admin-session.test.ts` for `invalid_request` and `invalid_password` responses without session issuance
- [x] T019 [P] [US3] Add protected Admin API auth tests in `tests/unit/lib/admin-session.test.ts` covering unauthorized JSON response expectations for invalid or missing Admin session

### Implementation for User Story 3

- [x] T020 [US3] Harden `src/app/api/admin/auth/login/route.ts` to return `400 invalid_request` for malformed body and `401 invalid_password` for password mismatch without leaking sensitive details
- [x] T021 [US3] Add reusable unauthorized response/session-check helper in `src/lib/admin/session.ts` for Admin API handlers to consume
- [x] T022 [US3] Update `src/app/api/admin/feeds/route.ts` to require a valid Admin session and return `{ error: 'unauthorized' }` with `401` when missing or invalid
- [x] T023 [US3] Update `src/app/api/admin/pipeline/logs/route.ts` to require a valid Admin session and return `{ error: 'unauthorized' }` with `401` when missing or invalid

**Checkpoint**: 실패 응답과 Admin API 보호 경계가 문서 계약과 일치함

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: 회귀 방지, 품질 게이트 통과, 공개 영역 비영향 확인

- [x] T024 [P] Verify public-route non-regression in `src/middleware.ts` and `tests/unit/lib/admin-session.test.ts` so `/`, `/feed/[date]`, `/api/feeds/latest`, and `/api/issues/[id]` remain unauthenticated
- [x] T025 Run `npm run validate` and fix any issues across `src/lib/admin/session.ts`, `src/middleware.ts`, auth routes, and `tests/unit/lib/admin-session.test.ts`
- [x] T026 Run `npm run test` and confirm new auth/session tests plus existing unit tests all pass

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: 즉시 시작 가능
- **Phase 2 (Foundational)**: Phase 1 완료 후 시작, 모든 User Story 구현의 선행 조건
- **Phase 3 (US1)**: Phase 2 완료 후 시작, MVP 경로
- **Phase 4 (US2)**: US1 완료 후 시작, 세션 lifecycle 확장
- **Phase 5 (US3)**: Phase 2 완료 후 일부 테스트 작성 가능하지만, 실제 API 보호 반영은 US1 로그인/세션 유틸리티 완료 후 진행 권장
- **Phase 6 (Polish)**: 모든 대상 스토리 완료 후 시작

### User Story Dependencies

- **US1 (P1)**: Foundational 완료 후 시작, 다른 스토리에 의존 없음
- **US2 (P2)**: US1의 로그인/세션 발급 흐름에 의존
- **US3 (P3)**: Foundational 완료 후 테스트 일부는 가능하지만, Admin API 보호 구현은 US1의 세션 검증 유틸리티에 의존

### Within Each User Story

- 테스트 태스크를 먼저 작성하고, 해당 구현 태스크에서 통과시키는 순서를 따른다
- `src/lib/admin/session.ts` 수정이 선행된 후 route handler와 middleware가 이를 사용한다
- 같은 파일을 수정하는 태스크는 표기상 `[P]`여도 실제 편집은 순차적으로 진행하는 편이 안전하다

---

## Parallel Opportunities

### Foundational

```bash
Task A: "Add token verification tests in tests/unit/lib/admin-session.test.ts"   # T006 일부
Task B: "Implement cookie and redirect helpers in src/lib/admin/session.ts"       # T005
```

### User Story 1

```bash
Task A: "Add login route success tests in tests/unit/lib/admin-session.test.ts"   # T007
Task B: "Add middleware redirect tests in tests/unit/lib/admin-session.test.ts"   # T008
```

### User Story 2

```bash
Task A: "Add logout route tests in tests/unit/lib/admin-session.test.ts"          # T013
Task B: "Add session lifecycle tests in tests/unit/lib/admin-session.test.ts"     # T014
```

### User Story 3

```bash
Task A: "Add login failure-case tests in tests/unit/lib/admin-session.test.ts"    # T018
Task B: "Add protected Admin API auth tests in tests/unit/lib/admin-session.test.ts"  # T019
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational session utilities
3. Complete Phase 3: Login route, middleware protection, login page
4. **STOP and VALIDATE**: confirm unauthenticated `/admin` redirect and successful login to `/admin`
5. Demo or continue only after MVP auth boundary is stable

### Incremental Delivery

1. Setup + Foundational → reusable session core ready
2. Add US1 → protected Admin entry works
3. Add US2 → logout and expiry lifecycle works
4. Add US3 → failure contracts and Admin API protection work
5. Run Polish phase → validate no public-route regressions

---

## Notes

- `[P]` 표시는 병렬 가능성을 뜻하지만, 동일 파일 편집 충돌이 있으면 순차 실행이 안전하다.
- Admin API 보호는 우선 `src/app/api/admin/feeds/route.ts`, `src/app/api/admin/pipeline/logs/route.ts`에 적용해 계약을 고정하고, 이후 `#7~#10` 구현 시 같은 헬퍼를 다른 Admin route들로 확장한다.
- 공개 피드와 공개 API는 이 이슈의 비회귀 핵심 검증 항목이다.
