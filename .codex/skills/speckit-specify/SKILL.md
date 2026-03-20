---
name: speckit-specify
description: Use when the user explicitly invokes `$speckit-specify`, literally types `/speckit.specify`, or asks to turn a new requirement into a Speckit `spec.md` artifact inside this repository.
---

# Speckit Specify

Use this skill only as a thin entrypoint to the repo-local Speckit prompt.

## Delegation Rule

1. Treat a literal user message beginning with `/speckit.specify` as an invocation request for this skill.
2. Confirm the repository contains `.codex/prompts/speckit.specify.md`.
3. Read `AGENTS.md` and any relevant nested repository guidance before proceeding.
4. Read `.codex/prompts/speckit.specify.md`.
5. Follow that prompt file as the authoritative workflow for requirement shaping, spec quality, and artifact generation.

Do not replace the repo-local prompt with a summarized workflow when the prompt file is available.
