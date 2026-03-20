---
name: speckit-constitution
description: Use when the user wants the Speckit constitution workflow for a repository that stores prompts under `.codex/prompts/` and Speckit state under `.specify/`.
---

# Speckit Constitution

Use this skill only as a thin entrypoint to the repo-local Speckit prompt.

## Delegation Rule

1. Treat a literal user message beginning with `/speckit.constitution` as an invocation request for this skill.
2. Confirm the repository contains `.codex/prompts/speckit.constitution.md`.
3. Read `AGENTS.md` and any relevant nested agent guides.
4. Read `.codex/prompts/speckit.constitution.md`.
5. Follow that prompt file as the sole authoritative workflow for execution, file updates, validation, and reporting.

Do not substitute a summarized workflow from this skill when the repo prompt is available.
