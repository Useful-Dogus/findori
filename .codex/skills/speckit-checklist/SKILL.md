---
name: speckit-checklist
description: Use when the user wants the Speckit checklist workflow for a feature specification or planning artifact.
---

# Speckit Checklist

Use this skill only as a thin entrypoint to the repo-local Speckit prompt.

## Delegation Rule

1. Treat a literal user message beginning with `/speckit.checklist` as an invocation request for this skill.
2. Confirm the repository contains `.codex/prompts/speckit.checklist.md`.
3. Read `AGENTS.md` and any relevant nested agent guides.
4. Read `.codex/prompts/speckit.checklist.md`.
5. Follow that prompt file as the sole authoritative workflow for checklist generation, updates, and reporting.

Do not substitute a summarized workflow from this skill when the repo prompt is available.
