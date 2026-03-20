---
name: speckit-tasks
description: Use when the user explicitly invokes `$speckit-tasks`, literally types `/speckit.tasks`, or asks to break an approved Speckit plan into execution-ready tasks for this repository.
---

# Speckit Tasks

Use this skill only as a thin entrypoint to the repo-local Speckit prompt.

## Delegation Rule

1. Treat a literal user message beginning with `/speckit.tasks` as an invocation request for this skill.
2. Confirm the repository contains `.codex/prompts/speckit.tasks.md`.
3. Read `AGENTS.md` and any relevant nested repository guidance before proceeding.
4. Read `.codex/prompts/speckit.tasks.md`.
5. Follow that prompt file as the authoritative workflow for task breakdown, dependency ordering, and execution readiness.

Do not replace the repo-local prompt with a summarized workflow when the prompt file is available.
