# Quickstart: Admin 인증/세션/미들웨어 구현

**Feature**: 006-admin-auth-session

---

## 대상 파일

| 역할 | 경로 |
|------|------|
| 로그인 화면 | `src/app/(admin)/admin/login/page.tsx` |
| 로그인 API | `src/app/api/admin/auth/login/route.ts` |
| 로그아웃 API | `src/app/api/admin/auth/logout/route.ts` |
| 세션 유틸리티 | `src/lib/admin/session.ts` |
| 경로 보호 미들웨어 | `src/middleware.ts` |
| 단위 테스트 | `tests/unit/lib/admin-session.test.ts` |

---

## 구현 순서

1. `src/lib/admin/session.ts`에 세션 payload, 토큰 생성/검증, 쿠키 설정/삭제 헬퍼를 만든다.
2. `POST /api/admin/auth/login`에서 요청 본문 검증, 비밀번호 비교, 세션 쿠키 발급을 구현한다.
3. `POST /api/admin/auth/logout`에서 세션 쿠키 제거를 구현한다.
4. `src/middleware.ts`에서 `/admin/login` 제외 `/admin/*` 경로의 세션 검증과 redirect를 구현한다.
5. `src/app/(admin)/admin/login/page.tsx`에 비밀번호 입력 폼과 실패 상태 표시를 넣는다.
6. `tests/unit/lib/admin-session.test.ts`로 토큰 위변조/만료/쿠키 속성/redirect path 정규화를 검증한다.

---

## 수동 검증 시나리오

### 1. 비로그인 보호 경로 차단

```bash
npm run dev
```

- 브라우저에서 `/admin` 접근
- 기대 결과: `/admin/login`으로 이동

### 2. 로그인 성공

- 로그인 화면에서 올바른 `ADMIN_PASSWORD` 입력
- 기대 결과: `/admin` 또는 요청한 내부 경로로 이동

### 3. 로그인 실패

- 잘못된 비밀번호 입력
- 기대 결과: 로그인 실패 메시지 유지, 보호 경로 진입 불가

### 4. 세션 유지

- 로그인 성공 후 새로고침 또는 새 탭에서 `/admin/sources` 접근
- 기대 결과: 재로그인 없이 접근 유지

### 5. 로그아웃

- 로그아웃 API 실행 또는 로그아웃 버튼 연결 후 수행
- 기대 결과: 이후 `/admin` 재접근 시 다시 로그인 화면으로 이동

---

## 테스트 및 검증 명령

```bash
npm run validate
npm run test
```

인증 이슈만 빠르게 확인할 때:

```bash
npx vitest run tests/unit/lib/admin-session.test.ts
```

---

## 완료 체크

- 보호된 Admin 화면은 비로그인 접근 시 항상 로그인으로 이동한다.
- Admin API는 인증 없이 데이터 응답을 주지 않는다.
- 세션 쿠키는 `httpOnly`, `Secure`, `SameSite=Strict`, `maxAge=604800`을 가진다.
- 공개 피드와 공개 API는 기존처럼 비로그인 접근이 유지된다.
