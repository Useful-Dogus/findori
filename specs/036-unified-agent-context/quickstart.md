# Quickstart: 에이전트 지침 통합 관리

## 개요

에이전트 공통 지침은 `docs/agent-guidelines.md` 한 곳에서 관리합니다.

## 공통 지침 수정하기

```bash
# 공통 지침 편집
$EDITOR docs/agent-guidelines.md

# Claude Code: 별도 작업 불필요 — 다음 세션에서 @import로 자동 반영
# Codex: 동기화 실행
.specify/scripts/bash/update-agent-context.sh codex
```

## 에이전트별 전용 설정 수정하기

**Claude 전용 설정** (CLAUDE.md의 `<!-- CLAUDE-SPECIFIC -->` 섹션):
```bash
$EDITOR CLAUDE.md
```

**Codex 전용 설정** (AGENTS.md의 `<!-- CODEX-SPECIFIC -->` 섹션):
```bash
$EDITOR AGENTS.md
# 주의: AUTO-GENERATED 블록은 수정하지 말 것 — 스크립트가 덮어씀
```

## speckit plan 실행 시 자동 동기화

`/speckit.plan` 실행 시 `update-agent-context.sh`가 자동으로 실행되며:
1. `docs/agent-guidelines.md`에 새 기술 스택/변경사항을 기록
2. AGENTS.md의 AUTO-GENERATED 블록을 재생성

## 파일 역할 요약

| 파일 | 역할 | 직접 편집 |
|------|------|-----------|
| `docs/agent-guidelines.md` | 공통 지침 (단일 진실 소스) | ✓ |
| `CLAUDE.md` | @import + Claude 전용 설정 | Claude 전용 섹션만 |
| `AGENTS.md` | 동기화된 공통 내용 + Codex 전용 설정 | Codex 전용 섹션만 |
