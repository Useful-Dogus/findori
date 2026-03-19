# Page Contracts: 공개 라우팅/SSR 진입 플로우

## 라우트별 서버-클라이언트 계약

### 1. 루트 페이지 `/`

**Server Component 동작**:
- `getLatestPublishedDate()` 호출
- 결과에 따라 분기:

| 결과 | 동작 |
|------|------|
| 날짜 반환 | `redirect('/feed/[date]')` (영구 리다이렉트) |
| null (피드 없음) | `FeedEmptyState` 렌더링 (홈 진입용 빈 상태) |
| 예외 발생 | `FeedErrorState` 렌더링 |

---

### 2. `/feed/latest`

**Server Component 동작**: 루트 페이지(`/`)와 동일. `getLatestPublishedDate()` 호출 후 실제 날짜로 리다이렉트.

---

### 3. `/feed/[date]`

**입력**: URL params `{ date: string }`

**Server Component 동작**:

| 조건 | 동작 |
|------|------|
| `isValidDate(date)` === false | `notFound()` → app/not-found.tsx |
| `getPublicFeedByDate(date)` → `feed === null` | `FeedEmptyState` 렌더링 (빈 날짜) |
| 이슈 목록 반환 | `FeedView` 컴포넌트에 `initialData` prop 전달 |
| 예외 발생 | `FeedErrorState` 렌더링 |

**generateMetadata 출력**:
```typescript
{
  title: `${formatDate(date)} 피드 | 핀도리`,
  openGraph: {
    title: `${formatDate(date)} 이슈 카드 스트림 | 핀도리`,
    description: '오늘의 국내 주식 시장 이슈를 슬라이드로 정리했습니다.',
    url: `https://findori.app/feed/${date}`,
    images: [{ url: '/og-default.png' }],
  },
}
```

**클라이언트 컴포넌트(FeedView)에 전달하는 props**:
```typescript
type FeedViewProps = {
  date: string
  issues: PublicIssueSummary[]
  initialIssueId?: string  // 공유 링크 진입 시에만 설정
}
```

---

### 4. `/feed/[date]/issue/[id]`

**입력**: URL params `{ date: string; id: string }`

**Server Component 동작**:

| 조건 | 동작 |
|------|------|
| `isValidDate(date)` === false | `notFound()` |
| `getPublicIssueById(id)` → null | `notFound()` |
| issue.feedDate !== date | `notFound()` (URL 불일치) |
| `getPublicFeedByDate(date)` 호출 → feed 없음 | `notFound()` |
| 정상 | `FeedView` 컴포넌트에 `initialIssueId` 포함 props 전달 |
| 예외 발생 | `FeedErrorState` 렌더링 |

**generateMetadata 출력**:
```typescript
{
  title: `${issue.title} | 핀도리`,
  openGraph: {
    title: `${issue.title}`,
    description: `${issue.entityName} ${issue.changeValue ?? ''} · ${formatDate(date)}`,
    url: `https://findori.app/feed/${date}/issue/${id}`,
    images: [{ url: '/og-default.png' }],
  },
}
```

---

## 공유 상태 컴포넌트 계약

### FeedEmptyState

```typescript
type FeedEmptyStateProps = {
  date?: string  // 표시할 날짜. 없으면 일반 빈 상태 메시지 표시.
}
```

**렌더링 요건**:
- 빈 상태 메시지 노출
- 홈으로 이동 CTA 링크 포함

### FeedErrorState

```typescript
type FeedErrorStateProps = {
  // props 없음 — 일반적인 에러 메시지 + 새로고침/홈 CTA만 필요
}
```

**렌더링 요건**:
- 에러 안내 메시지 노출
- 새로고침 버튼 또는 홈으로 이동 링크 포함

---

## Loading 상태

각 라우트 세그먼트의 `loading.tsx`:
- 즉시 반환되는 스켈레톤 UI (텍스트 placeholder 수준)
- Next.js의 Suspense boundary 자동 활성화
