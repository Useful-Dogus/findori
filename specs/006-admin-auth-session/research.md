# Research: Admin 인증/세션/미들웨어 구현

**Feature**: 006-admin-auth-session  
**Date**: 2026-03-03

---

## Decision 1: 세션 저장 방식

- **Decision**: 서버 저장소 없이 서명된 stateless 쿠키를 사용한다.
- **Rationale**: MVP 운영자는 1인이고 세션 개수도 매우 작다. DB나 외부 세션 저장소 없이도 `ADMIN_SESSION_SECRET`으로 서명한 토큰만으로 로그인 상태를 검증할 수 있어 구현과 운영이 단순하다. middleware와 Route Handler가 같은 검증 함수를 공유하기도 쉽다.
- **Alternatives considered**:
  - DB 기반 세션 테이블: 세션 강제 폐기나 감사에는 유리하지만 현재 범위에 비해 복잡도가 크다.
  - Supabase Auth 재사용: 운영자 단일 비밀번호 방식이라는 MVP 문서 기준과 맞지 않고, 별도 사용자 관리 흐름이 불필요하게 생긴다.

---

## Decision 2: 세션 토큰 구조

- **Decision**: `sub`, `iat`, `exp`를 포함한 최소 payload를 직렬화하고 서명한다.
- **Rationale**: 운영자 단일 사용자 모델에서는 추가 claim이 필요 없다. `iat`와 `exp`만 있으면 발급 시점과 만료 시점을 검증할 수 있고, `sub: "admin"`으로 토큰 목적을 구분할 수 있다.
- **Alternatives considered**:
  - JWT 전체 스펙 도입: 표준적이지만 신규 라이브러리 도입 없이 구현하기엔 과하고, 실제 필요한 필드가 적다.
  - 단순 랜덤 문자열: 서버 측 저장소 없이는 유효성 검증과 만료 검증을 수행할 수 없다.

---

## Decision 3: 세션 검증 경계

- **Decision**: 화면 보호는 middleware에서, Admin API 보호는 공통 세션 검증 유틸리티를 통해 Route Handler에서 수행한다.
- **Rationale**: middleware는 `/admin` 화면 접근을 초기 단계에서 차단하는 데 적합하다. 반면 `/api/admin/*`는 JSON 응답이 필요하므로 redirect 대신 명시적 `401` 응답을 주는 편이 맞다. 둘 다 같은 검증 함수를 써야 정책이 어긋나지 않는다.
- **Alternatives considered**:
  - 모든 보호를 middleware에만 위임: API 실패 응답 제어가 거칠어지고 향후 예외 분기가 어려워진다.
  - 각 Route Handler에서만 검사: 화면 진입 보호가 느슨해지고 중복 코드가 커진다.

---

## Decision 4: 로그인 실패와 잘못된 요청 구분

- **Decision**: 요청 형식 오류는 `400`, 비밀번호 불일치는 `401`로 분리한다.
- **Rationale**: 운영자 디버깅과 테스트에서 “잘못된 요청”과 “인증 실패”를 구분할 수 있어야 한다. 동시에 응답 본문에는 비밀번호 자체나 내부 검증 로직 같은 민감 정보를 포함하지 않는다.
- **Alternatives considered**:
  - 모든 실패를 `401`로 통합: 단순하지만 테스트와 디버깅에서 원인 분리가 어렵다.
  - 세부 실패 원인 과다 노출: 운영 편의는 약간 좋아질 수 있으나 불필요한 정보 노출이 발생한다.

---

## Decision 5: 로그인 후 복귀 경로 처리

- **Decision**: `next` 쿼리 파라미터로 원래 요청한 내부 경로를 유지하되, `/`로 시작하는 내부 경로만 허용한다.
- **Rationale**: 보호된 경로에 직접 접근한 운영자가 로그인 후 원래 화면으로 복귀해야 UX가 자연스럽다. 다만 외부 URL을 허용하면 open redirect 취약점이 생기므로 내부 경로로 제한해야 한다.
- **Alternatives considered**:
  - 항상 `/admin`으로만 이동: 단순하지만 직접 진입한 세부 화면 복귀가 끊긴다.
  - 임의 URL 허용: 구현은 쉽지만 보안상 허용할 수 없다.

---

## Decision 6: 신규 의존성 도입 여부

- **Decision**: 신규 인증 라이브러리를 추가하지 않는다.
- **Rationale**: 현재 요구사항은 단일 비밀번호 + 쿠키 서명 검증으로 충분하다. 내장 런타임 기능과 기존 프로젝트 의존성만으로 요구사항을 충족할 수 있어 번들/학습/유지비를 늘릴 이유가 없다.
- **Alternatives considered**:
  - `jose` 또는 세션 라이브러리 도입: 장기적으로 확장 여지는 있으나 MVP 범위에서는 과도하다.
  - 외부 Auth SaaS 연동: 이슈 범위를 크게 벗어난다.

---

## 사전 조건 확인

| 항목 | 상태 |
|------|------|
| `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET` 환경변수 스키마 | ✅ 이미 정의됨 |
| `/admin` 및 auth route 스텁 존재 | ✅ 구현 진입점 확보 |
| Vitest 테스트 패턴 | ✅ `tests/unit/lib/*.test.ts` 패턴 활용 가능 |
| 공개 라우트와 Admin 라우트 분리 구조 | ✅ App Router route group으로 분리됨 |
