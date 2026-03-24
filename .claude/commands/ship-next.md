---
description: 다음 작업 아이템을 선택하고 Speckit 워크플로우를 통해 구현한 뒤 PR을 열어라. GitHub 이슈에서 준비된 작업을 골라 specify → plan → tasks → implement 순으로 진행하고 품질 게이트 통과 후 PR을 생성한다.
---

## 실행 컨텍스트

**현재 Git 상태:**
```
!`git status --short && echo "---" && git log --oneline -5`
```

**열린 이슈 목록:**
```
!`gh issue list --state open --limit 20 --json number,title,labels,assignees | jq -r '.[] | "#\(.number) \(.title)"'`
```

**최근 PR 목록:**
```
!`gh pr list --state all --limit 10 --json number,title,state,headRefName | jq -r '.[] | "[\(.state)] #\(.number) \(.title) (\(.headRefName))"'`
```

## 사전조건 검증

다음 항목 중 하나라도 실패하면 즉시 중단하고 원인을 보고한다:

- `gh auth status` 가 인증된 상태인가
- 작업 트리가 clean한가 (커밋되지 않은 변경사항이 없는가)
- `main` 브랜치가 `origin/main`과 동기화되어 있는가

## 작업 선택 기준

이슈를 다음 기준으로 평가하여 가장 적합한 것을 선택한다:

1. **의존성 충족**: 선행 이슈가 완료되었거나 의존성이 없는 것
2. **범위 독립성**: 열린 PR과 충돌하지 않는 것
3. **수행 가능성**: 스펙만으로 구현 가능한 것 (제품 결정 필요 없음)
4. **크리티컬 패스**: 다른 이슈를 언블록하는 것 우선

선택한 이슈와 그 이유를 명시적으로 보고한다.

## Speckit 실행 순서

선택된 이슈에 대해 아래 순서로 실행한다. 각 단계가 충분히 완료될 때까지 다음 단계로 진행하지 않는다.

1. `/speckit.specify` — 이슈 내용을 바탕으로 spec.md 작성
2. `/speckit.plan` — 기술 설계 및 plan.md 작성
3. `/speckit.tasks` — 구현 태스크 목록 생성
4. `/speckit.implement` — 태스크를 순서대로 구현

## 브랜치 및 커밋 규칙

- 브랜치명: `issue/[번호]-[짧은-설명]` (예: `issue/42-dark-mode`)
- 커밋 메시지: Conventional Commits 형식, 한국어 허용
- **절대로** `Co-Authored-By: Claude` 나 협업자 서명을 커밋에 추가하지 않는다

## 품질 게이트

PR 생성 전 아래 검증을 모두 통과해야 한다:

```sh
!`pnpm build 2>&1 | tail -5`
```

- TypeScript 컴파일 오류 없음
- lint 오류 없음 (존재하는 경우)
- 빌드 성공

게이트 실패 시 수정 후 재검증한다. 자동 수정이 불가능한 경우 중단하고 보고한다.

## PR 생성 규칙

- **제목**: 한국어, 70자 이내
- **본문**: 한국어, 아래 구조 준수
- `Closes #N` 키워드는 해당 이슈를 완전히 완료하는 경우에만 사용
- Co-authored-by 라인 추가 금지

PR 본문 구조:
```
## 변경 이유
[이 변경이 필요한 이유]

## 변경 범위
[무엇이 바뀌었는가]

## 검증
[어떤 검증을 수행했는가]

## 남은 작업 / 리스크
[미완성 항목이나 알려진 리스크]
```

## 최종 보고

실행 완료 후 아래 내용을 보고한다:

- 선택한 이슈와 선택 이유
- 완료된 Speckit 단계
- 실행된 검증과 결과
- PR 링크 또는 PR 생성을 막은 블로커
