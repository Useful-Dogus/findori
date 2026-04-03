# Findori

핀도리(Findori)는 국내 주식 시장 이슈와 대표 지수·환율 변동 원인을 슬라이드형 카드로 구조화해 제공하는 모바일 우선 반응형 웹 브리핑 서비스입니다.

매일 KST 22시, AI 파이프라인이 금융 뉴스를 수집하고 "사건 → 해석 → 시장 반응" 구조의 이슈 카드로 자동 생성합니다. 사용자는 스와이프 방식으로 당일 핵심 흐름을 60초 내에 파악할 수 있습니다.

---

## 기술 스택

| 레이어 | 기술 |
|---|---|
| 프론트엔드 | Next.js 15 (App Router), React 19, Tailwind CSS v4 |
| 언어 | TypeScript 5 (strict) |
| 데이터베이스 | Supabase PostgreSQL |
| AI | Anthropic Claude (Haiku - 필터, Sonnet - 카드 생성) |
| 배포 | Vercel (cron: 매일 UTC 13:00 / KST 22:00) |

---

## 로컬 개발 시작

```bash
# 1. 의존성 설치
npm install

# 2. 환경변수 설정 (.env.example 참고)
cp .env.example .env.local
# .env.local을 열어 7개 변수 입력 (발급 방법: docs/env-setup.md)

# 3. 개발 서버 실행
npm run dev
```

환경변수 상세 발급 방법 → [`docs/env-setup.md`](./docs/env-setup.md)

---

## 주요 명령어

```bash
npm run dev      # 로컬 개발 서버
npm run build    # 프로덕션 빌드 (품질 게이트)
npx tsc --noEmit # 타입 검사
npm run lint     # 린트
```

---

## 프로젝트 구조

```text
src/
├── app/
│   ├── (admin)/admin/          # Admin UI (피드·매체·파이프라인 관리)
│   ├── api/admin/              # Admin API (pipeline/run, logs, feeds, issues, sources)
│   ├── api/cron/pipeline/      # Vercel cron 엔드포인트 (매일 22:00 KST)
│   └── api/feeds|issues|og/    # 공개 피드 API
├── lib/
│   ├── pipeline/               # 파이프라인 핵심 로직
│   │   ├── collect.ts          # RSS 수집 (소스당 최대 30건)
│   │   ├── filter.ts           # Haiku 1차 필터 (투자 관련 상위 10건)
│   │   ├── generate.ts         # Sonnet 카드 생성 (최대 3개 이슈)
│   │   ├── store.ts            # draft feed/issue DB 저장
│   │   └── index.ts            # 파이프라인 오케스트레이터
│   ├── cards/                  # 카드 타입 파서/검증
│   └── supabase/               # 클라이언트 (admin/server/client)
├── components/features/admin/  # Admin UI 컴포넌트
└── types/                      # TypeScript 타입 (pipeline, cards, database.types)

supabase/migrations/            # DB 마이그레이션
specs/                          # 기능별 설계 문서
docs/                           # 프로젝트 문서
```

---

## 문서

- [`docs/mvp/`](./docs/mvp/README.md) — MVP 문서 인덱스 (PRD, SRS, 디자인 가이드 등)
- [`docs/env-setup.md`](./docs/env-setup.md) — 환경변수 설정 및 Vercel 배포 가이드
- [`docs/artifact-conventions.md`](./docs/artifact-conventions.md) — 스펙·커밋·PR 작성 규칙

---

## AI Agent Workflow

이 저장소는 AI 에이전트를 저장소 내장형 실행 에이전트로 사용합니다. **Claude Code**와 **Codex** 양쪽을 지원합니다.

- 저장소 규칙: `docs/agent-guidelines.md`
- 에이전트 컨텍스트: `CLAUDE.md` (Claude Code), `AGENTS.md` → `docs/agent-guidelines.md` (Codex)
- Speckit 프롬프트: `.specify/templates/`, `.codex/prompts/`
- 구현 흐름: `spec → plan → tasks → implement`
- 품질 게이트: `npx tsc --noEmit`, `npm run build`

Codex repo-local skill을 로컬 환경에 설치하려면:

```bash
bash scripts/install-codex-speckit-skills.sh
```
