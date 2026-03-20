---
name: speckit-taskstoissues
description: Use when the user wants to convert a Speckit `tasks.md` into issue-ready work items using the repo-local `speckit.taskstoissues.md` prompt.
---

# Speckit Tasks To Issues

Use this skill only as a thin entrypoint to the repo-local Speckit prompt.

## Delegation Rule

1. Treat a literal user message beginning with `/speckit.taskstoissues` as an invocation request for this skill.
2. Confirm the repository contains `.codex/prompts/speckit.taskstoissues.md`.
3. Read `AGENTS.md` and any relevant nested agent guides.
4. Read `.codex/prompts/speckit.taskstoissues.md`.
5. Follow that prompt file as the sole authoritative workflow for converting task artifacts into issue-ready outputs.

Do not substitute a summarized workflow from this skill when the repo prompt is available.
