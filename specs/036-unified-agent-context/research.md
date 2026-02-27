# Research: 에이전트 지침 통합 관리

**Feature**: 036-unified-agent-context
**Date**: 2026-02-27

---

## D-001: CLAUDE.md 파일 임포트 지원 여부

**Decision**: CLAUDE.md에서 `@path/to/file` 문법으로 다른 파일을 런타임에 임포트할 수 있다.

**Rationale**:
- Claude Code가 공식 지원하는 기능
- `@docs/agent-guidelines.md`처럼 한 줄에 파일 경로를 명시하면 Claude Code가 해당 파일을 함께 읽음
- 최대 5단계 재귀 임포트 지원
- 상대 경로는 파일 위치 기준으로 해석

**Implications**:
- CLAUDE.md를 슬림하게 유지하고 공통 지침은 `@docs/agent-guidelines.md`로 위임 가능
- Claude Code 세션이 시작될 때마다 `docs/agent-guidelines.md`를 자동으로 읽으므로 내용이 항상 최신

---

## D-002: AGENTS.md 파일 포함 문법 지원 여부

**Decision**: AGENTS.md는 파일 임포트/포함 문법을 지원하지 않는다. 내용이 직접 파일 안에 있어야 한다.

**Rationale**:
- OpenAI Codex CLI의 AGENTS.md는 표준 마크다운을 단순 읽기만 함
- `@` 임포트나 다른 포함 문법 없음
- 파일 참조만으로는 Codex가 공통 지침에 접근할 수 없음

**Implications**:
- AGENTS.md에는 공통 지침 내용이 직접 포함되어야 함
- 스크립트 기반 동기화가 필요: `update-agent-context.sh`가 `docs/agent-guidelines.md`의 내용을 AGENTS.md에 복사해야 함

---

## D-003: 통합 아키텍처 선택

**Decision**: 공유 소스(`docs/agent-guidelines.md`) + 에이전트별 동기화 방식 채택

**Rationale**:
- Claude Code는 런타임 임포트 지원 → CLAUDE.md를 슬림하게 유지
- Codex는 임포트 미지원 → 스크립트로 내용 동기화(build-time sync)
- 단일 수정 지점(`docs/agent-guidelines.md`)으로 FR-004 충족
- 기존 speckit `update-agent-context.sh` 스크립트 수정으로 자동화 가능

**Structure**:
```
docs/
└── agent-guidelines.md      # 공통 에이전트 지침 (단일 진실 소스)
CLAUDE.md                    # @docs/agent-guidelines.md + Claude 전용 설정
AGENTS.md                    # 스크립트로 동기화된 공통 내용 + Codex 전용 설정
.specify/scripts/bash/
└── update-agent-context.sh  # docs/agent-guidelines.md 기준으로 동기화
```

**Alternatives Considered**:
- **완전 링크만** (CLAUDE.md, AGENTS.md 모두 링크 텍스트만): Codex가 공통 지침을 읽지 못하므로 기각
- **심링크(symlink)**: 두 파일이 같은 내용을 가져야 하지만 에이전트별 전용 설정 추가가 불가능하므로 기각
- **수동 관리 유지**: 문제의 근본 원인이므로 기각

---

## D-004: .gitignore 처리

**Decision**: `docs/agent-guidelines.md`는 git에 추적한다. 현재 .gitignore에서 `CLAUDE.md`와 `AGENTS.md`를 제외하고 있는 경우 `docs/agent-guidelines.md`는 별도 처리 불필요.

**Rationale**:
- 현재 CLAUDE.md는 `.gitignore`에 포함되어 있어 추적되지 않음 (`AGENTS.md`도 동일)
- `docs/agent-guidelines.md`는 공통 가이드라인 문서이므로 팀원 모두가 공유해야 함 → git 추적 대상
- 에이전트 루트 파일들(CLAUDE.md, AGENTS.md)은 로컬 환경별로 다를 수 있어 현행 .gitignore 정책 유지
