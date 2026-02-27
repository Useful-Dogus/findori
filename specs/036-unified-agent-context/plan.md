# Implementation Plan: 에이전트 지침 통합 관리

**Branch**: `036-unified-agent-context` | **Date**: 2026-02-27 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `specs/036-unified-agent-context/spec.md`

## Summary

Claude와 Codex를 번갈아 사용하면서 CLAUDE.md와 AGENTS.md가 파편화되는 문제를 해결한다.
`docs/agent-guidelines.md`를 단일 진실 소스로 두고, CLAUDE.md는 `@` 임포트로 런타임에 참조하며,
AGENTS.md는 `update-agent-context.sh` 스크립트가 공통 내용을 자동 동기화하는 방식으로 구현한다.

## Technical Context

**Language/Version**: Markdown, Bash
**Primary Dependencies**: Claude Code (@-import 런타임 지원), Codex CLI (파일 임포트 없음 — 스크립트 동기화 필요)
**Storage**: N/A
**Testing**: 수동 검증 (에이전트 세션에서 컨텍스트 확인)
**Target Platform**: 로컬 개발환경 (macOS/Linux)
**Project Type**: 개발자 툴링 / 문서 구조화
**Performance Goals**: N/A
**Constraints**: AGENTS.md는 파일 임포트 미지원 → 스크립트 기반 동기화 필수
**Scale/Scope**: 파일 3개(docs/agent-guidelines.md, CLAUDE.md, AGENTS.md) + 스크립트 1개 수정

## Constitution Check

| 원칙 | 적용 여부 | 판정 |
|------|-----------|------|
| I. 코드 품질 게이트 | 스크립트 변경은 읽기 쉽고 모듈화되어야 함 | ✓ PASS |
| II. 테스트가 정확성을 정의 | 문서 전용 + 경량 스크립트 수정. 행동 변경 없음 | ✓ PASS (수동 검증으로 충분) |
| III. UX 일관성 | 사용자 대면 UI 없음 | N/A |
| IV. 성능 필수 요건 | 성능 민감 경로 없음 | N/A |
| V. 소규모·검증 가능·가역적 변경 | 파일 3개 + 스크립트 1개 수정. 되돌리기 용이 | ✓ PASS |

**Constitution 위반 없음 — 구현 진행 가능**

## Architecture

### 개요

```
docs/
└── agent-guidelines.md      ← 단일 진실 소스 (모든 공통 지침)
CLAUDE.md                    ← @docs/agent-guidelines.md + Claude 전용 설정
AGENTS.md                    ← 스크립트 동기화 (공통 내용 복사) + Codex 전용 설정
.specify/scripts/bash/
└── update-agent-context.sh  ← docs/agent-guidelines.md 기준으로 동기화
```

### 동작 흐름

```
개발자가 지침 수정
  ↓
docs/agent-guidelines.md 편집
  ↓
  ├── Claude Code: @docs/agent-guidelines.md → 런타임에 자동 읽음 (즉시 반영)
  └── Codex CLI: update-agent-context.sh 실행 → AGENTS.md에 내용 복사 (다음 speckit plan 시 자동 반영)
```

### 파일 역할 분리

| 파일 | 포함 내용 | 수정 주체 |
|------|-----------|-----------|
| `docs/agent-guidelines.md` | 기술 스택, 디렉터리 구조, 명령어, 코딩 컨벤션, 중요 규칙 | 개발자 직접 / speckit 스크립트 |
| `CLAUDE.md` | `@docs/agent-guidelines.md` 임포트 한 줄 + Claude 전용 설정 | speckit 스크립트 (Claude 전용 섹션) |
| `AGENTS.md` | 공통 내용 (docs에서 복사) + Codex 전용 설정 | speckit 스크립트가 동기화 |

## Project Structure

### Documentation (this feature)

```text
specs/036-unified-agent-context/
├── plan.md              # 이 파일
├── research.md          # Phase 0 output
├── quickstart.md        # Phase 1 output
└── tasks.md             # /speckit.tasks 생성 (아직 없음)
```

### Source Code (repository root)

```text
docs/
└── agent-guidelines.md          # 신규 생성 — 공통 에이전트 지침
CLAUDE.md                        # 수정 — @import 방식으로 슬림화
AGENTS.md                        # 수정 — 스크립트 동기화 방식으로 전환
.specify/scripts/bash/
└── update-agent-context.sh      # 수정 — docs/agent-guidelines.md 기준 동기화 로직
```

**Structure Decision**: 단일 프로젝트 구조. 소스 수정 파일 4개(신규 1 + 수정 3)로 최소 범위.

## Implementation Phases

### Phase A: 공통 지침 문서 생성

현재 CLAUDE.md(최신 상태)에서 공통 내용을 추출하여 `docs/agent-guidelines.md`를 생성한다.

포함 내용:
- Active Technologies (기술 스택)
- Project Structure (디렉터리 구조)
- Commands (개발/빌드/테스트 명령어)
- Code Style (코딩 컨벤션)

### Phase B: CLAUDE.md 슬림화

CLAUDE.md를 아래 구조로 교체한다:

```markdown
# findori — Claude Code Guidelines

@docs/agent-guidelines.md

<!-- CLAUDE-SPECIFIC START -->
<!-- Claude Code 전용 설정 (옵션) -->
<!-- CLAUDE-SPECIFIC END -->
```

speckit의 `update-agent-context.sh`가 이 구조를 인식하고 `docs/agent-guidelines.md`를 업데이트하도록 변경한다.

### Phase C: AGENTS.md 동기화 방식 전환

AGENTS.md를 아래 구조로 교체한다:

```markdown
# findori — Codex Agent Guidelines

<!-- AUTO-GENERATED FROM docs/agent-guidelines.md — DO NOT EDIT DIRECTLY -->
<!-- Run: .specify/scripts/bash/update-agent-context.sh codex to regenerate -->

[공통 내용 — docs/agent-guidelines.md에서 복사]

<!-- CODEX-SPECIFIC START -->
<!-- Codex 전용 설정 (옵션) -->
<!-- CODEX-SPECIFIC END -->
```

### Phase D: update-agent-context.sh 수정

스크립트의 공통 콘텐츠 쓰기 대상을 `docs/agent-guidelines.md`로 변경한다:

1. `parse_plan_data()` 결과를 `docs/agent-guidelines.md`에 기록
2. CLAUDE.md 업데이트 시: `@docs/agent-guidelines.md` 임포트 라인이 있으면 유지, 없으면 추가
3. AGENTS.md 업데이트 시: `docs/agent-guidelines.md` 내용을 AUTO-GENERATED 블록 안에 복사

### Phase E: .gitignore 확인

`docs/agent-guidelines.md`가 git 추적 대상인지 확인한다.
현재 `CLAUDE.md`와 `AGENTS.md`는 .gitignore에 포함되어 있어 추적 안 됨.
`docs/agent-guidelines.md`는 팀 공유 문서이므로 추적되어야 함 → .gitignore에서 제외 확인.

## Dependency Graph

```
Phase A → Phase B → Phase D
Phase A → Phase C → Phase D
Phase E (독립, 언제든 실행 가능)
```

Phase A(공통 문서 생성)가 모든 하위 단계의 선행 조건.
Phase B, C는 병렬 작업 가능.
Phase D는 B, C 완료 후 스크립트 통합.
