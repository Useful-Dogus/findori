# Contract: MVP Alignment Report

## Metadata

- Version: `1.0.0`
- Status: `approved-for-mvp`
- Last Updated: `2026-02-26`

## Purpose

문서 정합성 결과를 후속 이슈(#2~#5)에서 재사용 가능한 고정 포맷으로 전달하기 위한 계약이다.

## Producer / Consumer

- Producer: `001-mvp-spec-alignment` 작업 산출물 작성자
- Consumer: Foundation 후속 이슈 담당자, 리뷰어, 릴리즈 체크리스트 검토자

## Contract Schema

Each alignment record MUST include:

- `conflict_id`: string, pattern `C-[0-9]{3}`
- `category`: one of `terminology | scope | behavior | state_exception`
- `source_refs`: array of `{ doc: string, section: string, quote: string }`
- `resolution`: string
- `rationale`: string
- `verification`: array of `{ type: ui|api|log, method: string, pass_condition: string }`
- `status`: one of `identified | resolved | verified`

## Invariants

- `status=resolved` or `verified`이면 `resolution`과 `rationale`은 비어 있을 수 없다.
- `verification` 배열은 최소 1개 항목을 가져야 한다.
- 동일 `conflict_id`는 중복 생성될 수 없다.

## Example Record

```yaml
conflict_id: C-001
category: terminology
source_refs:
  - doc: prd.md
    section: "8. 기능 요구사항"
    quote: "이슈 슬라이드"
  - doc: feature-spec.md
    section: "3. 기능 명세"
    quote: "카드 묶음"
resolution: "사용자 노출 단위를 '이슈 카드'로 통일한다."
rationale: "PRD 사용자 가치 관점과 Feature Spec 동작 단위를 동시에 만족한다."
verification:
  - type: ui
    method: "피드 화면 용어 노출 점검"
    pass_condition: "핵심 화면에서 표준 용어만 사용"
  - type: api
    method: "응답 필드 명세 점검"
    pass_condition: "용어 매핑 규칙 위반 필드 0건"
status: resolved
```

## Acceptance

- 계약 스키마를 충족하지 않는 레코드는 정합성 완료 판정에서 제외한다.
- 정합성 레지스터의 모든 레코드가 본 계약을 만족하면 이슈 #1 산출물은 "검증 가능" 상태로 간주한다.
