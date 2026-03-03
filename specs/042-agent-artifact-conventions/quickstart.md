# Quickstart: 에이전트 산출물 작성 규칙 적용 가이드

**Feature**: 042-agent-artifact-conventions
**Date**: 2026-03-03

---

## 1분 요약

이 기능이 완료되면 `docs/artifact-conventions.md`가 생성된다. 모든 에이전트(Claude Code, Codex)와 개발자는 이 문서 **한 곳**을 참조해 일관된 산출물을 만든다.

---

## 빠른 참조

### 새 이슈를 시작할 때

```
1. GitHub에 이슈 생성 → 번호 N 확인
2. branch: git checkout -b 0NN-<short-name>   (3자리 패딩)
3. specs/0NN-<short-name>/spec.md 작성
4. /speckit.plan → /speckit.tasks → /speckit.implement
5. PR 제목: [Issue #N] <설명>
6. PR 본문: ## Summary + ## Test plan + Closes #N
```

### 커밋 메시지 선택

```
이슈 구현 주 커밋:    [Issue #N] <설명>
버그 수정:            fix: <설명>
긴급 핫픽스:          hotfix: <설명>  (Refs #N 포함 권장)
문서 변경:            docs: <설명>
설정/도구:            chore: <설명>
리팩터링:             refactor: <설명>
```

### PR 링크 키워드

```
이 PR이 이슈를 완전히 닫는다면:   Closes #N
이슈의 일부만 구현한 경우:         Part of #N
단순 참조 (닫지 않음):             Refs #N
```

---

## 전체 사용 흐름

### 1. 새 피처 개발 (일반)

```
GitHub Issue 생성
    ↓
/speckit.specify "피처 설명"  → specs/0NN-*/spec.md
    ↓
/speckit.plan                  → specs/0NN-*/plan.md + research.md + data-model.md
    ↓
/speckit.tasks                 → specs/0NN-*/tasks.md
    ↓
/speckit.implement             → 구현 + 커밋: [Issue #N] <설명>
    ↓
PR 생성: 제목 [Issue #N] <설명>
         본문: ## Summary / ## Test plan / Closes #N
```

### 2. hotfix (긴급 수정)

```
이슈 생성 선택적 (권장하지만 필수 아님)
    ↓
직접 수정 (spec/plan/tasks 사이클 생략)
    ↓
커밋: hotfix: <설명>  또는  fix: <설명>
      (이슈가 있으면) Refs #N
    ↓
PR: ## Summary (한 줄 이상)
    ## Test plan (한 줄 이상)
    Refs #N  (이슈가 없으면 생략)
```

### 3. 소규모 보조 수정 (이슈 없음)

```
커밋: chore|docs|fix|refactor: <설명>
    ↓
PR (필요 시): ## Summary + ## Test plan
              Closes 없음 (이슈 없을 경우)
```

---

## 유효성 검증 체크

구현 완료 후 다음을 확인한다:

- [ ] `docs/artifact-conventions.md` 존재하며 7개 섹션을 포함한다
- [ ] `docs/agent-guidelines.md`에 `docs/artifact-conventions.md` 참조가 추가되었다
- [ ] 동일 작업 설명으로 두 에이전트가 생성한 이슈 초안의 필수 섹션이 일치한다
- [ ] 신규 커밋이 허용 타입 집합 중 하나를 사용한다
- [ ] 신규 PR 본문이 `## Summary` + `## Test plan` + 링크 키워드를 포함한다

---

## 파일 위치 빠른 참조

```
docs/
├── artifact-conventions.md   ← 공통 정책 문서 (NEW)
└── agent-guidelines.md       ← 기술 스택·명령어·코드 스타일 + conventions 참조 (UPDATED)

CLAUDE.md                     ← @docs/agent-guidelines.md 임포트 (변경 없음)
AGENTS.md                     ← docs/agent-guidelines.md 텍스트 참조 (변경 없음)
```
