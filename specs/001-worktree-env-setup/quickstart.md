# Quickstart: 워크트리 환경변수 설정

**Branch**: `001-worktree-env-setup` | **Date**: 2026-03-05

---

## 전제 조건

- 메인 저장소 루트(`/path/to/findori/`)에 `.env.local`이 존재해야 한다.
  - 처음 설정하는 경우 [docs/env-setup.md](../../docs/env-setup.md)를 참조한다.
- macOS 또는 Linux 환경 (Windows는 Best effort).

---

## 새 워크트리 생성 후 환경변수 연결 (P1)

```bash
# 1. 새 워크트리 생성 (기존 방식과 동일)
git worktree add .claude/worktrees/<branch-name> <branch-name>

# 2. 워크트리로 이동
cd .claude/worktrees/<branch-name>

# 3. 환경변수 연결 (단일 명령)
npm run env:setup
```

성공 시 출력:
```
✅ .env.local → /path/to/findori/.env.local (symlink created)
```

연결 후 바로 개발 서버 실행:
```bash
npm run dev
```

---

## 연결 상태 확인 (P2)

```bash
npm run env:status
```

연결됨:
```
✅ .env.local is linked → /path/to/findori/.env.local (valid)
```

연결 안 됨:
```
❌ .env.local is not configured.
   Run: npm run env:setup
```

---

## 기존 .env.local이 있는 경우 재연결 (--force)

```bash
npm run env:setup -- --force
```

---

## 수동 설정 절차 (스크립트 없이)

스크립트를 사용할 수 없는 환경이라면 아래 명령으로 직접 심볼릭 링크를 생성한다:

```bash
# 워크트리 루트에서 실행
MAIN_ROOT=$(cd "$(dirname "$(git rev-parse --git-common-dir)")" && pwd)
ln -s "$MAIN_ROOT/.env.local" .env.local
```

---

## 자주 묻는 질문

**Q: 메인 `.env.local`을 수정했는데 워크트리에 반영이 안 돼요.**
A: 심볼릭 링크가 올바르게 연결되어 있다면 자동으로 반영됩니다. `npm run env:status`로 상태를 확인하세요.

**Q: 워크트리마다 다른 값이 필요해요 (예: 다른 Supabase 프로젝트).**
A: 이 기능의 Out of Scope입니다. 해당 워크트리에 직접 `.env.local` 파일을 생성하세요 (심볼릭 링크 대신 독립 파일).

**Q: 워크트리를 삭제하면 메인 `.env.local`도 영향받나요?**
A: 아닙니다. 워크트리에는 심볼릭 링크만 존재하며, 원본 파일은 메인 저장소에 있습니다. 워크트리 삭제는 링크만 제거하며 원본에 영향을 주지 않습니다.
