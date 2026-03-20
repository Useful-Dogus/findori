---
name: speckit-clarify
description: Use when the user wants the Speckit clarification workflow for an existing feature specification.
---

# Speckit Clarify

Use this skill only as a thin entrypoint to the repo-local Speckit prompt.

## Delegation Rule

1. Treat a literal user message beginning with `/speckit.clarify` as an invocation request for this skill.
2. Confirm the repository contains `.codex/prompts/speckit.clarify.md`.
3. Read `AGENTS.md` and any relevant nested agent guides.
4. Read `.codex/prompts/speckit.clarify.md`.
5. Follow that prompt file as the sole authoritative workflow for clarification, spec updates, readiness checks, and reporting.

Do not substitute a summarized workflow from this skill when the repo prompt is available.
