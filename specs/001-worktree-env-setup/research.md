# Research: 워크트리 환경변수 관리 자동화

**Branch**: `001-worktree-env-setup` | **Date**: 2026-03-05

---

## Decision 1: 연결 방식 — 심볼릭 링크 vs 복사

**Decision**: 심볼릭 링크(symlink) 방식 채택

**Rationale**:
- FR-003이 "메인 `.env.local` 변경 시 워크트리에서 추가 작업 없이 즉시 반영"을 요구한다. 복사 방식은 이 요건을 충족할 수 없다.
- macOS/Linux에서 `ln -s` 는 기본 내장 명령어이며 추가 의존성이 없다.
- `.env.local`은 이미 `.gitignore`에 등록되어 있으므로, symlink 자체(dangling 여부 무관)도 추적되지 않는다.
- git은 symlink 대상 파일이 아닌 symlink 자체를 추적하며, `.env.local` 심볼릭 링크도 gitignore에 포함되어 안전하다.

**Alternatives considered**:
- **복사(cp)**: 단순하지만 변경 자동 반영 불가 — FR-003 위반으로 기각
- **외부 시크릿 매니저(1Password, Vault 등)**: Out of Scope, 이슈 명시적 배제
- **`.env.local` 직접 커밋**: 보안 정책 위반(CLAUDE.md Security Rules) — 불가

---

## Decision 2: 워크트리 루트 탐지 방식

**Decision**: `git rev-parse --git-common-dir` 을 사용하여 메인 저장소 루트를 동적으로 확인

**Rationale**:
- 워크트리는 현재 `.claude/worktrees/<name>` 경로에 생성되지만, 이 경로는 관례이지 강제 사항이 아니다.
- `git rev-parse --git-common-dir`은 워크트리의 공유 git 디렉터리(`<main>/.git`)를 반환하며, 이 경로의 부모 디렉터리가 메인 저장소 루트다.
- 하드코딩(예: `../../.env.local`) 대비 워크트리 위치 변경에 강건하다.

**Alternatives considered**:
- **상대 경로 하드코딩(`../../.env.local`)**: 현재 구조에선 동작하지만 워크트리 위치가 달라지면 깨짐 — 기각
- **환경변수에 경로 하드코딩**: 사람이 직접 관리해야 하므로 자동화 이점 소멸 — 기각

**구현 패턴**:
```bash
COMMON_DIR=$(git rev-parse --git-common-dir)   # /path/to/main/.git 또는 ../../../.git
MAIN_ROOT=$(cd "$(dirname "$COMMON_DIR")" && pwd)  # 메인 저장소 절대 경로
SOURCE="$MAIN_ROOT/.env.local"
TARGET="$(pwd)/.env.local"
```

---

## Decision 3: 스크립트 위치 및 진입점

**Decision**: `scripts/setup-worktree-env.sh` 셸 스크립트 + `package.json` 명령어 연결

**Rationale**:
- 프로젝트에 이미 `npm run` 기반 개발 워크플로우가 확립되어 있다(`validate`, `db:types` 등).
- `npm run env:setup` 형태는 개발자가 별도로 스크립트 위치를 알 필요 없이 일관된 진입점을 제공한다.
- 별도 `scripts/` 디렉터리는 저장소 루트에서 관리되며 버전 관리 대상이다.

**Alternatives considered**:
- **git hook(post-checkout)**: 워크트리 전환 시 자동 실행 가능하지만, 개발자가 hook 존재를 모를 수 있고 의도치 않게 실행될 수 있음 — P2 이후로 연기
- **Makefile**: npm 스크립트와 병행 사용 시 진입점 분산 — 기각

---

## Decision 4: 이미 존재하는 `.env.local` 처리

**Decision**: 기존 파일/심볼릭 링크가 있을 경우 **경고 후 건너뜀** (덮어쓰기 없음), `--force` 플래그로 재설정 가능

**Rationale**:
- FR-006은 재실행 시 사용자에게 확인을 요청하거나 덮어쓰기 여부를 명시하도록 요구한다.
- 자동 덮어쓰기는 의도치 않게 워크트리별로 커스텀된 `.env.local`을 삭제할 위험이 있다.
- `--force` 플래그를 제공하면 명시적 의도가 있는 경우에만 교체를 허용한다.

---

## Decision 5: 상태 확인(status check)

**Decision**: `npm run env:status` 명령어로 연결 상태, 원본 경로, 유효성을 출력

**Rationale**:
- FR-007이 상태 확인 기능을 명시하고 있다.
- 디버깅 시 개발자가 "왜 환경변수가 안 읽히지?"를 빠르게 파악할 수 있다.
- 별도 명령어(스크립트 `--status` 플래그)로 구현하면 동일한 스크립트에서 처리 가능하여 유지보수가 용이하다.

---

## Decision 6: 문서 업데이트 위치

**Decision**: 기존 `docs/env-setup.md`에 워크트리 섹션 추가

**Rationale**:
- `docs/env-setup.md`가 이미 환경변수 설정 가이드의 단일 진입점 역할을 하고 있다.
- 별도 문서를 만들면 관리 포인트가 분산된다.
- 신규 워크트리 섹션을 상단에 배치하여 발견성을 높인다.

---

## 현재 프로젝트 상태 요약 (탐색 결과)

| 항목 | 현황 |
|------|------|
| `.env.local` gitignore 등록 | ✅ 완료 |
| 메인 저장소 `.env.local` | 개발자 로컬에 존재 (git 추적 제외) |
| 워크트리 경로 | `.claude/worktrees/<name>` |
| 기존 env 문서 | `docs/env-setup.md` (로컬/Vercel 가이드만 있음, 워크트리 언급 없음) |
| 기존 setup 스크립트 | 없음 (`scripts/` 디렉터리 없음) |
| npm scripts | `env:setup`, `env:status` 미존재 |
| git hook | 없음 |

---

## NEEDS CLARIFICATION 해소 결과

없음. 모든 기술적 결정이 현재 프로젝트 구조와 요구사항 분석으로 해소됨.
