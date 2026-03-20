---
name: ship-next-queue
description: Use when the user wants Codex to inspect repository and GitHub state, identify the most appropriate next tasks, and present an execution queue for user review before any Ship Next implementation loop begins.
---

# Ship Next Queue

## Overview

Use this skill to build a reviewed execution queue before any repeated delivery loop starts.

This skill should:

1. inspect repository state and GitHub state together
2. identify a small set of realistic next tasks
3. rank them by execution suitability
4. present the queue to the user for approval
5. stop after approval-ready reporting

This skill does not implement code, open PRs, or merge anything.

## When To Use

Use this skill when the user wants one or more of the following:

- a shortlist of the next tasks that are actually ready to execute
- a queue of issues to run through `$ship-next` later
- a human-reviewed approval step before automation starts
- a batch plan for repeated issue-to-merge execution

Do not use this skill when the user wants a single immediate `$ship-next` run or when the execution queue is already approved.

## Preconditions

- The repository should already support `$ship-next`.
- `gh` auth should work for reading issues, PRs, reviews, and checks.
- The repository should expose enough local context to judge readiness, such as docs, tests, scripts, or known quality signals.

If these are missing, stop and report the missing prerequisite instead of producing a low-confidence queue.

## Workflow

1. Build context first.
Inspect the working tree, recent commits, obvious local failures, milestone context, open issues, open PRs, recent merged PRs, and any broken automation or failing CI that changes what is safe to work on next.

2. Prefer existing tracked work.
Reuse existing issues whenever possible. Only suggest new work items if you find a concrete blocker that is not already tracked and the gap is narrow enough to describe clearly.

3. Filter for execution readiness.
Exclude or demote tasks that are blocked by:
- unresolved dependencies
- unclear product requirements
- active overlapping PRs
- failing foundational checks
- missing repository permissions

4. Score candidate tasks.
Evaluate each candidate using practical execution criteria:
- priority and critical path relevance
- dependency readiness
- scope size and containment
- likely verification burden
- merge confidence
- review risk
- uncertainty level

5. Produce a small queue.
Return a compact queue, usually `3` to `7` items, ordered from most executable to least executable among the viable set.

6. Separate queue from backlog.
Mark each candidate as one of:
- `ready`
- `hold`
- `reject`

Only `ready` items belong in the proposed execution queue.

7. Stop for user review.
Do not begin implementation. Present the proposed queue and wait for the user to approve, reorder, trim, or replace items.

## Output Format

For each proposed item, report:

- queue position
- issue title and link
- why it was selected now
- key dependency or prerequisite status
- expected change size
- main execution risk
- merge confidence: `high`, `medium`, or `low`

Also include:

- items placed on `hold` and why
- any newly suggested issue creation
- a clear statement that no execution has started yet

## Queue Rules

- Prefer the smallest task that moves the critical path forward.
- Prefer unblockers over cosmetic work when foundational gaps remain.
- Prefer tasks whose acceptance criteria are already concrete enough for Speckit.
- Avoid queue items that would likely collide with open PRs or unresolved design decisions.
- Re-evaluate queue suitability if remote state changes materially before execution begins.

## Handoff To Loop

After the user approves a queue, execution should hand off to `$ship-next-loop`.

The approved handoff should include, at minimum:

- the ordered list of approved issues
- any user edits to priority or exclusions
- any explicit stop rule the user wants for the later execution phase

## Failure Handling

- If GitHub read access is unavailable, stop and report that queue generation could not be validated.
- If repository state is too unstable to rank tasks confidently, stop and explain why.
- If no ready work exists, report that explicitly instead of forcing a queue.
