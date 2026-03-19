# Data Model: 공개 라우팅/SSR 진입 플로우

> 이 피처는 **읽기 전용**이다. DB 스키마/테이블 변경 없음. 기존 `lib/public/feeds.ts` 타입을 소비한다.

## 소비 타입 (기존 구현, `src/lib/public/feeds.ts`)

### PublicIssueSummary
날짜별 피드 조회 시 이슈 목록 항목.

| 필드          | 타입                                      | 설명                         |
| ------------- | ----------------------------------------- | ---------------------------- |
| id            | string (UUID)                             | 이슈 고유 ID                 |
| entityType    | 'stock' \| 'index' \| 'fx' \| 'theme'   | 이슈 엔티티 유형             |
| entityId      | string                                    | 종목코드, 지수명 등          |
| entityName    | string                                    | 노출용 이름                  |
| title         | string                                    | 이슈 제목 (Claude 생성)      |
| changeValue   | string \| null                            | 변동 수치 (예: "+6.9%")     |
| channel       | string                                    | 카드 스키마 식별자 (MVP: v1) |
| displayOrder  | number                                    | 피드 내 노출 순서            |
| cardsData     | Card[] \| null                            | 파싱된 카드 배열             |
| tags          | string[]                                  | 카테고리 태그 목록           |

### PublicIssueDetail
공유 링크 진입 시 단일 이슈 상세 데이터.

| 필드        | 타입                                      | 설명                       |
| ----------- | ----------------------------------------- | -------------------------- |
| id          | string (UUID)                             | 이슈 고유 ID               |
| feedDate    | string (YYYY-MM-DD)                       | 소속 피드 날짜             |
| entityType  | 'stock' \| 'index' \| 'fx' \| 'theme'   | 이슈 엔티티 유형           |
| entityId    | string                                    | 종목코드, 지수명 등        |
| entityName  | string                                    | 노출용 이름                |
| title       | string                                    | 이슈 제목                  |
| changeValue | string \| null                            | 변동 수치                  |
| channel     | string                                    | 카드 스키마 식별자         |
| cardsData   | Card[] \| null                            | 파싱된 카드 배열           |
| tags        | string[]                                  | 카테고리 태그 목록         |

## 페이지 레벨 상태 타입 (신규 정의)

### FeedPageData
`/feed/[date]` 페이지에서 Server Component가 내려주는 초기 데이터.

```typescript
type FeedPageState =
  | { status: 'loaded'; date: string; issues: PublicIssueSummary[] }
  | { status: 'empty'; date: string }
  | { status: 'error' }
```

### IssueSharePageData
`/feed/[date]/issue/[id]` 페이지에서 Server Component가 내려주는 초기 데이터.

```typescript
type IssueSharePageState =
  | { status: 'loaded'; date: string; issues: PublicIssueSummary[]; initialIssueId: string }
  | { status: 'error' }
```

## DB 조회 경로 (읽기 전용)

```
feeds          → status = 'published', date 조건
issues         → status = 'approved', feed_id 조건
issue_tags     → issue_id IN (이슈 목록)
tags           → issue_tags를 통해 join
```

**주의**: `getPublicFeedByDate`는 `getPublicIssueById`가 `feedDate`를 반환하므로, `/feed/[date]/issue/[id]` 진입 시 이슈의 `feedDate`와 URL의 `date` 파라미터를 대조하여 불일치 시 404 처리한다.
