# Research: 공개 라우팅/SSR 진입 플로우

## 1. 기존 코드베이스 현황 분석

### Decision: 기존 stub을 교체하는 방식으로 구현
**Rationale**: 이미 3개의 공개 라우트 파일(`page.tsx`)이 stub 형태로 존재하며, API 함수(`getLatestPublishedDate`, `getPublicFeedByDate`, `getPublicIssueById`)도 완전 구현되어 있다. 새로 파일을 생성하는 것이 아니라 기존 stub을 실구현으로 교체하는 것이 목표다.
**Alternatives considered**: 완전 신규 파일 생성 → 불필요. 이미 라우트 구조가 확정되어 있음.

---

## 2. Next.js 15 App Router SSR 패턴

### Decision: async Server Component + generateMetadata 패턴 사용
**Rationale**: Next.js 15 App Router에서 Server Component 내에서 직접 `await` 호출로 데이터를 패칭하고, 같은 파일에서 `generateMetadata` export로 OG 태그를 설정하는 것이 표준 패턴이다. `params`는 `Promise<{...}>` 타입으로 반드시 `await params`를 수행해야 한다(기존 stub에서 이미 적용되어 있음).
**Alternatives considered**: 클라이언트 사이드 fetch + useEffect → SSR 이점 없음. Route Handler를 통한 클라이언트 fetch → 공유 링크의 즉시 렌더링 요건 불충족.

---

## 3. 에러/빈 상태 처리 방식

### Decision: 인라인 조건부 렌더링 + 전용 상태 컴포넌트 분리
**Rationale**:
- Server Component에서 `notFound()` 호출 시 `app/not-found.tsx`가 렌더링됨. 날짜 형식 오류와 이슈 미존재 케이스에 사용.
- 피드 없음(빈 날짜), API 오류는 페이지 레벨에서 캐치하여 전용 상태 컴포넌트(`FeedEmptyState`, `FeedErrorState`) 렌더링.
- 로딩 상태는 `loading.tsx` 파일로 Suspense boundary 자동 설정(Next.js 15 규약).
**Alternatives considered**: error.tsx 파일 → Client Component만 허용되어 SSR에서 throw된 에러를 받을 수 있지만, 공개 피드에서는 에러를 throw하지 않고 상태 컴포넌트를 반환하는 게 더 명확함.

---

## 4. `/feed/latest` 경로 처리 방식

### Decision: `src/app/(public)/feed/latest/page.tsx` 별도 라우트로 구현
**Rationale**: `[date]` 동적 라우트에서 `latest` 값이 들어오면 `isValidDate` 검증에서 실패해 404 처리된다. `/feed/latest`를 정식 지원하려면 별도 경로 파일이 필요하다. 루트 페이지(`/`)도 동일하게 `getLatestPublishedDate()`를 호출하여 리다이렉트한다.
**Alternatives considered**: `[date]` 내에서 `latest` 특수 처리 → 날짜 검증 로직을 오염시킴. 라우트 핸들러 redirect → 불필요한 API 레이어 추가.

---

## 5. 공유 링크 진입 시 초기 이슈 선택 상태 전달 방식

### Decision: Server Component에서 `initialIssueId` prop을 페이지 레벨 레이아웃 또는 FeedView 클라이언트 컴포넌트에 전달
**Rationale**: `/feed/[date]/issue/[id]` 진입 시 서버에서 이슈 UUID를 알고 있으므로, SSR 단계에서 `initialIssueId`를 클라이언트 컴포넌트에 prop으로 전달한다. 클라이언트 컴포넌트는 이 값을 초기 선택 상태로 사용한다. 이 스펙(#16)에서는 데이터를 SSR로 준비하는 것까지만 담당하며, 실제 스와이프/포지셔닝 처리는 #17/#18에서 구현한다.
**Alternatives considered**: URL searchParams → URL 형식 변경 없이 가능하지만 기존 라우트 설계와 맞지 않음. 쿠키/localStorage → SSR에서 접근 불가.

---

## 6. 메타데이터 설정

### Decision: `generateMetadata` 함수로 동적 OG 태그 설정
**Rationale**: Next.js 15 App Router에서 `export async function generateMetadata()` 패턴으로 각 페이지마다 `title`, `og:title`, `og:description`, `og:url`을 설정한다. `og:image`는 이 스펙에서는 정적 `/og-default.png`를 사용하고, 동적 OG 이미지는 #25에서 구현한다.
**Alternatives considered**: Head 컴포넌트 직접 사용 → App Router에서 지원 안 됨.

---

## 7. 테스트 전략

### Decision: 유틸리티 함수 단위 테스트 + 컴포넌트 시각적 확인
**Rationale**: `isValidDate`는 이미 `src/lib/public/feeds.ts`에 구현되어 있으며 단위 테스트 대상이다. Server Component 자체는 직접 단위 테스트가 어려우므로, 상태 컴포넌트(`FeedEmptyState`, `FeedErrorState`)는 독립 렌더링으로 확인한다. 핵심 데이터 패칭 함수는 #15에서 이미 구현/검증됨.
**Alternatives considered**: E2E 테스트(Playwright) → MVP 범위 외. Server Component 직접 테스트 → Next.js 15에서 실험적, 과도한 복잡성.
