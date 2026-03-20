---
name: speckit-implement
description: Use when the user explicitly invokes `$speckit-implement`, literally types `/speckit.implement`, or asks to execute `tasks.md` through implementation, verification, and PR-style reporting in this repository.
---

# Speckit Implement

Use this skill only as a thin entrypoint to the repo-local Speckit prompt.

## Delegation Rule

1. Treat a literal user message beginning with `/speckit.implement` as an invocation request for this skill.
2. Confirm the repository contains `.codex/prompts/speckit.implement.md`.
3. Read `AGENTS.md` and any relevant nested repository guidance before proceeding.
4. Read `.codex/prompts/speckit.implement.md`.
5. Follow that prompt file as the sole authoritative workflow for execution, task updates, quality gates, and PR-style reporting.

Do not replace the repo-local prompt with a summarized workflow when the prompt file is available.
