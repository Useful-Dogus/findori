# Tasks: 워크트리 환경변수 관리 자동화

**Input**: Design documents from `/specs/001-worktree-env-setup/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, quickstart.md ✅

**Organization**: 3개 User Story 기준으로 Phase 분리. 각 Phase는 독립 검증 가능한 증분 단위.
**Tests**: 별도 자동화 테스트 미요청 — 각 Phase 말미에 수동 검증 태스크 포함.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: 병렬 실행 가능 (다른 파일, 완료되지 않은 태스크에 의존 없음)
- **[Story]**: 해당 User Story 레이블 (US1, US2, US3)
- 각 태스크에 정확한 파일 경로 포함

---

## Phase 1: Setup (스크립트 기반 구조 초기화)

**Purpose**: `scripts/` 디렉터리와 셸 스크립트 파일 뼈대 생성

- [x] T001 `scripts/` 디렉터리 생성 및 `scripts/setup-worktree-env.sh` 파일 초기화 (shebang `#!/usr/bin/env bash`, `set -euo pipefail`, 상수 선언, `usage()` 함수, `main()` 진입점 구조)

---

## Phase 2: Foundational (공통 블로킹 선행 작업)

**Purpose**: US1·US2 모두 공유하는 git worktree 루트 탐지 로직 구현. 이 Phase가 완료되지 않으면 어떤 User Story도 구현할 수 없다.

**⚠️ CRITICAL**: T002 완료 전까지 US1·US2 구현 불가

- [x] T002 `scripts/setup-worktree-env.sh` 에 `detect_main_root()` 함수 구현 — `git rev-parse --git-common-dir` 로 공유 git 디렉터리 경로 획득 → 부모 디렉터리를 메인 저장소 루트로 반환, worktree가 아닌 메인 저장소에서 실행 시 명확한 오류 메시지 출력

**Checkpoint**: worktree 루트 탐지 로직 완료 → US1·US2 구현 가능

---

## Phase 3: User Story 1 — 새 워크트리에서 환경변수 즉시 사용 (Priority: P1) 🎯 MVP

**Goal**: `npm run env:setup` 단일 명령으로 워크트리에 `.env.local` 심볼릭 링크를 생성하여 앱을 즉시 구동할 수 있다.

**Independent Test**: 새 워크트리에서 `npm run env:setup` 실행 후 `npm run dev`가 환경변수 오류 없이 구동되는지 확인.

### Implementation for User Story 1

- [x] T003 [US1] `scripts/setup-worktree-env.sh` 에 symlink 생성 로직 구현 — `$MAIN_ROOT/.env.local` → `<worktree>/.env.local` 심볼릭 링크 생성 (`ln -s`), 성공 시 경로 포함 확인 메시지 출력
- [x] T004 [US1] `scripts/setup-worktree-env.sh` 에 에러 케이스 처리 — 메인 저장소에 `.env.local` 없을 시 스크립트 종료 및 `docs/env-setup.md` 참조 안내 메시지 출력
- [x] T005 [US1] `scripts/setup-worktree-env.sh` 에 기존 파일/링크 충돌 처리 — 이미 `.env.local`(파일 또는 symlink) 존재 시 경고 후 건너뜀; `--force` 플래그 전달 시에만 기존 항목 제거 후 재생성
- [x] T006 [P] [US1] `package.json` 에 `"env:setup": "bash scripts/setup-worktree-env.sh"` 스크립트 항목 추가
- [x] T007 [US1] US1 수동 검증 — 실제 워크트리에서 `npm run env:setup` 실행 → `.env.local` symlink 생성 확인, `npm run dev` 정상 구동 확인, `npm run env:setup` 재실행 시 경고·건너뜀 동작 확인, `npm run env:setup -- --force` 시 재생성 확인

**Checkpoint**: User Story 1 완료 — 환경변수 수동 복사 없이 워크트리 즉시 구동 가능

---

## Phase 4: User Story 2 — 워크트리 환경변수 설정 상태 확인 (Priority: P2)

**Goal**: `npm run env:status` 명령으로 현재 워크트리의 `.env.local` 연결 상태와 원본 경로를 즉시 확인할 수 있다.

**Independent Test**: `npm run env:status` 실행 후 "연결됨 + 경로" 또는 "연결 안 됨 + 안내 메시지" 출력 확인.

### Implementation for User Story 2

- [x] T008 [US2] `scripts/setup-worktree-env.sh` 에 `--status` 플래그 처리 구현 — `.env.local` 존재 여부·심볼릭 링크 여부·링크 대상 유효성 순서로 검사하여 상태 메시지 출력; 연결 안 된 경우 `npm run env:setup` 안내
- [x] T009 [P] [US2] `package.json` 에 `"env:status": "bash scripts/setup-worktree-env.sh --status"` 스크립트 항목 추가
- [x] T010 [US2] US2 수동 검증 — 연결된 워크트리에서 `npm run env:status` 실행 시 연결 상태 및 원본 경로 출력 확인, 미연결 워크트리에서 실행 시 안내 메시지 출력 확인

**Checkpoint**: User Story 1 + 2 모두 독립 동작 — setup 후 상태 진단 가능

---

## Phase 5: User Story 3 — 워크트리 생성 문서에서 절차 확인 (Priority: P3)

**Goal**: `docs/env-setup.md` 에 워크트리 환경변수 설정 섹션이 추가되어, 개발자가 문서만으로 전체 절차를 파악하고 실행할 수 있다.

**Independent Test**: 문서의 단계별 지침만 따라 수동으로 환경변수를 연결하고 앱을 구동할 수 있는지 확인.

### Implementation for User Story 3

- [x] T011 [US3] `docs/env-setup.md` 최상단(로컬 개발 환경 섹션 앞)에 "워크트리 환경변수 설정" 섹션 추가 — 전제 조건, `npm run env:setup` 명령, `npm run env:status` 상태 확인, `--force` 재설정, 자주 묻는 질문(원본 없음·기존 파일 충돌·워크트리별 독립 값 필요) 포함
- [x] T012 [US3] US3 수동 검증 — 문서에 기술된 절차만 참조하여 새 워크트리에서 스크립트 경로를 직접 찾지 않고도 setup을 완료할 수 있는지 확인

**Checkpoint**: 모든 User Story 완료 — 스크립트 + 문서 모두 준비됨

---

## Phase 6: Polish & 보안 안전장치 확인

**Purpose**: 코드 품질 게이트 통과 및 시크릿 커밋 방지 안전장치 확인

- [x] T013 [P] `npm run validate` 실행 (`type-check` + `lint` + `format:check`) — 오류 발생 시 해당 파일 수정 후 재실행
- [x] T014 [P] 보안 검증 — `git check-ignore -v scripts/setup-worktree-env.sh` (스크립트 미제외 확인, 커밋 대상), `git check-ignore -v .env.local` (gitignore 등록 확인), `git status` 에서 `.env.local` symlink가 untracked 목록에 없는지 확인

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: 의존 없음 — 즉시 시작 가능
- **Phase 2 (Foundational)**: Phase 1 완료 후 — T001 이후만 가능
- **Phase 3 (US1)**: Phase 2 완료 후 — T002 이후 시작 가능, US1·US2·US3 모두 Phase 2 완료 후 병렬 진행 가능
- **Phase 4 (US2)**: Phase 2 완료 후 — T002 이후 시작 가능 (US1과 동시 진행 가능)
- **Phase 5 (US3)**: Phase 1 완료 후 즉시 시작 가능 (문서 작업은 스크립트 구현에 독립적)
- **Phase 6 (Polish)**: 원하는 User Story 모두 완료 후

### User Story Dependencies

- **US1 (P1)**: Phase 2(T002) 이후 시작 가능 — 독립적
- **US2 (P2)**: Phase 2(T002) 이후 시작 가능 — US1과 독립적 (같은 스크립트 파일이나 로직 분리됨)
- **US3 (P3)**: Phase 1(T001) 이후 즉시 시작 가능 — 스크립트 구현 완료 전에도 문서 초안 작성 가능

### Parallel Opportunities (Phase 3 이후)

- T003~T005는 같은 파일(`setup-worktree-env.sh`) 수정이므로 순차 실행
- T006 (`package.json`)과 T003~T005는 다른 파일이므로 병렬 가능
- Phase 4의 T009 (`package.json`)과 T008 (`setup-worktree-env.sh`)은 병렬 가능
- T013, T014는 모두 읽기/검증만이므로 병렬 실행 가능

---

## Parallel Example: User Story 1

```bash
# T003~T005는 같은 파일이므로 순차 실행:
Task: "T003 symlink 생성 로직 구현 in scripts/setup-worktree-env.sh"
Task: "T004 에러 케이스 처리 in scripts/setup-worktree-env.sh"
Task: "T005 기존 파일 충돌 처리 in scripts/setup-worktree-env.sh"

# T006은 다른 파일이므로 T003 착수와 동시에 병렬 가능:
Task: "T006 [P] env:setup 항목 추가 in package.json"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1: Setup (T001)
2. Phase 2: Foundational (T002) — 블로킹, 반드시 완료
3. Phase 3: User Story 1 (T003 → T004 → T005 → T006 → T007)
4. **STOP and VALIDATE**: `npm run env:setup` 으로 새 워크트리 검증
5. US2·US3 진행 여부 결정

### Incremental Delivery

1. Phase 1 + 2 완료 → 스크립트 구조 준비
2. US1 완료 → symlink setup 동작 검증 (MVP)
3. US2 추가 → 상태 확인 기능 검증
4. US3 추가 → 문서화 완성
5. Polish → 품질 게이트 통과

---

## Summary

| 항목 | 내용 |
|------|------|
| 총 태스크 수 | 14 (T001–T014) |
| US1 태스크 수 | 5 (T003–T007) |
| US2 태스크 수 | 3 (T008–T010) |
| US3 태스크 수 | 2 (T011–T012) |
| 병렬 실행 가능 태스크 | T006, T009, T013, T014 ([P] 표시) |
| MVP 범위 | Phase 1 + 2 + US1 (T001~T007) |
| 변경 파일 수 | 3개 (`scripts/setup-worktree-env.sh` 신규, `package.json` 수정, `docs/env-setup.md` 수정) |

---

## Notes

- [P] 태스크 = 다른 파일, 의존 없음 → 병렬 실행 가능
- [Story] 레이블로 각 태스크를 User Story에 추적
- 각 Phase 말미 검증 태스크(T007, T010, T012)는 독립 동작 확인 후 다음 Phase 진행
- `npm run validate` (T013) 실패 시 해당 파일 수정 후 재실행
- 시크릿 커밋 방지 확인(T014)은 PR 제출 전 필수
