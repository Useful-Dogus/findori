# Feature Specification: 카드 생성 품질 개선 — 투자자 내러티브 + 비주얼 디자인 가이드

**Feature Branch**: `013-claude-card-gen` (enhancement commit)
**Spec Directory**: `053-card-gen-quality`
**GitHub Issue**: #53
**Created**: 2026-03-06
**Status**: Draft
**Input**: 투자자 관점("왜 올랐나?" "더 오를까?") 내러티브 중심의 카드 생성 + 분위기 반영 비주얼 디자인 가이드

## 배경

이슈 #13에서 구현한 `buildSystemPrompt()`는 7개 카드 타입의 스키마 제약을 명시하지만, **어떤 이야기 흐름**으로 카드를 배열해야 하는지와 **어떤 시각적 분위기**를 선택해야 하는지를 안내하지 않는다.

Claude와의 단일 대화 실험에서는 (참고: `specs/053-card-gen-quality/reference.md`) 다음 흐름으로 고품질 카드 뉴스가 생성됐다:

1. **핵심 요약** → cover에서 투자자 질문 형태로 제시
2. **가격 변동 이유** → reason 카드에서 "왜 올랐나?" 답변
3. **상승/하락 논거** → bullish/bearish로 양면성 제시
4. **커뮤니티 반응** → community 카드로 실제 투자자 반응 연상
5. **핵심 수치** → stats 카드로 판단 근거 제공
6. **출처** → source로 신뢰성 보증

이 스펙은 해당 흐름을 `buildSystemPrompt()`에 내재화하여 **파이프라인 자동 실행 시에도 동일 수준의 품질**을 확보하는 것을 목표로 한다.

---

## User Scenarios & Testing

### User Story 1 — 투자자 질문 중심 내러티브 흐름 (Priority: P1)

Admin이 파이프라인을 실행하면, 생성된 카드들이 "왜 올랐나?" → "더 오를까?" 관점의 일관된 스토리 흐름을 갖는다. cover 카드는 투자자가 즉시 공감할 수 있는 핵심 질문 또는 결론을 제시하고, 이후 카드들이 그 답변을 순서대로 전개한다.

**Why this priority**: 카드 뉴스의 핵심 가치는 "읽는 데 30초, 이해는 깊게"다. 내러티브 흐름 없이는 카드를 넘겨도 스토리가 연결되지 않아 사용자 이탈로 이어진다.

**Independent Test**: 실제 기사 데이터 없이 mock API 응답만으로 `generateIssues()`를 호출하여, 반환된 카드의 순서와 title 문구가 투자자 관점 내러티브를 따르는지 검증할 수 있다.

**Acceptance Scenarios**:

1. **Given** 특정 종목의 상승 뉴스 기사가 입력될 때, **When** `generateIssues()`가 실행되면, **Then** cover 카드의 title에 등락 수치 또는 핵심 모멘텀이 첫 줄에 명시되고, 후속 카드(reason/bullish)가 그 이유를 설명하는 순서로 구성된다
2. **Given** 하락/리스크 기사가 입력될 때, **When** 카드가 생성되면, **Then** bearish 카드가 반드시 포함되고 cover에 경고 신호가 반영된다
3. **Given** 기사가 충분하지 않을 때, **When** 카드를 생성하면, **Then** 억지로 bullish/bearish 양쪽을 모두 채우지 않고 근거 있는 카드만 포함된다

---

### User Story 2 — 이슈 분위기 반영 비주얼 팔레트 (Priority: P2)

생성된 모든 카드의 `visual` 색상이 해당 이슈의 분위기(상승/하락/중립)를 시각적으로 표현한다. 상승 이슈는 warm/vivid 계열, 하락/리스크 이슈는 cool/muted 계열, 중립 이슈는 모노크롬 계열을 사용한다.

**Why this priority**: 사용자는 카드를 빠르게 스와이프하며 소비한다. 색상이 내용과 일치할 때 인지 부하가 줄고 감성적 연결이 강화된다.

**Independent Test**: mock AI 응답의 `visual` hex 값이 색상 계열 분류 기준(hue 범위)을 만족하는지 단위 테스트로 검증할 수 있다.

**Acceptance Scenarios**:

1. **Given** 상승 종목 이슈일 때, **When** 카드가 생성되면, **Then** 모든 카드의 `visual.bg_from` ~ `visual.bg_to`가 warm 계열(빨강-주황-노랑 계열, hue 0–60) 또는 vivid green(hue 100–150) hex 코드로 구성된다
2. **Given** 하락/리스크 이슈일 때, **When** 카드가 생성되면, **Then** cool 계열(파랑-남색 계열, hue 200–270) 또는 dark muted hex 코드로 구성된다
3. **Given** 동일 이슈 내 모든 카드에 대해, **When** 색상을 나열하면, **Then** 이슈 단위로 색상 팔레트가 일관성을 유지한다(hue 범위 60° 이내)

---

### User Story 3 — community·stats 카드 콘텐츠 품질 (Priority: P3)

`community` 카드의 quotes는 실제 투자자 커뮤니티(주식 갤러리, 재테크 커뮤니티 등)에서 실제로 나올 법한 반응을 연상시키는 생동감 있는 인용문으로 구성된다. `stats` 카드의 items는 해당 이슈 판단에 실제로 필요한 지표(등락률, 거래량, 시가총액 변화, 밸류에이션 등)를 우선한다.

**Why this priority**: community와 stats 카드는 "더 오를까?" 판단을 위한 보조 정보다. 형식은 갖췄지만 내용이 없으면 사용자 신뢰를 잃는다.

**Independent Test**: 카드 스키마 검증(parseCards())과 별도로, community.quotes의 mood 분포와 stats.items의 label 유의미성을 검토하는 수동 테스트로 확인 가능하다.

**Acceptance Scenarios**:

1. **Given** 이슈에 커뮤니티 반응을 유추할 수 있는 기사가 있을 때, **When** community 카드가 생성되면, **Then** quotes 배열이 최소 2개 이상이고, mood가 "positive" / "negative" / "neutral" 중 적절히 분배된다
2. **Given** stats 카드가 생성될 때, **When** items를 확인하면, **Then** 단순 날짜/제목 반복이 아닌 수치 기반 label-value 쌍(예: "거래량", "외인 순매수", "PER")이 포함된다
3. **Given** 기사에서 커뮤니티 반응을 유추할 수 없을 때, **When** 카드가 생성되면, **Then** community 카드는 포함되지 않는다(억지 생성 금지)

---

### Edge Cases

- 기사가 1~2개뿐이어서 bullish + bearish 모두 채울 근거가 없을 때 → 근거 있는 카드만 포함, 3장 최소 유지(cover + reason/bullish 중 1개 + source)
- 종목 방향성이 불분명한 테마 이슈(규제, M&A 발표 등)일 때 → 중립 팔레트 사용, bearish·bullish 중 하나만 선택 또는 둘 다 생략
- 기사 출처가 1개뿐일 때 → source 카드에 동일 출처가 중복 없이 1개만 포함됨을 확인
- 영문 기사가 포함될 때 → 카드 텍스트는 여전히 한국어로 작성됨

---

## Requirements

### Functional Requirements

- **FR-001**: 생성 지시문은 cover → reason → bullish/bearish → community → stats → source 순서의 **내러티브 흐름 권장 순서**를 명시해야 하며, 근거 없는 카드는 생략하도록 안내해야 한다
- **FR-002**: cover 카드의 title 작성 가이드는 **"왜 올랐나?" / "왜 떨어졌나?" / "무슨 일이?"** 관점의 투자자 질문 또는 핵심 결론을 첫 줄에 배치하도록 명시해야 한다
- **FR-003**: visual 팔레트 가이드는 **상승(warm/vivid)**, **하락(cool/dark)**, **중립(monochrome/slate)** 세 분위기 분류와 각각의 대표 hex 예시를 포함해야 한다
- **FR-004**: 동일 이슈 내 모든 카드는 **팔레트 일관성 규칙**을 따라야 한다 — bg_from/bg_via/bg_to는 유사 hue 범위 내에서 명도 변화로 구성
- **FR-005**: community 카드 quotes 작성 가이드는 **투자자 커뮤니티 어조** (직접적, 감정적, 속어 포함 가능)를 명시하고, 억지 생성보다 생략이 낫다고 안내해야 한다
- **FR-006**: stats 카드 items 가이드는 **이슈 유형별 우선 지표** (주식: 등락률·거래량·외인순매수 / 지수: 등락·거래대금 / 통화: 환율·변동폭)를 예시와 함께 제시해야 한다
- **FR-007**: 개선된 지시문 적용 후에도 **기존 스키마 제약** (3~7장, hex 코드, cover 첫 장, source 마지막 장, reason/bullish/bearish의 sources 1개 이상)은 모두 유지되어야 한다
- **FR-008**: 기존 `buildSystemPrompt()` 함수를 **교체(in-place 수정)**하여 하위 호환성을 유지해야 한다 — `generateIssues()` / `generateContextIssues()` 시그니처 변경 없음

### Key Entities

- **SystemPrompt**: AI에게 전달되는 생성 지시문. 역할 정의 + 카드 타입 카탈로그 + 내러티브 흐름 가이드 + 비주얼 팔레트 가이드 + 콘텐츠 규칙으로 구성
- **NarrativeArc**: 투자자 관점 스토리 구조. "무슨 일?" → "왜?" → "앞으로?" → "커뮤니티 반응" → "수치 확인" → "출처"
- **VisualPalette**: 이슈 분위기(상승/하락/중립)에 따른 hex 색상 집합. 이슈 단위로 일관된 hue 범위 유지

---

## Success Criteria

### Measurable Outcomes

- **SC-001**: 생성된 cover 카드의 **투자자 관점 파악 가능성** — Admin 검토자가 cover title만 보고 "이게 왜 중요한 뉴스인지" 즉시 이해되는 비율 80% 이상 (파일럿 테스트 기준)
- **SC-002**: 상승/하락 이슈 간 **비주얼 색상 구분 인식률** — 색상만 보고 이슈 방향성을 직관적으로 판단할 수 있는 비율 70% 이상 (파일럿 테스트 기준)
- **SC-003**: **스키마 검증 통과율 유지** — `parseCards()` 기준 카드 파싱 오류율이 개선 전과 동일하거나 감소
- **SC-004**: **community 카드 생성 적정 비율** — 커뮤니티 반응을 유추할 수 있는 이슈에서 75% 이상 community 카드 포함
- **SC-005**: **stats 카드 수치 유의미성** — stats.items에 날짜/제목 반복 없이 수치 기반 지표가 포함된 비율 90% 이상 (Admin 검토 시 수동 확인)

---

## Assumptions

- `buildSystemPrompt()` 교체만으로 충분하며, `generateIssues()` / `generateContextIssues()`의 로직·시그니처 변경은 없다
- hex 색상 팔레트 가이드는 Claude에게 예시를 제공하는 수준이며, 실제 palette 강제 검증 로직은 이 스펙 범위 밖이다 (parseCards()는 hex 코드 여부만 검증)
- community 카드 생성 여부는 Claude의 판단에 맡기며, 파이프라인에서 별도 강제하지 않는다
- 투자자 내러티브 품질은 단위 테스트보다 Admin 검토 단계(이슈 #8)에서 확인된다
- 참고 대화(https://claude.ai/share/3b0e1e30-f8f2-4f47-8ad0-b2ccf1f17e83)는 설계 영감 출처이며, 동일 결과물 재현이 목표가 아니다
