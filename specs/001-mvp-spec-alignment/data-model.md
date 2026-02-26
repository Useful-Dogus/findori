# Phase 1 Data Model - MVP 스펙 정합성 고정

## 1. Entity: DocumentArtifact

- Purpose: 정합성 검토 대상이 되는 MVP 문서의 구조화 표현
- Fields:
  - `doc_id` (string): 문서 식별자 (`mvp-readme`, `prd`, `srs`, `feature-spec`)
  - `path` (string): 저장소 내 문서 경로
  - `section_ref` (string): 충돌이 발견된 섹션 식별자
  - `statement` (string): 해당 섹션의 요구/설명 문장
  - `updated_at` (date): 마지막 수정 날짜
- Validation rules:
  - `path`는 저장소 내 실제 파일을 가리켜야 한다.
  - `statement`는 빈 문자열일 수 없다.

## 2. Entity: ConflictItem

- Purpose: 문서 간 충돌 항목의 단위 레코드
- Fields:
  - `conflict_id` (string): `C-001` 형식 고유 ID
  - `category` (enum): `terminology | scope | behavior | state_exception`
  - `source_refs` (array): 충돌이 발생한 문서/섹션 참조 목록
  - `description` (string): 충돌 내용 요약
  - `resolution` (string): 최종 기준 정의
  - `rationale` (string): 기준 채택 근거
  - `owner` (string): 해결 책임자
  - `status` (enum): `identified | resolved | verified`
- Validation rules:
  - `source_refs`는 최소 2개 이상이어야 한다.
  - `status=resolved` 이상이면 `resolution`과 `rationale`가 필수다.

## 3. Entity: AlignmentRule

- Purpose: 충돌 해결 후 재사용되는 단일 규칙 집합
- Fields:
  - `rule_id` (string): `R-001` 형식 고유 ID
  - `applies_to` (array): 적용 문서/기능 목록
  - `canonical_term` (string): 표준 용어 또는 표준 동작 정의
  - `rule_statement` (string): 규칙 본문
  - `evidence_types` (set): `ui | api | log` 중 최소 1개
- Validation rules:
  - `canonical_term`은 중복 없이 유일해야 한다.
  - `evidence_types`는 공집합일 수 없다.

## 4. Entity: VerificationMapping

- Purpose: 요구사항과 검증 가능한 결과 유형을 연결하는 추적 매핑
- Fields:
  - `mapping_id` (string): `V-001` 형식 고유 ID
  - `requirement_ref` (string): FR 또는 사용자 시나리오 참조
  - `evidence_type` (enum): `ui | api | log`
  - `verification_method` (string): 검증 절차 설명
  - `pass_condition` (string): 판정 기준
- Validation rules:
  - 하나의 `requirement_ref`는 최소 1개 이상의 매핑을 가져야 한다.
  - `pass_condition`은 측정 가능 문장이어야 한다.

## 5. Relationships

- `DocumentArtifact` 1..N `ConflictItem`
- `ConflictItem` N..1 `AlignmentRule`
- `AlignmentRule` 1..N `VerificationMapping`
- `VerificationMapping` N..1 `ConflictItem` (선택적, 충돌 기반 항목인 경우)

## 6. State Transitions

### ConflictItem.status

1. `identified` -> `resolved`
- 조건: 최종 기준(`resolution`)과 근거(`rationale`)가 기록됨

2. `resolved` -> `verified`
- 조건: 연결된 `VerificationMapping`에서 pass condition 충족 가능성이 확인됨

3. `verified` -> `identified` (rollback)
- 조건: 후속 문서 변경으로 동일 충돌이 재발견됨
