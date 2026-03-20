---
name: ship-next
description: Use when the user wants Codex to inspect repository state plus GitHub state, choose the most appropriate next work item, run the Speckit workflow end to end, and open a PR after checks pass.
---

# Ship Next

Use this skill when the user wants to move from "what should we do next?" to "a reviewed PR is open."

## Workflow

1. Build context from the repository before choosing work.
Inspect recent commits, repository structure, open specs, existing validation scripts, and any obvious failing checks.

2. Inspect GitHub state before selecting work.
Review open issues and relevant open or recently merged PRs. Reuse existing tracked work instead of inventing duplicates.

3. Prefer prepared work.
Choose an issue whose dependencies are satisfied, whose scope is independently verifiable, and whose implementation can be driven through `spec -> plan -> tasks -> implement`.

4. Use Speckit as the execution spine.
Run the workflow in this order:
- `$speckit-specify`
- `$speckit-plan`
- `$speckit-tasks`
- `$speckit-implement`

5. Review between stages.
Do not advance to the next stage until the previous artifact is complete enough to support execution.

6. Open a PR only after quality gates pass.
The PR should explain why the change exists, what boundaries changed, what verification ran, and what risks or deferred work remain.

## GitHub Rules

- Default to Korean for issue titles, issue bodies, PR titles, and PR bodies.
- Keep code identifiers, file paths, commands, and API names in their original form.
- Use automatic closing keywords such as `Closes #N` only when the change fully completes the issue.

## Reporting

At the end of the run, report:
- why this task was selected
- which Speckit stages were completed
- what verification ran and whether it passed
- the PR link or the blocker that prevented PR creation
