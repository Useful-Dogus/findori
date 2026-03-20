---
name: ship-next-loop
description: Use when the user wants Codex to execute an already approved Ship Next queue as a repeated pipeline: create an isolated worktree, execute $ship-next once for the next approved item, inspect PR review and merge status, update main from origin, then continue with the next approved task from a fresh worktree.
---

# Ship Next Loop

## Overview

Use this skill to execute an already approved `Ship Next` queue safely, one item at a time.

Each cycle should:

1. create a fresh worktree from the latest remote `main`
2. run `$ship-next` inside that worktree
3. wait for required review and CI state
4. merge the PR when repository rules allow it
5. update local `main` from `origin/main`
6. start the next cycle from a new worktree

This skill is for repeated issue-to-merge execution after queue approval, not for queue discovery.

## When To Use

Use this skill when the user wants one or more of the following:

- run an approved `Ship Next` queue without manually re-preparing the repo
- isolate each run in a separate git worktree
- continue from merged PR to the next task automatically
- process a user-approved queue of issues until a stop condition is hit

Do not use this skill when the user still needs task discovery, prioritization, or approval. Use `$ship-next-queue` first in that case.

## Preconditions

- The repository must already support `$ship-next`.
- The execution queue must already be approved by the user.
- `gh` auth must work for issue, PR, review, check, and merge operations.
- The agent must be allowed to create and remove sibling worktrees.
- The repository must have a clear default branch, usually `main`.

If these are not true, stop and report the missing prerequisite instead of improvising.

## Execution Input

Before starting, confirm the approved queue contains:

- an ordered list of approved issues or tasks
- any user exclusions or priority edits
- any user-defined stop rule

If the approved queue is missing or ambiguous, stop and ask for it.

## Default Limits

If the user does not specify additional loop bounds, use these defaults:

- process one queue item at a time
- always rebase the next cycle on the latest `origin/main`
- stop when the approved queue is exhausted

Do not discover new tasks automatically once execution begins. If the queue is exhausted, stop and report back.

## Cycle Workflow

1. Confirm the starting repo is safe.
Check `git status --short` in the current worktree. If the tree contains user changes unrelated to the loop, do not disturb them. Use a new sibling worktree for loop execution.

2. Refresh remote state.
Fetch `origin` and inspect the default branch head before each cycle. Base every new worktree on the latest remote default branch, not on a stale local branch.

3. Create an isolated worktree.
Create a uniquely named branch and sibling worktree for the cycle. Use the `codex/` branch prefix unless the user requested another naming rule.

4. Run `$ship-next` inside the new worktree.
Treat `$ship-next` as the execution engine for the next approved item in the queue: Speckit progression, implementation, verification, commit, push, and PR creation.

5. Inspect the resulting PR immediately.
Capture:
- PR URL
- issue URL
- branch name
- current review state
- current CI/check state
- mergeability or merge block reason

6. Handle review state conservatively.
If review is still pending, wait and re-check rather than forcing a merge.
If changes are requested, address only clear and bounded feedback in the same cycle. Re-run relevant verification before updating the PR.
If review feedback is ambiguous, high-risk, or requires product clarification, stop the loop and report the blocker.

7. Merge only when the repository allows it.
Merge only after required checks pass, required approvals exist, and there are no unresolved blocking review comments. Use the repository's preferred merge strategy if it is discoverable; otherwise use the least surprising non-interactive strategy available.

8. Sync default branch after merge.
After a successful merge, return to the stable base repository, fetch `origin`, and fast-forward local `main` to the merged remote state before creating the next worktree.

9. Clean up the completed cycle.
Remove the merged cycle worktree and local branch when safe. Do not delete branches or worktrees that still contain unmerged work.

10. Re-evaluate whether another cycle should start.
Before starting another cycle, check the remaining approved queue and stop conditions.

## Stop Conditions

Stop the loop when any of the following is true:

- the approved queue is exhausted
- GitHub access, merge permission, or required review access is missing
- required CI checks fail and cannot be fixed safely in the current cycle
- a PR receives blocking review feedback that is not safely resolvable in the same run
- the repository enters a conflicting or dirty state that risks user work
- remote `main` changes in a way that invalidates the remaining approved queue
- the agent cannot determine whether merging would violate repository policy

Prefer stopping with a clear reason over guessing and continuing.

## Review And Merge Rules

- Do not merge your own PR if the repository clearly requires independent human approval and that approval is absent.
- Do not dismiss or ignore blocking reviews just to keep the loop moving.
- Re-check PR reviews and checks after every push that responds to review feedback.
- If auto-merge is the safest available path and repository policy allows it, enabling auto-merge is acceptable. Still stop if the next cycle depends on a merge that has not completed yet.

## Queue Rules Between Cycles

- Respect the user-approved queue order unless a later item becomes invalid or blocked.
- Re-check that the next approved item is still safe after each merge and sync.
- Do not silently add new tasks to the queue during execution.

## Reporting Format

At the end of the loop, report:

- how many cycles were attempted and how many merged successfully
- the issue and PR link for each completed cycle
- which approved queue items were skipped or left untouched
- the stop condition that ended the loop
- any PR left open or blocked
- any follow-up action needed from a human

## Failure Handling

- If `$ship-next` fails before opening a PR, stop the loop and report the failing stage.
- If a PR opens but cannot be merged safely, stop the loop and report the exact blocker.
- If worktree creation, fetch, push, or merge commands fail unexpectedly, stop and preserve the current state for inspection.
