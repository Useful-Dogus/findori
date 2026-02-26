# Phase 0 Research - MVP 스펙 정합성 고정

## Decision 1: 정합성 대상 문서 범위를 4개 핵심 문서로 고정
- Decision: 정합성 검토의 1차 대상은 `docs/mvp/README.md`, `docs/mvp/prd.md`, `docs/mvp/srs.md`, `docs/mvp/feature-spec.md`로 고정한다.
- Rationale: Issue #1의 배경에 명시된 문서 집합이며, MVP 기능/동작/구현 기준의 핵심 충돌 지점이 이 네 문서에 집중되어 있다.
- Alternatives considered:
  - `docs/mvp/*` 전체를 동시 범위로 포함: 초기 작업량 과다 및 핵심 충돌 해결 지연 위험이 있어 제외.
  - PRD만 기준으로 단일 문서화: 구현/동작 레벨 충돌을 놓칠 가능성이 있어 제외.

## Decision 2: 충돌 분류 체계를 4개 카테고리로 표준화
- Decision: 충돌 항목은 `용어(Terminology)`, `범위(Scope)`, `동작(Behavior)`, `상태/예외(State/Exception)`로 분류한다.
- Rationale: 후속 이슈에서 빠른 triage가 가능하고, 문서 간 비교 시 누락 영역을 줄일 수 있다.
- Alternatives considered:
  - 자유 서술형 분류: 추적성과 재현성이 낮아 제외.
  - 2개 대분류(기획/기술): 분석 단위가 너무 커 충돌 근거 기록이 모호해져 제외.

## Decision 3: 완료 판정 증거 타입을 화면/API/로그로 강제
- Decision: 모든 핵심 요구사항은 최소 1개 이상 `화면`, `API`, `운영 로그` 증거 타입과 매핑한다.
- Rationale: Issue #1 DoD의 "검증 가능한 결과" 요구를 가장 직접적으로 만족한다.
- Alternatives considered:
  - 텍스트 검토만으로 완료 판정: 구현 검증 단계에서 해석 차이를 유발할 가능성이 높아 제외.
  - 화면 증거만 허용: 백엔드/파이프라인 요구사항 검증 누락 가능성이 있어 제외.

## Decision 4: 용어 정규화의 우선 기준을 PRD 정의로 둔다
- Decision: 사용자 가치/제품 의미가 충돌할 때 PRD 정의를 우선 기준으로 하고, 기술 구현 표현은 SRS/Feature Spec에서 해당 정의를 따르도록 정렬한다.
- Rationale: PRD는 제품 범위와 사용자 가치의 기준 문서이며, 스펙 정합 작업의 목적이 "의미 통일"이기 때문이다.
- Alternatives considered:
  - SRS 우선: 기술 구현 관점으로 편향되어 제품 범위 해석 충돌 위험이 있어 제외.
  - 최신 수정 시간 우선: 문서 목적을 무시하는 규칙이라 제외.

## Decision 5: 본 이슈 산출물은 "정합성 레지스터" 형식으로 관리
- Decision: 충돌 항목을 테이블 기반 정합성 레지스터(충돌 ID, 문서 위치, 최종 기준, 근거, 검증 매핑)로 관리한다.
- Rationale: 후속 이슈와 릴리즈 체크리스트에서 참조 가능한 형태이며 변경 이력 비교가 쉽다.
- Alternatives considered:
  - 문단형 회의록: 검색성과 추적성이 낮아 제외.
  - 문서별 개별 수정만 수행: 충돌 해소 근거가 분산되어 검증이 어려워 제외.

## Document Section Index (for review execution)

- `docs/mvp/prd.md`
  - 6. MVP 범위
  - 7. 핵심 사용자 흐름
  - 8. 기능 요구사항 (FR)
  - 10. 비기능 요구사항
  - 11. MVP 완료 기준
- `docs/mvp/srs.md`
  - 3. 콘텐츠 파이프라인
  - 4. 데이터 모델
  - 6. 공개 피드 UX 플로우
  - 7. API 명세
  - 10. 성능/반응형 요구사항
- `docs/mvp/feature-spec.md`
  - 2. 공통 규칙
  - 3. 기능 명세
  - 4. 상태 정의
  - 6. QA 체크리스트

## Clarification Resolution Summary

No unresolved NEEDS CLARIFICATION items remain.
