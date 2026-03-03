# Implementation Plan: 에이전트 산출물 작성 규칙 통합

**Branch**: `042-agent-artifact-conventions` | **Date**: 2026-03-03 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `specs/042-agent-artifact-conventions/spec.md`

---

## Summary

Claude Code와 Codex가 번갈아 사용되는 환경에서 스펙·이슈·커밋·PR 형식 불일치 문제를 해결하기 위해, 단일 공통 정책 문서(`docs/artifact-conventions.md`)를 생성하고 기존 에이전트 공통 지침(`docs/agent-guidelines.md`)에서 이를 참조하도록 연결한다.

이 피처는 **순수 문서 변경**이다. 소스 코드 수정 없음.

---

## Technical Context

**Language/Version**: Markdown (문서 전용)
**Primary Dependencies**: N/A — 외부 라이브러리·빌드 도구 불필요
**Storage**: N/A
**Testing**: 수동 검증 — 두 에이전트로 동일 작업 실행 후 산출물 비교
**Target Platform**: Git 저장소 (`docs/`, `CLAUDE.md`, `AGENTS.md`)
**Project Type**: Documentation
**Performance Goals**: N/A
**Constraints**: `docs/` 디렉터리 관용 유지, Issue #36 구축 참조 구조(CLAUDE.md→agent-guidelines.md) 보존
**Scale/Scope**: 파일 2개 변경 (1 신규, 1 업데이트)

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| 원칙 | 적용 여부 | 판단 |
|------|-----------|------|
| I. Code Quality | ❌ (소스 코드 변경 없음) | ✅ PASS — 해당 없음 |
| II. Tests Define Correctness | ❌ (로직 변경 없음) | ✅ PASS — 수동 검증으로 대체 |
| III. UX Consistency | ❌ (UI 변경 없음) | ✅ PASS — 해당 없음 |
| IV. Performance | ❌ (성능 영향 없음) | ✅ PASS — 해당 없음 |
| V. Small/Reversible | ✅ 파일 2개, rollback 용이 | ✅ PASS |

**Gate result**: 전 원칙 PASS. 진행 허가.

---

## Project Structure

### Documentation (this feature)

```text
specs/042-agent-artifact-conventions/
├── plan.md              ← 이 파일
├── research.md          ← Phase 0 완료
├── data-model.md        ← Phase 1 완료
├── quickstart.md        ← Phase 1 완료
└── tasks.md             ← /speckit.tasks 명령어로 생성 예정
```

### Source Changes (repository root)

```text
docs/
├── artifact-conventions.md   ← 신규 생성 (공통 정책 문서)
└── agent-guidelines.md       ← 업데이트 (artifact-conventions.md 참조 추가)

# 변경 없음
CLAUDE.md                     ← @docs/agent-guidelines.md 임포트 (유지)
AGENTS.md                     ← docs/agent-guidelines.md 텍스트 참조 (유지)
```

**Structure Decision**: 이 피처는 소스 코드 트리 변경이 없으며, `docs/` 디렉터리에만 영향을 준다. Issue #36에서 구축한 `CLAUDE.md → docs/agent-guidelines.md` 참조 구조를 그대로 활용하고, `agent-guidelines.md`에 `docs/artifact-conventions.md` 참조를 추가한다.

---

## Implementation Blueprint

### 태스크 T1: `docs/artifact-conventions.md` 신규 생성

공통 정책 문서를 다음 7개 섹션으로 작성한다.

**섹션 1 — 번호 정렬 체계**
- GitHub 이슈 번호 `#N` → 브랜치 `0NN-*` → 스펙 `specs/0NN-*` (3자리 제로패딩)
- 커밋 메시지/PR 본문의 이슈 참조(`[Issue #N]`, `Closes #N`)에는 패딩 없이 원래 숫자 사용

**섹션 2 — 스펙 형식**
- 경로: `specs/0NN-<short-name>/spec.md`
- speckit 워크플로우 경로: specify → plan → tasks → implement

**섹션 3 — GitHub 이슈 형식**
- 필수 섹션: `## 배경`, `## 범위` (In Scope / Out of Scope), `## 완료 기준 (DoD)`
- 선택 섹션: `## 의존성`

**섹션 4 — 커밋 메시지 규칙**
- Tier 1 (이슈 구현 주 커밋): `[Issue #N] <설명>`
- Tier 2 (보조/수정): Conventional Commits — `feat|fix|hotfix|docs|chore|refactor|test|style|perf|ci`
- 스코프 선택적: `fix(scope): <설명>`
- `Co-Authored-By:` 등 에이전트 자동 추가 줄 금지 (docs/agent-guidelines.md Workflow Rules 참조)

**섹션 5 — PR 형식**
- 제목: `[Issue #N] <설명>`
- 필수 섹션: `## Summary`, `## Test plan`, `Closes #N` / `Refs #N` / `Part of #N`
- 선택 섹션: `## Changes` (상세 변경 목록)
- 링크 키워드:
  - `Closes #N` — 이 PR이 이슈를 완전히 닫음
  - `Part of #N` — 이슈의 일부만 구현
  - `Refs #N` — 관련 이슈 참조 (닫지 않음)

**섹션 6 — 코드 품질 기준 (4-axis)**
- **가독성**: 단일 책임, 의도가 드러나는 이름, 매직 넘버/문자열 금지
- **예측 가능성**: 프로젝트 관용구 우선, 사이드이펙트 최소화
- **응집도**: 관련 로직 한 곳에 집중, 불필요한 분산 금지
- **결합도 & 기본 성능**: 의존성 단방향, 순환 의존성 금지, N+1 쿼리·무한 루프·메모리 누수 금지

**섹션 7 — hotfix 예외 흐름**
- hotfix 정의: spec/plan/tasks 사이클 없이 즉각 수정이 필요한 긴급 버그
- 커밋: `hotfix: <설명>` 또는 `fix: <설명>`, 이슈가 있으면 `Refs #N` 포함 권장
- PR: `## Summary` 최소 한 줄 + `## Test plan` 한 줄 이상
- 생략 가능: spec.md, plan.md, tasks.md, `Closes #N`

---

### 태스크 T2: `docs/agent-guidelines.md` 업데이트

파일 최하단(또는 `## Code Style` 섹션 아래)에 다음 참조 섹션 추가:

```markdown
## Artifact Conventions

산출물 작성 규칙(스펙·이슈·커밋·PR 형식, 번호 정렬, 코드 품질 기준, hotfix 예외)은
`docs/artifact-conventions.md`를 참조한다.
```

Claude Code는 `@docs/artifact-conventions.md` 임포트로 직접 참조 가능하지만, `agent-guidelines.md`의 단일 진입점 원칙을 유지하기 위해 링크 방식을 사용한다.

---

### 태스크 T3: 검증

두 에이전트 또는 단일 에이전트 두 번 실행으로 동일 작업 설명에서 이슈 초안을 생성하고 필수 섹션 일치 여부를 확인한다.

체크리스트:
- [ ] `docs/artifact-conventions.md` 존재, 7개 섹션 포함
- [ ] `docs/agent-guidelines.md`에 `artifact-conventions.md` 참조 추가됨
- [ ] 동일 작업으로 생성된 이슈 초안 필수 섹션 100% 일치
- [ ] `npm run validate` 통과 (문서 변경이므로 빌드 영향 없어야 함)

---

## Phase 1 Re-Constitution Check

| 원칙 | 설계 후 판단 |
|------|-------------|
| I. Code Quality | ✅ 해당 없음 (문서 전용) |
| II. Tests | ✅ 수동 검증 절차 정의됨 (T3) |
| III. UX | ✅ 해당 없음 |
| IV. Performance | ✅ 해당 없음 |
| V. Small/Reversible | ✅ 파일 2개, git revert로 즉시 롤백 가능 |

**Gate result**: 전 원칙 PASS. tasks.md 생성 진행 허가.

---

## Complexity Tracking

*Constitution 위반 없음 — 이 섹션 해당 없음.*
