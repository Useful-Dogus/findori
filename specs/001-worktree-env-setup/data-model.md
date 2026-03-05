# Data Model: 워크트리 환경변수 관리 자동화

**Branch**: `001-worktree-env-setup` | **Date**: 2026-03-05

이 기능은 파일 시스템 수준의 조작(심볼릭 링크 생성)만 수행하며 데이터베이스 엔티티를 추가하거나 변경하지 않는다.

---

## 파일 시스템 엔티티

### 메인 환경변수 파일 (원본)

```
<MAIN_REPO>/.env.local
```

| 속성 | 값 |
|------|----|
| 위치 | git 메인 저장소 루트 (모든 워크트리가 공유하는 원본) |
| git 상태 | `.gitignore` 등록 — 추적 제외 |
| 소유자 | 개발자 (수동 생성 및 관리) |
| 변경 시 영향 | 모든 연결된 워크트리에 즉시 반영 |

포함 변수:

| 변수명 | 공개 여부 |
|--------|-----------|
| `NEXT_PUBLIC_SUPABASE_URL` | 공개 (클라이언트 번들에 포함) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 공개 (RLS 정책 전제) |
| `SUPABASE_SERVICE_ROLE_KEY` | 비밀 — 서버 전용 |
| `ADMIN_PASSWORD` | 비밀 — 서버 전용 |
| `ADMIN_SESSION_SECRET` | 비밀 — 서버 전용 |
| `ANTHROPIC_API_KEY` | 비밀 — 서버 전용 |
| `CRON_SECRET` | 비밀 — 서버 전용 |

---

### 워크트리 환경변수 심볼릭 링크 (참조)

```
<WORKTREE_ROOT>/.env.local  →  (symlink to)  <MAIN_REPO>/.env.local
```

| 속성 | 값 |
|------|----|
| 위치 | 각 git 워크트리 루트 |
| 유형 | 파일 시스템 심볼릭 링크 (절대 경로 또는 상대 경로) |
| git 상태 | `.gitignore` 등록 — 심볼릭 링크 자체도 추적 제외 |
| 생성 주체 | `setup-worktree-env.sh` 스크립트 |
| 생성 시점 | 워크트리 생성 후 개발자가 setup 명령어 실행 시 |
| 삭제 영향 | 워크트리 삭제 시 함께 제거됨, 원본에 영향 없음 |

---

### Setup 스크립트

```
scripts/setup-worktree-env.sh
```

| 속성 | 값 |
|------|----|
| 위치 | 메인 저장소 루트 기준 `scripts/` (버전 관리 포함) |
| 실행 방식 | `npm run env:setup` 또는 직접 실행 |
| 입력 | 없음 (현재 디렉터리와 git 메타데이터에서 자동 탐지) |
| 출력 | 심볼릭 링크 생성 결과, 상태 메시지 |
| 플래그 | `--force`: 기존 `.env.local` 덮어쓰기, `--status`: 현재 상태만 출력 |

---

## 상태 전이

워크트리의 `.env.local` 상태는 아래 3가지 중 하나다:

```
[없음] ──── npm run env:setup ────▶ [연결됨(symlink)]
                                          │
                          메인 .env.local  │  변경 자동 반영
                                          ▼
                                   [최신 값 반영]

[연결됨] ── npm run env:setup --force ──▶ [재연결(symlink 교체)]
[직접 파일] ─ npm run env:setup ──▶ [경고 후 건너뜀]
              npm run env:setup --force ──▶ [symlink로 교체]
```

---

## 영향 받는 파일 목록

| 파일 | 변경 유형 | 내용 |
|------|-----------|------|
| `scripts/setup-worktree-env.sh` | 신규 | symlink 생성, 상태 확인 스크립트 |
| `package.json` | 수정 | `env:setup`, `env:status` 스크립트 항목 추가 |
| `docs/env-setup.md` | 수정 | 워크트리 환경변수 설정 섹션 추가 |

---

## DB 스키마 변경

없음. 이 기능은 순수 파일 시스템 및 개발 도구 레이어의 변경이며, Supabase DB 스키마에 영향을 주지 않는다.
