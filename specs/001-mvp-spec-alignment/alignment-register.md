# MVP Alignment Register

## Standard Terms

- Canonical user-facing unit: `이슈 카드`
- Canonical stream term: `이슈 카드 스트림`
- Canonical state set: `loading`, `empty`, `error`

## Conflict Records

### C-001

- category: `terminology`
- source_refs:
  - doc: `docs/mvp/prd.md`
    section: `6. MVP 범위`
    quote: "일일 슬라이드 스트림 발행"
  - doc: `docs/mvp/feature-spec.md`
    section: `3.1 일일 이슈 슬라이드 스트림 발행`
    quote: "이슈 슬라이드 묶음"
  - doc: `docs/mvp/srs.md`
    section: `3. 콘텐츠 파이프라인`
    quote: "슬라이드 초안"
- description: 동일 사용자 노출 단위를 `슬라이드`, `카드`, `이슈 슬라이드 묶음`으로 혼용
- resolution: 사용자 노출 단위는 `이슈 카드`, 일일 발행 단위는 `이슈 카드 스트림`으로 통일
- rationale: PRD의 사용자 이해 흐름을 유지하면서 SRS/Feature Spec의 카드 데이터 모델과 직접 매핑 가능
- verification:
  - type: `ui`
    method: PRD/Feature Spec 핵심 기능 섹션 용어 대조
    pass_condition: 핵심 단위 표현이 `이슈 카드`/`이슈 카드 스트림` 외 표현으로 남아있지 않음
  - type: `api`
    method: SRS API 설명 텍스트와 카드 단위 설명 대조
    pass_condition: 카드 단위 설명이 사용자 노출 용어와 충돌하지 않음
- owner: `spec-owner`
- status: `verified`

### C-002

- category: `scope`
- source_refs:
  - doc: `docs/mvp/prd.md`
    section: `6.2 제외 범위`
    quote: "실시간 시세"
  - doc: `docs/mvp/srs.md`
    section: `3. 콘텐츠 파이프라인`
    quote: "매일 22:00 자동 실행"
- description: MVP 범위가 일일 배치 중심인데 일부 표현이 실시간 소비 오해를 유발 가능
- resolution: MVP 범위는 장 마감 후 일일 발행 모델로 고정하고 실시간 갱신 요구는 제외 범위 유지
- rationale: PRD의 MVP 목표(형식 검증)와 운영 부담 최소화 전략에 부합
- verification:
  - type: `ui`
    method: PRD 범위/제외 범위 문구 점검
    pass_condition: 실시간 제공으로 해석되는 문구 0건
  - type: `log`
    method: 파이프라인 실행 주기 설명 검토
    pass_condition: 일일 배치 실행 주기 명시 유지
- owner: `spec-owner`
- status: `verified`

### C-003

- category: `behavior`
- source_refs:
  - doc: `docs/mvp/feature-spec.md`
    section: `3.2 피드 탐색`
    quote: "좌우 스와이프: 이슈/슬라이드 순차 이동"
  - doc: `docs/mvp/prd.md`
    section: `7.2 소비`
    quote: "슬라이드 스와이프로 이슈를 순차 소비"
- description: 탐색 동작 설명이 카드 이동 단위와 이슈 이동 단위를 구분 없이 혼재
- resolution: 기본 탐색 단위를 `이슈 카드`로 정의하고, 카드 묶음 간 이동은 별도 문장으로 명시
- rationale: 사용자가 체감하는 최소 상호작용 단위를 단일화해 QA 판정 일관성 확보
- verification:
  - type: `ui`
    method: 기능 명세 탐색 동작 문구 대조
    pass_condition: 탐색 단위가 `이슈 카드`로 일관
  - type: `api`
    method: `/api/issues/[id]` 설명과 카드 렌더링 단위 대조
    pass_condition: API 단위와 UI 단위 간 설명 불일치 0건
- owner: `spec-owner`
- status: `verified`

### C-004

- category: `state_exception`
- source_refs:
  - doc: `docs/mvp/feature-spec.md`
    section: `4. 상태 정의`
    quote: "로딩/빈 상태/오류 상태"
  - doc: `docs/mvp/prd.md`
    section: `11. MVP 완료 기준`
    quote: "정상 열람됨"
  - doc: `docs/mvp/srs.md`
    section: `6. 공개 피드 UX 플로우`
    quote: "404 -> 홈으로 유도 CTA"
- description: 상태/예외 정의가 feature-spec 중심으로만 명시되어 상위 문서와 기술 문서 연결이 약함
- resolution: PRD/SRS에 상태 세트(`loading`, `empty`, `error`)와 예외 대응 원칙을 명시적으로 연결
- rationale: 상위 요구/기술 설계/동작 명세 간 상태 판정 기준을 일치시켜 구현 후 QA 불일치 방지
- verification:
  - type: `ui`
    method: PRD 및 Feature Spec 상태 정의 섹션 대조
    pass_condition: 동일 상태 세트와 동일 의미 유지
  - type: `api`
    method: SRS의 404/실패 처리 규칙 점검
    pass_condition: 예외 시 사용자 복구 경로가 문서상 누락되지 않음
  - type: `log`
    method: feature-spec 예외 처리와 운영 로그 항목 대조
    pass_condition: 주요 예외에 대한 로그 관찰 포인트가 존재
- owner: `spec-owner`
- status: `verified`

## Verification Mapping by Requirement

- FR-001 -> `log`: 일일 발행 주기/파이프라인 실행 규칙 점검, pass: 배치 발행 모델 일관
- FR-002 -> `ui`: 사건->해석->시장 반응 구조 문구 점검, pass: 구조 누락 0건
- FR-003 -> `ui`: 대표 맥락 카드 노출 정의 점검, pass: 코스피/나스닥/USD-KRW 전부 명시
- FR-004 -> `ui`: 스와이프/진행 상태 규칙 점검, pass: 카드 탐색 규칙 단일화
- FR-005 -> `api`: 공유 링크/비로그인 열람 규칙 점검, pass: 공유 진입/복구 규칙 명확
- FR-006 -> `ui`: 출처 링크 필수성 점검, pass: 출처 최소 1개 규칙 유지
- FR-007 -> `ui`: 투자 자문 아님 고지 위치 점검, pass: 피드/공유 랜딩 노출 유지

## Status Summary

- identified: 0
- resolved: 0
- verified: 4
