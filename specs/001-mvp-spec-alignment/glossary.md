# MVP Alignment Glossary

| Canonical Term | Definition | Allowed Aliases | Deprecated / Avoid | Applies To |
|---|---|---|---|---|
| 이슈 카드 | 사용자가 소비하는 최소 콘텐츠 단위 | 카드 | 슬라이드(단독 사용) | PRD, SRS, Feature Spec |
| 이슈 카드 스트림 | 특정 날짜에 발행되는 이슈 카드의 순차 묶음 | 피드, 일일 스트림 | 슬라이드 스트림 | PRD, Feature Spec |
| cards_data | 파이프라인이 생성하는 카드 배열 JSON (DB: issues.cards_data JSONB). visual 필드에 hex 색상값 포함. React 컴포넌트가 이 값을 읽어 렌더링 | 카드 데이터 | 카드 이미지, 카드 HTML | Feature Spec, SRS |
| 카드 렌더링 | React 컴포넌트가 cards_data JSON의 visual.* hex값을 CSS gradient로 적용하여 카드 UI를 표시하는 것. Claude는 JSON만 생성하며 HTML/CSS/이미지는 생성하지 않음 | 없음 | 카드 디자인 생성, AI 렌더링 | Feature Spec, SRS |
| 상태: loading | 데이터를 불러오는 중 사용자에게 보여주는 상태 | 로딩 | 없음 | Feature Spec, PRD |
| 상태: empty | 대상 날짜/조건에 콘텐츠가 없는 상태 | 빈 상태 | 없음 | Feature Spec, PRD |
| 상태: error | 요청 실패/공유 실패/출처 실패 등 복구가 필요한 상태 | 오류 상태 | 없음 | Feature Spec, SRS |
| 출처 링크 | 주장/수치의 근거를 확인하는 외부 링크 | source link | 출처 생략 | PRD, SRS, Feature Spec |
