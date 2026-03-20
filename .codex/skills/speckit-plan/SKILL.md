---
name: speckit-plan
description: Use when the user explicitly invokes `$speckit-plan`, literally types `/speckit.plan`, or asks to turn an existing Speckit spec into an implementation plan for this repository.
---

# Speckit Plan

Use this skill only as a thin entrypoint to the repo-local Speckit prompt.

## Delegation Rule

1. Treat a literal user message beginning with `/speckit.plan` as an invocation request for this skill.
2. Confirm the repository contains `.codex/prompts/speckit.plan.md`.
3. Read `AGENTS.md` and any relevant nested repository guidance before proceeding.
4. Read `.codex/prompts/speckit.plan.md`.
5. Follow that prompt file as the authoritative workflow for plan generation, architecture decisions, and quality-gate planning.

Do not replace the repo-local prompt with a summarized workflow when the prompt file is available.
