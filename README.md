# Findori

핀도리(Findori)는 개인 투자자를 위해 금융 이슈를 카드형으로 쉽게 풀어주는 앱/웹 서비스입니다.

## AI Agent Workflow

이 저장소는 AI 에이전트를 단순 질의응답 도구가 아니라 저장소 내장형 실행 에이전트로 사용하는 것을 기본으로 합니다. 현재 **Claude Code**와 **Codex** 양쪽을 지원합니다.

- 저장소 규칙: `docs/agent-guidelines.md`
- 에이전트 컨텍스트: `CLAUDE.md` (Claude Code), `AGENTS.md` → `docs/agent-guidelines.md` (Codex)
- Speckit 프롬프트: `.specify/templates/`, `.codex/prompts/`
- repo-local skill: `.specify/`, `.codex/skills/`
- 구현 흐름: `spec → plan → tasks → implement`
- 품질 게이트: `npx tsc --noEmit`, `npm run build`

Codex repo-local skill을 로컬 환경에 설치하려면:

```bash
bash scripts/install-codex-speckit-skills.sh
```

## MVP Documents

문서 인덱스에서 전체 MVP 문서를 확인할 수 있습니다.

- [`docs/mvp/README.md`](./docs/mvp/README.md)
