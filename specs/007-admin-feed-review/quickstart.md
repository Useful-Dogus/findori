# Quickstart: Admin 피드 목록/날짜별 이슈 검토 화면

**Branch**: `007-admin-feed-review` | **Depends on**: #6 완료 (Admin 인증)

---

## 전제 조건

```bash
# 환경변수 확인 (.env.local)
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
ADMIN_PASSWORD=...
ADMIN_SESSION_SECRET=...
```

## 개발 서버

```bash
npm run dev
```

Admin 진입: http://localhost:3000/admin (로그인 필요)

---

## 구현 체크포인트

### 1. API 라우트 구현

**`GET /api/admin/feeds`** — `src/app/api/admin/feeds/route.ts`
- Supabase 서버 클라이언트로 feeds 테이블 조회 (날짜 DESC, limit 30)
- issues count 집계 포함
- `requireAdminSession` 유지

**`GET /api/admin/feeds/[date]`** — `src/app/api/admin/feeds/[date]/route.ts`
- 날짜 형식 검증 → 400 반환
- feeds + issues 조회
- `parseCards()`로 cards_data 검증

### 2. 피드 목록 화면

**`/admin` 페이지** — `src/app/(admin)/admin/page.tsx`
- Server Component로 데이터 fetch (Supabase 직접 or API 경유)
- `FeedList` 컴포넌트로 목록 렌더링
- 빈 상태 / 로딩 / 오류 상태 처리

### 3. 날짜별 이슈 화면

**`/admin/feed/[date]` 페이지** — `src/app/(admin)/admin/feed/[date]/page.tsx`
- 날짜 형식 검증 → 잘못된 날짜 UI
- Server Component로 이슈 목록 fetch
- `IssueList` 컴포넌트로 렌더링

### 4. 카드 미리보기 (Client Component)

**`IssueCardPreview`** — `src/components/features/admin/IssueCardPreview.tsx`
- `'use client'`
- `useState`로 열기/닫기 상태 관리
- `cardsParseError: true`면 오류 안내 표시

### 5. Admin 레이아웃 내비게이션

**`AdminLayout`** — `src/app/(admin)/layout.tsx`
- 상단 내비게이션: 현재 경로 표시, 로그아웃 버튼

---

## 테스트 실행

```bash
npm run test           # 전체 테스트
npm run validate       # type-check + lint + format 검사
```

### 테스트 파일 위치

```
tests/
├── unit/
│   ├── lib/
│   │   └── admin-feeds.test.ts      # API 라우트 로직 단위 테스트
│   └── components/
│       └── IssueCardPreview.test.ts # 카드 미리보기 컴포넌트 테스트
└── integration/
    └── admin-feed-review.test.ts    # 피드 목록 → 날짜별 이슈 통합 흐름
```

---

## 주요 파일 참조

| 역할                  | 경로                                                        |
| --------------------- | ----------------------------------------------------------- |
| 카드 타입 정의        | `src/types/cards.ts`                                        |
| 카드 파싱/검증        | `src/lib/cards.ts` (`parseCards`)                           |
| Admin 세션 유틸리티   | `src/lib/admin/session.ts` (`requireAdminSession`)          |
| Supabase 서버 클라이언트 | `src/lib/supabase/server.ts` (`createClient`)            |
| DB 타입               | `src/types/database.types.ts`                               |
| Admin 피드 API stub   | `src/app/api/admin/feeds/route.ts`                          |
| Admin 피드/날짜 API stub | `src/app/api/admin/feeds/[date]/route.ts`                |
| Admin 메인 페이지 stub | `src/app/(admin)/admin/page.tsx`                           |
| Admin 날짜 페이지 stub | `src/app/(admin)/admin/feed/[date]/page.tsx`               |
| Admin 레이아웃        | `src/app/(admin)/layout.tsx`                                |
