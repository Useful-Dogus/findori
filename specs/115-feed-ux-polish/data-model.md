# Data Model: 유저 피드 화면 UX 폴리싱

## FeedHeaderState

- Represents: 피드 상단 헤더에 노출되는 최소 맥락 정보
- Fields:
  - `date`: 현재 피드 날짜
  - `issueCount`: 현재 피드 이슈 수
  - `previousDate`: 이전 발행일 링크 존재 여부
  - `showDescriptor`: 소개 문구 노출 여부, 이번 작업에서 기본값은 false

## ContextIssueSummary

- Represents: 대표 지수·환율용 요약 카드 데이터
- Fields:
  - `entityId`
  - `entityName`
  - `entityType`
  - `issue`: 원본 이슈 존재 여부
  - `summary`
  - `source`
  - `isRenderable`: 실제 데이터가 있어 렌더링 가능한지 여부

## IssueFeedMeta

- Represents: 이슈 카드 블록 외부에 남겨둘 최소 메타 정보
- Fields:
  - `entityType`
  - `entityName`
  - `title`
  - `changeValue`
  - `visibleTags`: 실제 노출할 태그 목록
  - `cardCount`
- Rules:
  - 카드 외부에서는 중복 정보 노출을 최소화한다.
  - 범용 태그나 정보 가치가 낮은 태그는 제외 가능하다.

## FeedCardPresentation

- Represents: 개별 카드의 렌더링 상태
- Fields:
  - `activeIndex`
  - `totalCards`
  - `imageUrl`
  - `imageReady`
  - `showNavigationHint`
  - `showTypeLabel`
  - `desktopDensity`
- Rules:
  - 카드 이미지와 텍스트는 완성된 한 장의 카드처럼 보여야 한다.
  - `showNavigationHint`는 이번 작업에서 false를 기본값으로 한다.
  - `desktopDensity`는 넓은 화면에서 타이포/간격 완화를 위한 표현 속성이다.

## FeedDisclaimerPlacement

- Represents: 면책 문구의 노출 위치 정책
- Fields:
  - `placement`: top | bottom
  - `isVisibleAboveFold`
- Rules:
  - 이번 작업의 목표 상태는 `placement = bottom`
  - 첫 화면에서 기본적으로 노출되지 않아야 한다
