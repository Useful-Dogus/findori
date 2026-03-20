# Findori

핀도리(Findori)는 개인 투자자를 위해 금융 이슈를 카드형으로 쉽게 풀어주는 앱/웹 서비스입니다.

## Codex Workflow

이 저장소는 Codex를 단순 질의응답 도구가 아니라 저장소 내장형 실행 에이전트로 사용하는 것을 기본으로 합니다.

- 저장소 규칙: `AGENTS.md` -> `docs/agent-guidelines.md`
- Speckit 프롬프트: `.codex/prompts/`
- repo-local skill: `.codex/skills/`
- 구현 흐름: `spec -> plan -> tasks -> implement`
- 기본 품질 게이트: `npm run validate`, `npm run test`, 필요 시 `npm run build`

repo-local skill을 로컬 Codex 환경에 설치하려면 아래 스크립트를 사용합니다.

```bash
bash scripts/install-codex-speckit-skills.sh
```

## MVP Documents

문서 인덱스에서 전체 MVP 문서를 확인할 수 있습니다.

- [`docs/mvp/README.md`](./docs/mvp/README.md)
