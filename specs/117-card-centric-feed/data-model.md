# Data Model: 카드 중심 피드 리디자인

## 변경 없음

이 기능은 **순수 UI 레이아웃 변경**이다. 데이터 모델, API, DB 스키마에 변경이 없다.

기존 `PublicIssueSummary` 타입(from `@/lib/public/feeds`)을 그대로 사용한다.

## 참조 타입 (변경 없음)

```typescript
// src/lib/public/feeds.ts (참조용, 변경 없음)
type PublicIssueSummary = {
  id: string
  entityId: string
  entityName: string
  entityType: 'stock' | 'index' | 'fx' | 'theme'
  title: string
  changeValue: string | null
  tags: string[]
  cardsData: Card[] | null
}
```

## 레이아웃 개념 모델

| 영역 | 구성 요소 | 위치 |
|------|-----------|------|
| 카드 스택 | FeedCardStack (슬라이드+진행률+이전/다음) | 이슈 섹션 상단 |
| 캡션 | entityName(소) + title(중) + [changeValue+entityType(소)] + shareButton(우) | 카드 스택 아래 |
| 이슈 구분 | 수직 여백 (구분선 없음) | 이슈 사이 |
