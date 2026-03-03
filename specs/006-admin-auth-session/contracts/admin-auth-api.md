# Contract: Admin Auth API

**Feature**: 006-admin-auth-session  
**Date**: 2026-03-03

---

## 1. `POST /api/admin/auth/login`

운영자 비밀번호를 검증하고 유효한 경우 Admin 세션 쿠키를 발급한다.

### Request

**Headers**

```http
Content-Type: application/json
```

**Body**

```json
{
  "password": "string",
  "next": "/admin/feed/2026-02-26"
}
```

### Validation Rules

- `password`는 필수 문자열이다.
- `password`가 비어 있거나 누락되면 잘못된 요청이다.
- `next`는 선택적이다.
- `next`가 주어질 경우 `/`로 시작하는 내부 경로만 허용한다.

### Success Response

**Status**: `200 OK`

**Body**

```json
{
  "ok": true,
  "redirect_to": "/admin/feed/2026-02-26"
}
```

**Set-Cookie**

- Admin 세션 쿠키 발급
- `HttpOnly`
- `Secure`
- `SameSite=Strict`
- `Path=/`
- `Max-Age=604800`

### Error Responses

**Status**: `400 Bad Request`

```json
{
  "ok": false,
  "error": "invalid_request"
}
```

**Status**: `401 Unauthorized`

```json
{
  "ok": false,
  "error": "invalid_password"
}
```

---

## 2. `POST /api/admin/auth/logout`

현재 Admin 세션을 제거한다.

### Request

본문 없이 호출 가능하다.

### Success Response

**Status**: `200 OK`

```json
{
  "ok": true
}
```

**Set-Cookie**

- Admin 세션 쿠키를 즉시 만료시키는 삭제 쿠키 설정

---

## 3. Protected Admin API Behavior

인증이 필요한 `/api/admin/*` 경로는 유효한 Admin 세션이 없으면 공통으로 아래 동작을 따른다.

### Unauthorized Response

**Status**: `401 Unauthorized`

```json
{
  "error": "unauthorized"
}
```

### Notes

- 인증 실패 시 응답은 redirect가 아니라 JSON 오류여야 한다.
- 만료되었거나 손상된 세션도 동일하게 `401`로 처리한다.
