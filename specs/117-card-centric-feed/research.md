# Research: 카드 중심 피드 리디자인

## Decision 1: max-width 값 선택

**Decision**: `max-w-2xl` (640px) — 데스크톱 카드 최대 폭

**Rationale**: 스펙에서 480px은 너무 좁다고 명시. Tailwind 기본값 기준:
- `max-w-md` = 448px (너무 좁음)
- `max-w-lg` = 512px (약간 좁음)
- `max-w-2xl` = 672px (적정 — 모바일 카드 비율과 자연스럽게 연결)
- `max-w-3xl` = 768px (데스크톱에서 지나치게 넓어 4:5 카드가 화면을 압도)

640-680px 범위가 데스크톱에서 카드 중심 피드의 표준적인 너비이며, 노안 배려를 위해 텍스트는 `sm:` 이상 breakpoint에서 한 단계 업스케일.

**Alternatives considered**: max-w-3xl — 너무 넓어 카드가 화면을 과도하게 차지함

---

## Decision 2: 이슈 간 여백 값

**Decision**: 섹션 사이 `py-8` (32px top/bottom) → 이슈 간 실질 여백 64px

**Rationale**: 이슈 컨테이너 박스 제거 후 이슈 경계가 명확해야 함. 카드(4:5 비율)는 자체적으로 시각적 무게감이 있으므로 64px 여백이면 구분선 없이도 명확히 구분됨. Instagram/TikTok 피드 참고.

**Alternatives considered**: 구분선(1px) 추가 — 스펙에서 명시적으로 거부(Q4 A)

---

## Decision 3: initialIssueId 강조 처리

**Decision**: `ring` 클래스를 카드 스택 wrapper div에 적용 (컨테이너 제거 후 대안)

**Rationale**: 기존 컨테이너 `<section>`에 ring이 있었으나 컨테이너 제거 후 section은 보이지 않는 구조. 카드 스택을 감싸는 wrapper에 ring 적용이 가장 자연스러운 대안.

**Alternatives considered**: section에 유지 — 컨테이너 제거 후 section은 투명하므로 ring이 보이지 않음

---

## Decision 4: 캡션 텍스트 크기 (데스크톱)

**Decision**: 모바일 기본 + `sm:` breakpoint 업스케일
- entityName: `text-xs sm:text-sm`
- title: `text-sm sm:text-base`
- meta(changeValue, tags): `text-xs sm:text-sm`

**Rationale**: 노안 배려를 위해 sm(640px+) 이상에서 한 단계 크게. 카드 내부(CardBody)도 `md:` breakpoint에서 이미 업스케일되므로 캡션도 일관성 있게 대응.

**Alternatives considered**: 별도 lg: breakpoint 사용 — 불필요한 복잡도. sm: 만으로 충분.
