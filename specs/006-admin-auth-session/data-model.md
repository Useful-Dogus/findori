# Data Model: Admin 인증/세션/미들웨어 구현

**Feature**: 006-admin-auth-session  
**Date**: 2026-03-03

---

## 핵심 엔티티

### Admin Credential

운영자 인증의 비교 기준이 되는 단일 비밀번호 구성 요소다. 저장소에 영구 저장되지 않고 런타임 환경변수로만 존재한다.

| 필드 | 타입 | 제약 |
|------|------|------|
| `password` | string | 최소 길이 16자, 환경변수로만 주입 |

---

### Admin Session Payload

로그인 성공 후 세션 토큰에 담기는 최소 인증 상태다.

| 필드 | 타입 | 제약 |
|------|------|------|
| `sub` | string | 고정값 `admin` |
| `iat` | number | 발급 시각 (epoch seconds) |
| `exp` | number | 만료 시각 (epoch seconds), `iat + 7일` |

**검증 규칙**

- `sub`가 `admin`이 아니면 무효 세션
- 현재 시각이 `exp`를 초과하면 만료 세션
- payload 서명 검증 실패 시 무효 세션

---

### Admin Session Cookie

브라우저에 저장되는 보호된 인증 전달 수단이다.

| 필드 | 타입 | 제약 |
|------|------|------|
| `name` | string | 고정된 Admin 세션 쿠키 이름 |
| `value` | string | 서명된 토큰 문자열 |
| `httpOnly` | boolean | 항상 `true` |
| `secure` | boolean | 항상 `true` |
| `sameSite` | string | 항상 `Strict` |
| `path` | string | `/` |
| `maxAge` | number | 7일 |

---

### Admin Login Request

로그인 API로 전달되는 입력 모델이다.

| 필드 | 타입 | 제약 |
|------|------|------|
| `password` | string | 필수, 빈 문자열 불가 |
| `next` | string | 선택적, 내부 경로만 허용 |

---

### Admin Login Result

로그인 API 응답 모델이다.

| 필드 | 타입 | 제약 |
|------|------|------|
| `ok` | boolean | 성공 여부 |
| `redirect_to` | string | 성공 시 이동할 내부 경로 |
| `error` | string | 실패 시 고정 에러 코드 |

에러 코드 후보:

- `invalid_request`
- `invalid_password`

---

### Admin Logout Result

로그아웃 API 응답 모델이다.

| 필드 | 타입 | 제약 |
|------|------|------|
| `ok` | boolean | 항상 `true` |

---

### Protected Admin Request

인증이 필요한 Admin 화면 또는 API 요청이다.

| 필드 | 타입 | 제약 |
|------|------|------|
| `pathname` | string | `/admin` 또는 `/api/admin` 경계에 속함 |
| `session` | Admin Session Payload \| null | 유효한 세션이면 payload, 아니면 null |

---

## 상태 전이

### 인증 상태

```text
unauthenticated
  ├─(올바른 비밀번호 제출)────────────→ authenticated
  ├─(잘못된 비밀번호 제출)────────────→ unauthenticated
  └─(잘못된 요청 본문)───────────────→ unauthenticated

authenticated
  ├─(로그아웃)──────────────────────→ unauthenticated
  ├─(세션 만료)────────────────────→ expired
  └─(세션 변조/검증 실패)──────────→ invalid

expired
  └─(재로그인)────────────────────→ authenticated

invalid
  └─(재로그인)────────────────────→ authenticated
```

### 화면/API 처리 결과

| 상태 | 보호된 화면 접근 | Admin API 접근 |
|------|------------------|----------------|
| `unauthenticated` | 로그인 화면으로 redirect | `401` |
| `authenticated` | 요청 허용 | 요청 허용 |
| `expired` | 세션 제거 후 로그인 화면으로 redirect | `401` + 세션 무효화 |
| `invalid` | 세션 제거 후 로그인 화면으로 redirect | `401` + 세션 무효화 |

---

## 파생 규칙

- 공개 화면(`/`, `/feed/*`)과 공개 API(`/api/feeds/*`, `/api/issues/*`)는 이 모델의 보호 대상이 아니다.
- 이미 인증된 운영자가 `/admin/login`으로 접근하면 `authenticated` 상태를 재활용해 보호 화면으로 이동한다.
- `next` 값은 내부 경로가 아닐 경우 안전한 기본값(`/admin`)으로 대체한다.
