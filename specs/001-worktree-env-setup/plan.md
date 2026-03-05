# Implementation Plan: 워크트리 환경변수 관리 자동화

**Branch**: `001-worktree-env-setup` | **Date**: 2026-03-05 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/001-worktree-env-setup/spec.md`

## Summary

새 git worktree 생성 시 `.env.local`을 메인 저장소와 자동으로 연결하는 setup 스크립트(`scripts/setup-worktree-env.sh`)를 추가한다. `npm run env:setup` 단일 명령으로 심볼릭 링크를 생성하여 값 재입력 없이 환경변수를 즉시 사용할 수 있게 하며, `npm run env:status`로 연결 상태를 확인할 수 있다. 기존 `docs/env-setup.md`에 워크트리 설정 절차를 추가하여 문서를 완성한다.

## Technical Context

**Language/Version**: Bash (POSIX sh 호환) — 추가 의존성 없음
**Primary Dependencies**: git 내장 명령어(`rev-parse`), coreutils(`ln`, `ls`, `test`)
**Storage**: 파일 시스템 (심볼릭 링크) — DB 변경 없음
**Testing**: 수동 검증 (새 워크트리에서 `npm run env:setup` 실행 후 `npm run dev` 정상 구동 확인)
**Target Platform**: macOS / Linux (개발 환경 전용, 프로덕션 무관)
**Project Type**: 개발 도구 (developer tooling) — 앱 기능에 영향 없음
**Performance Goals**: setup 명령어 완료 10초 이내 (실제 1초 미만 예상)
**Constraints**: `.env.local` 및 시크릿이 git에 커밋되지 않아야 함

## Constitution Check

| 원칙 | 적용 여부 | 평가 |
|------|-----------|------|
| **I. Code Quality** | ✅ | 셸 스크립트는 읽기 쉬운 함수 분리 구조로 작성, 복잡도 최소화 |
| **II. Tests Define Correctness** | ⚠️ 예외 | 순수 개발 도구 셸 스크립트로 자동화 테스트 추가 비용 대비 효과 미미. 수동 검증으로 대체하고 quickstart.md에 검증 절차 명시 |
| **III. UX Consistency** | N/A | UI 변경 없음 |
| **IV. Performance** | ✅ | 파일 시스템 symlink 생성 — 즉각적 완료, 성능 이슈 없음 |
| **V. Small & Reversible** | ✅ | 3개 파일 변경(신규 1 + 수정 2), 롤백 시 스크립트 삭제 및 `package.json` 항목 제거로 완전 복원 |

**Gate 결과**: PASS (Principle II 예외 사유: dev tooling shell script, 명시적으로 정당화됨)

## Project Structure

### Documentation (this feature)

```text
specs/001-worktree-env-setup/
├── spec.md          ✅ 완료
├── plan.md          ✅ 이 파일
├── research.md      ✅ 완료
├── data-model.md    ✅ 완료
├── quickstart.md    ✅ 완료
├── checklists/
│   └── requirements.md  ✅ 완료
└── tasks.md         ⏳ /speckit.tasks 명령으로 생성
```

### Source Code (repository root)

```text
scripts/                      # 신규 디렉터리
└── setup-worktree-env.sh     # 신규 — worktree env setup 스크립트

package.json                  # 수정 — env:setup, env:status 항목 추가

docs/
└── env-setup.md              # 수정 — 워크트리 섹션 추가
```

**Structure Decision**: 단일 프로젝트 구조. `scripts/` 는 향후 다른 개발 도구 스크립트의 기반이 될 수 있어 최상위에 분리.

## Complexity Tracking

*Constitution 위반 없음 — 해당 사항 없음.*

---

## Phase 0 Research 요약

[research.md](research.md) 참조. 핵심 결정:

| 결정 사항 | 채택 방식 |
|-----------|-----------|
| 연결 방식 | 심볼릭 링크 (symlink) |
| 메인 저장소 탐지 | `git rev-parse --git-common-dir` |
| 진입점 | `npm run env:setup` / `npm run env:status` |
| 기존 파일 처리 | 경고 후 건너뜀 + `--force` 플래그 |
| 문서 위치 | 기존 `docs/env-setup.md` 에 섹션 추가 |

## Phase 1 Design 요약

[data-model.md](data-model.md), [quickstart.md](quickstart.md) 참조.

- **영향 파일**: `scripts/setup-worktree-env.sh` (신규), `package.json` (수정), `docs/env-setup.md` (수정)
- **외부 인터페이스 없음**: 순수 내부 개발 도구 — `contracts/` 불필요
- **DB 변경 없음**: Supabase 스키마 영향 없음
