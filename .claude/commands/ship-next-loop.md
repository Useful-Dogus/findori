---
description: 승인된 Ship Next 큐를 순서대로 실행한다. 각 사이클마다 격리된 worktree를 생성하고 /ship-next를 실행하여 PR 생성, 검토 대기, 머지, 동기화 후 다음 항목으로 진행한다. 큐가 소진되거나 블로커가 발생할 때까지 반복한다.
argument-hint: [이슈번호1 이슈번호2 ...]
---

## 사용자 입력 (승인된 큐)

```
$ARGUMENTS
```

`$ARGUMENTS`가 비어 있으면 즉시 중단하고 다음을 요청한다:
- 승인된 이슈 번호 순서 목록
- 사용자가 지정한 중단 조건 (없으면 "큐 소진 시 중단" 기본값 사용)

## 현재 저장소 상태

**Git 상태:**
```
!`git remote get-url origin && echo "---" && git branch --show-current && echo "---" && git status --short`
```

**원격 main 상태:**
```
!`git fetch origin main --dry-run 2>&1 && git log origin/main --oneline -3`
```

## 사전조건 검증

루프를 시작하기 전 모두 충족되어야 한다. 하나라도 실패하면 중단한다:

- [ ] 승인된 큐가 명확하게 제공되었는가
- [ ] `gh auth status` 인증 확인
- [ ] 현재 작업 트리에 사용자의 미커밋 변경사항이 없는가 (있으면 건드리지 않음)
- [ ] `git worktree` 명령이 사용 가능한가
- [ ] 저장소에 명확한 기본 브랜치(main)가 있는가

## 기본 제한값

사용자가 달리 지정하지 않으면:

- 한 번에 하나의 큐 항목 처리
- 각 사이클은 최신 `origin/main`을 베이스로 시작
- 큐 소진 시 자동 중단
- 큐 실행 중 새 태스크를 자동으로 추가하지 않음

## 각 사이클 실행 순서

### 1. 안전 확인

```sh
git fetch origin main
git status --short
```

현재 작업 트리에 사용자 변경사항이 있으면 해당 트리를 건드리지 않고 sibling worktree를 사용한다.

### 2. 격리된 worktree 생성

```sh
git worktree add ../findori-ship-[이슈번호] -b issue/[이슈번호]-[짧은-설명] origin/main
```

- 브랜치명 형식: `issue/[번호]-[짧은-설명]`
- 최신 `origin/main`을 베이스로 사용 (로컬 main이 아님)

### 3. /ship-next 실행

해당 worktree 컨텍스트에서 `/ship-next`를 실행한다. 이슈 번호를 명시적으로 전달하여 올바른 이슈를 선택하도록 한다.

`/ship-next`가 PR 생성 전에 실패하면 루프를 중단하고 실패 단계를 보고한다.

### 4. PR 상태 확인

```sh
gh pr view --json number,url,state,reviewDecision,statusCheckRollup,mergeable,mergeStateStatus
```

캡처:
- PR URL 및 이슈 URL
- 브랜치명
- 현재 리뷰 상태
- CI 체크 상태
- 머지 가능 여부 및 블로커 이유

### 5. 리뷰 및 체크 대기

**체크 통과 전**: 재확인하되 강제 머지하지 않는다.

**리뷰 요청이 있는 경우**:
- 명확하고 범위가 제한된 피드백이면 같은 사이클에서 수정 후 재검증
- 애매하거나 고위험이거나 제품 결정이 필요한 피드백이면 루프를 중단하고 보고

**리뷰 상태 처리 규칙**:
- 저장소가 독립적인 인간 승인을 명확히 요구하고 그 승인이 없으면 머지하지 않는다
- blocking 리뷰를 무시하거나 dismiss하지 않는다

### 6. 머지

저장소 정책을 준수하여 머지한다:
- 필수 체크 통과
- 필수 승인 존재
- blocking 리뷰 코멘트 없음

자동 머지가 가장 안전한 경로이고 저장소 정책이 허용한다면 auto-merge 활성화도 가능하다.

```sh
gh pr merge [번호] --squash --auto
```

### 7. 로컬 main 동기화

```sh
cd [메인-저장소-경로]
git fetch origin
git merge --ff-only origin/main
```

### 8. Worktree 정리

머지 완료된 worktree와 로컬 브랜치를 제거한다.

```sh
git worktree remove ../findori-ship-[이슈번호]
git branch -d issue/[이슈번호]-[짧은-설명]
```

미머지 작업이 있는 worktree는 삭제하지 않는다.

### 9. 다음 사이클 판단

- 남은 큐 항목 확인
- 중단 조건 재확인
- 계속 진행하면 1번으로 돌아감

## 중단 조건

아래 중 하나라도 해당하면 루프를 멈추고 이유를 명확히 보고한다:

- 승인된 큐 소진
- GitHub 접근, 머지 권한, 또는 필요한 리뷰 접근 불가
- CI 체크 실패 후 현재 사이클에서 안전하게 수정 불가
- 같은 실행에서 안전하게 해결 불가한 blocking 리뷰 피드백
- 사용자 작업에 위험한 충돌 또는 dirty 상태
- 원격 main이 남은 승인 큐를 무효화하는 방식으로 변경
- 머지가 저장소 정책을 위반하는지 판단 불가

**불확실할 때는 계속하기보다 중단하고 보고한다.**

## 최종 보고

루프 완료 후 보고:

```
## Ship Next Loop 실행 결과

- 시도한 사이클 수: [N]
- 성공적으로 머지된 사이클: [N]

### 완료된 항목
| 이슈 | PR | 결과 |
|------|-----|------|
| #[N] [제목] | [PR URL] | 머지됨 |

### 건너뛰거나 미처리된 항목
- #[N] [제목] — [이유]

### 루프 종료 원인
[종료 조건]

### 열린 상태로 남은 PR
[있는 경우 목록]

### 사람이 처리해야 할 후속 작업
[있는 경우 목록]
```
