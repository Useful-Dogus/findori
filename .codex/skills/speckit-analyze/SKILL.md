---
name: speckit-analyze
description: Use when the user wants the Speckit read-only consistency analysis across `spec.md`, `plan.md`, and `tasks.md`.
---

# Speckit Analyze

Use this skill only as a thin entrypoint to the repo-local Speckit prompt.

## Delegation Rule

1. Treat a literal user message beginning with `/speckit.analyze` as an invocation request for this skill.
2. Confirm the repository contains `.codex/prompts/speckit.analyze.md`.
3. Read `AGENTS.md` and any relevant nested agent guides.
4. Read `.codex/prompts/speckit.analyze.md`.
5. Follow that prompt file as the sole authoritative workflow for read-only analysis, prioritization, and reporting.

Do not substitute a summarized workflow from this skill when the repo prompt is available.
