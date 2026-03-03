# Research: 에이전트 산출물 작성 규칙 통합

**Feature**: 042-agent-artifact-conventions
**Phase**: 0 — Outline & Research
**Date**: 2026-03-03

---

## 1. 커밋 메시지 패턴 분석

### Decision: 2-tier 커밋 타입 체계 확정

현재 저장소의 git log를 분석한 결과, 두 가지 패턴이 공존한다.

**Tier 1 — 이슈 구현 커밋 (브랜치 주 커밋 / squash-merge 제목)**

```
[Issue #N] <한국어 또는 영어 설명>
```

- 브랜치 피처 구현 완료 시 주 커밋 또는 squash-merge 제목에 사용
- PR 제목과 동일 형식 (`[Issue #N] <description>`)
- 이슈 번호는 3자리 패딩 없이 원래 숫자 그대로 (#1, #2, #36, ...)

**Tier 2 — 보조/수정 커밋 (Conventional Commits)**

관찰된 타입:
| 타입             | 건수 | 용도                        |
|-----------------|------|-----------------------------|
| `fix:`          | 4    | 버그 수정, 설정 오류 수정    |
| `chore:`        | 4    | 설정 변경, 도구/파일 관리   |
| `docs:`         | 3    | 문서 단독 변경              |
| `refactor:`     | 1    | 동작 변경 없는 코드 구조 개선 |
| `fix(scope):`   | 1    | 스코프 포함 버그 수정        |
| `chore(scope):` | 1    | 스코프 포함 설정 변경       |

**Rationale**: `[Issue #N]` 패턴은 이슈 기반 개발 흐름 (spec → plan → tasks → implement)의 가시성을 높인다. Conventional Commits는 이슈 없이 진행되는 소규모 수정에 적합하다. 두 패턴을 모두 공식화한다.

**Alternatives considered**: 순수 Conventional Commits 단일 체계 → 이슈 번호가 commit subject에서 사라져 추적 비용 증가. 기각.

---

## 2. PR 형식 분석

### Decision: 필수 섹션 = Summary + Test plan + Closes

기존 PR 5건 분석 결과:

| PR  | Summary | Test plan | Changes detail | Related/Closes |
|-----|---------|-----------|----------------|----------------|
| #41 | ✅      | ✅         | ❌              | `Closes #6`    |
| #40 | ✅      | ✅         | ✅              | `Closes #5`    |
| #39 | ✅      | ✅         | ✅ (주요 결정)   | (body에 포함)   |
| #38 | ✅      | ✅         | ✅              | `Closes #3`    |
| #37 | ✅      | ✅         | ✅              | `Closes #36`   |

**필수 섹션**: `## Summary`, `## Test plan` (또는 `테스트 결과`), `Closes #N`
**선택 섹션**: `## Changes` (상세 변경 목록, 복잡한 구현 시 권장)

**Link keyword 규칙**:
- `Closes #N` — 이 PR이 해당 이슈를 완전히 닫을 때
- `Part of #N` — 이슈의 일부만 구현할 때 (hotfix 제외 전체 피처는 `Closes` 사용)
- `Refs #N` — 관련 이슈를 참조만 할 때 (닫지 않음)

**Alternatives considered**: `Fixes #N` → GitHub 동일하게 닫지만 `Closes`가 더 중립적. `Closes` 유지.

---

## 3. GitHub 이슈 형식 분석

### Decision: 필수 섹션 = 배경 + 범위(In/Out) + 완료 기준(DoD)

기존 이슈 #42, #36, #5, #4, #3 등 분석 결과:

| 섹션           | 출현 빈도 | 필수 여부 |
|---------------|-----------|-----------|
| 배경           | 100%      | ✅ 필수    |
| 범위 (In)      | 100%      | ✅ 필수    |
| 범위 (Out)     | 100%      | ✅ 필수    |
| 완료 기준 (DoD)| 100%      | ✅ 필수    |
| 의존성         | 일부       | 선택       |

이슈 제목 형식: `<한국어 또는 영어 설명>` (이슈 번호는 GitHub이 자동 부여)

---

## 4. 번호 정렬 체계 분석

### Decision: GitHub 이슈 번호 → 3자리 제로패딩 → 브랜치/스펙 번호

관찰 패턴:
```
GitHub #1  → branch: 001-mvp-spec-alignment  → specs/001-mvp-spec-alignment
GitHub #2  → branch: 002-tech-baseline-setup → specs/002-tech-baseline-setup
GitHub #36 → branch: 036-unified-agent-context → specs/036-unified-agent-context
GitHub #42 → branch: 042-agent-artifact-conventions → specs/042-agent-artifact-conventions
```

**규칙**: `printf "%03d" N` — 세 자리 제로패딩 (100 이상은 자연수 그대로)
단, 커밋 메시지/PR 본문의 `[Issue #N]`, `Closes #N`에서는 원래 숫자 사용 (패딩 없음).

---

## 5. 스펙 형식 분석

### Decision: speckit.specify 템플릿이 표준; 별도 규칙은 이를 보완

`specs/001` ~ `specs/042` 분석 결과, 모든 spec.md는 speckit.specify가 생성한 구조를 따른다. 공통 정책 문서에서는 스펙 템플릿의 존재를 인정하고, 이에 더해 `[Issue #N]` speckit 경로 (`spec.md → plan.md → tasks.md → implement`)만 명시한다.

---

## 6. 코드 품질 기준 출처 분석

### Decision: Constitution 5개 원칙을 에이전트용으로 재해석한 4-axis 기준

Constitution의 원칙은 광범위하고 추상적이다. 에이전트가 코드 생성 시 즉시 참조할 수 있도록 4개 축으로 재해석한다:

1. **가독성**: 단일 책임, 의도가 드러나는 이름, 설명이 필요한 마법 숫자/문자열 금지
2. **예측 가능성**: 동일 패턴 반복 (프로젝트 관용구 우선), 사이드이펙트 최소화
3. **응집도**: 관련 로직을 한 곳에, 불필요한 분산 금지
4. **결합도**: 의존성 방향 단방향, 순환 의존성 금지; 기본 성능 규칙 (N+1, 무한 루프, 메모리 누수)

---

## 7. 공통 정책 문서 위치 결정

### Decision: `docs/artifact-conventions.md`

**Rationale**:
- `docs/` 디렉터리는 이미 `agent-guidelines.md`, `env-setup.md` 등 운영 문서를 포함
- `artifact-conventions.md`라는 이름은 목적을 명확히 표현
- `docs/agent-guidelines.md`에서 `@docs/artifact-conventions.md` 또는 링크로 참조 가능

**참조 구조 (Issue #36에서 구축된 체계 위에)**:
```
CLAUDE.md ──@import──→ docs/agent-guidelines.md ──link──→ docs/artifact-conventions.md
AGENTS.md ──text ref──→ docs/agent-guidelines.md ──link──→ docs/artifact-conventions.md
```

`agent-guidelines.md`에 새 섹션 `## Artifact Conventions` 추가 후 `@docs/artifact-conventions.md`로 임포트.

**Alternatives considered**:
- `docs/conventions.md` → 너무 일반적
- `CONTRIBUTING.md` → GitHub 표준이나 이 저장소는 에이전트 중심이므로 `docs/`가 더 적합
- 직접 `agent-guidelines.md`에 인라인 → 파일이 너무 비대해지고 관심사 분리가 불명확

---

## 8. hotfix 예외 흐름 결정

### Decision: `hotfix:` 타입 도입, 최소 필수 항목 3개

**hotfix 정의**: 프로덕션 또는 main 브랜치에서 즉각 수정이 필요한 긴급 버그로, spec/plan/tasks 사이클 없이 직접 수정하는 경우.

**최소 필수 항목**:
1. 커밋 타입: `hotfix:` 또는 `fix:` (스코프 포함 가능)
2. 이슈 참조: 이슈가 있으면 `Refs #N` (이슈 생성 생략 가능)
3. PR 본문: `## Summary` 최소 한 줄 + `## Test plan` 한 줄 이상

**생략 가능한 항목**: spec.md, plan.md, tasks.md, `Closes #N` (이슈 없을 경우)

**Rationale**: hotfix 타입 부재 시 에이전트가 `fix:`와 구분 없이 처리하거나, 전체 speckit 사이클을 요구할 수 있어 긴급 대응이 지연된다.
