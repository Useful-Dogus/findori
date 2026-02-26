# Quickstart - MVP 스펙 정합성 고정

## Goal

Issue #1 범위 내에서 MVP 문서 충돌을 식별하고 단일 기준으로 정리한 뒤, 후속 이슈에서 즉시 참조 가능한 결과를 만든다.

## Alignment Baseline

- 기준 문서: `docs/mvp/README.md`, `docs/mvp/prd.md`, `docs/mvp/srs.md`, `docs/mvp/feature-spec.md`
- 표준 용어 우선순위: PRD 정의 우선 -> SRS/Feature Spec 동기화
- 충돌 분류: `terminology`, `scope`, `behavior`, `state_exception`
- 완료 증거 타입: `ui`, `api`, `log` (요구사항당 최소 1개)

## Prerequisites

- 현재 브랜치: `001-mvp-spec-alignment`
- 필수 산출물:
  - `specs/001-mvp-spec-alignment/spec.md`
  - `specs/001-mvp-spec-alignment/plan.md`
  - `specs/001-mvp-spec-alignment/alignment-register.md`
  - `specs/001-mvp-spec-alignment/glossary.md`
  - `specs/001-mvp-spec-alignment/dod-checklist.md`

## Execution Steps

1. 기준 문서에서 충돌 후보를 수집한다.
- 동일 개념의 용어/범위/동작/상태 정의를 문서별로 병렬 대조한다.

2. 정합성 레지스터를 채운다.
- `alignment-register.md`에 source refs, resolution, rationale, verification을 기록한다.

3. 표준 용어를 확정한다.
- `glossary.md`에 canonical term과 금지/대체 표현을 기록한다.

4. 문서를 동기화한다.
- PRD/SRS/Feature Spec의 용어와 상태 정의를 표준 기준으로 맞춘다.

5. 계약 및 DoD를 검증한다.
- `contracts/alignment-report-contract.md` 준수 여부와 `dod-checklist.md` 통과 여부를 확인한다.

## Downstream Handoff Summary (#2-#5)

- #2(기술 베이스라인): 용어 기준을 UI/API 명명 규칙에 반영
- #3(환경변수/시크릿): 파이프라인/운영 로그 증거 타입 기준을 따라 운영 검증 항목 정의
- #4(DB 마이그레이션): `feed`, `issue card`, `state` 용어를 스키마 명명에 일치
- #5(카드 스키마 검증): 카드 구조/상태 예외 처리 기준을 정합 레지스터와 동기화

## Definition of Done Checklist

- [x] 충돌 항목이 카테고리별로 식별되었다.
- [x] 각 충돌 항목에 최종 기준과 근거가 기록되었다.
- [x] 핵심 요구사항별 검증 증거 타입이 연결되었다.
- [x] 산출물이 계약 스키마를 충족한다.
- [x] 후속 Foundation 이슈에서 참조 가능한 상태다.
