# Feature Specification: 환경변수/시크릿 체계 구축

**Feature Branch**: `003-env-secrets`
**Created**: 2026-02-27
**Status**: Draft
**Input**: User description: "#3 환경변수/시크릿 체계 구축 (Admin/Cron/Supabase/Anthropic)"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - 개발자가 로컬 환경에서 즉시 시작할 수 있다 (Priority: P1)

신규 개발자(또는 본인)가 저장소를 클론한 뒤, `.env.local.example` 파일만 복사·값 입력하면 개발 서버가 정상 기동된다. 어떤 환경변수가 필요하고 어떤 형식인지 코드를 파헤치지 않아도 알 수 있다.

**Why this priority**: 개발 환경 진입 장벽이 없어야 이후 모든 기능 이슈(#4~#32)가 원활하게 진행된다. Foundation 트랙의 핵심 선행 조건이다.

**Independent Test**: `.env.local.example`을 복사해 실제 값을 채운 뒤 `npm run dev`를 실행하여 서버가 오류 없이 구동되면 완료. 환경변수 누락 시 명확한 오류 메시지가 출력되어야 한다.

**Acceptance Scenarios**:

1. **Given** 저장소를 클론한 상태, **When** `.env.local.example`을 `.env.local`로 복사하고 모든 값을 입력한 뒤 개발 서버를 시작하면, **Then** 서버가 오류 없이 기동된다.
2. **Given** 필수 환경변수 중 하나가 누락된 상태, **When** 개발 서버를 시작하면, **Then** 어떤 변수가 누락되었는지 명시한 오류 메시지가 출력되고 서버는 시작되지 않는다.
3. **Given** `.env.local.example` 파일, **When** 내용을 확인하면, **Then** 모든 변수에 용도 설명 주석과 예시 값(또는 플레이스홀더)이 포함되어 있다.

---

### User Story 2 - 운영자가 Vercel 대시보드에서 시크릿을 안전하게 관리한다 (Priority: P2)

운영자는 코드 변경 없이 Vercel 대시보드에서 환경변수를 추가·수정·삭제할 수 있다. 시크릿이 코드베이스나 git 히스토리에 노출되지 않는다는 보장이 문서화된다.

**Why this priority**: 프로덕션 배포 시 시크릿이 코드에 하드코딩되지 않아야 하며, 운영자가 어떤 변수를 어떤 환경(Production/Preview)에 설정해야 하는지 명확히 알아야 한다.

**Independent Test**: `docs/env-setup.md`(또는 README의 관련 섹션)를 읽고 Vercel 대시보드 조작만으로 모든 환경변수를 설정 가능한지 확인. 코드에 하드코딩된 시크릿이 없는지 grep 검사로 확인.

**Acceptance Scenarios**:

1. **Given** 운영자가 Vercel 대시보드에 접근한 상태, **When** 환경변수 설정 가이드를 참고하면, **Then** 어떤 변수를 Production 범위에 등록해야 하는지 명확히 알 수 있다.
2. **Given** 코드베이스 전체, **When** 시크릿 패턴(API 키, 비밀번호, 서명 키)을 grep으로 검색하면, **Then** 하드코딩된 값이 발견되지 않는다.
3. **Given** `.env.local`이 존재하는 상태, **When** git status를 확인하면, **Then** `.env.local`은 추적되지 않는다(`.gitignore`에 포함).

---

### User Story 3 - 시스템이 시작 시 필수 환경변수를 검증한다 (Priority: P3)

서버가 시작될 때 필수 환경변수의 존재 여부를 자동으로 검증한다. 누락된 변수가 있으면 런타임 중간에 예기치 않게 실패하는 대신 시작 시점에 명확한 오류로 알려준다.

**Why this priority**: 조용한 실패(silent failure)를 방지하여 디버깅 시간을 줄인다. P1, P2가 완료된 이후 안전망으로 추가할 수 있다.

**Independent Test**: 필수 환경변수를 의도적으로 제거한 뒤 서버를 시작하여 어떤 변수가 누락되었는지 명시하는 오류 메시지가 출력되는지 확인.

**Acceptance Scenarios**:

1. **Given** 필수 환경변수 중 하나라도 비어 있는 상태, **When** 서버가 시작되면, **Then** 해당 변수명과 함께 "누락된 환경변수" 메시지가 출력되고 프로세스가 종료된다.
2. **Given** 모든 필수 환경변수가 설정된 상태, **When** 서버가 시작되면, **Then** 검증 오류 없이 정상 기동된다.

---

### Edge Cases

- `NEXT_PUBLIC_` 접두사가 있는 변수(클라이언트 노출)와 서버 전용 변수가 혼동될 경우 어떻게 처리하나?
- 환경변수 값 자체에 특수문자(`=`, `#`, 공백 등)가 포함된 경우 `.env.local` 파싱이 올바르게 되는가?
- `ADMIN_SESSION_SECRET`처럼 충분한 엔트로피가 필요한 값에 짧은 문자열이 입력되면 어떻게 되는가?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: 시스템은 모든 필수 환경변수 목록과 용도 설명을 담은 `.env.local.example` 파일을 제공해야 한다.
- **FR-002**: `.env.local` 및 실제 값이 담긴 환경변수 파일은 git 추적 대상에서 제외되어야 한다.
- **FR-003**: 시스템은 시작 시 필수 환경변수의 존재 여부를 검증하고, 누락 시 어떤 변수가 없는지 명시한 오류를 출력해야 한다.
- **FR-004**: 모든 시크릿(API 키, 비밀번호, 서명 키)은 코드베이스에 하드코딩해서는 안 된다.
- **FR-005**: 환경변수는 용도별로 Admin / Supabase / Anthropic / Cron 4개 그룹으로 분류하여 문서화되어야 한다.
- **FR-006**: `NEXT_PUBLIC_` 접두사 변수(클라이언트 노출)와 서버 전용 변수가 명확히 구분되어 문서화되어야 한다.
- **FR-007**: 운영자 가이드 문서는 각 변수의 발급 방법(어떤 서비스 대시보드에서 확인하는지)을 포함해야 한다.

### Key Entities

- **환경변수 그룹**:
  - *Admin* — `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET` (관리자 인증 및 세션 서명)
  - *Supabase* — `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (DB 접근)
  - *Anthropic* — `ANTHROPIC_API_KEY` (Claude API 인증)
  - *Cron* — `CRON_SECRET` (파이프라인 엔드포인트 요청 검증)

- **노출 범위**:
  - *클라이언트 노출 가능*: `NEXT_PUBLIC_` 접두사 변수 (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`)
  - *서버 전용*: 나머지 모든 변수 (`ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`, `CRON_SECRET`)

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 저장소를 클론한 뒤 `.env.local.example`을 복사하고 값을 채우는 것만으로 개발 서버를 5분 이내에 정상 기동할 수 있다.
- **SC-002**: 코드베이스 전체에서 하드코딩된 시크릿 패턴이 발견되지 않는다(자동 grep 검사 기준 0건).
- **SC-003**: 필수 환경변수가 1개라도 누락된 경우, 서버 시작 시 100% 오류로 감지·보고된다(런타임 중간 실패 0건).
- **SC-004**: 환경변수 문서(또는 `.env.local.example` 주석)만 읽고 운영자가 Vercel 대시보드에서 모든 변수를 독립적으로 설정할 수 있다.

## Assumptions

- 배포 환경은 Vercel 단일(Production) 운영이며, Preview 환경은 별도 관리 대상이 아니다(MVP 기간).
- `CRON_SECRET`은 Vercel Cron 요청의 `Authorization` 헤더 검증에 사용되며, 별도 생성 절차가 필요하다.
- `ADMIN_SESSION_SECRET`은 충분한 길이(32자 이상)의 무작위 문자열이 필요하다는 안내를 문서에 포함한다.
- 환경변수 검증 로직은 서버 시작 진입점에 위치하며, 클라이언트 사이드에서는 동작하지 않는다.
- `.env.local.example`은 플레이스홀더 값(예: `your-admin-password-here`)만 포함하며 실제 시크릿은 포함하지 않는다.
