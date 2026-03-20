---
name: ship-next-pipeline
description: Use when the user wants a thin top-level workflow that first builds a reviewed Ship Next execution queue, pauses for user approval, and then hands the approved queue to $ship-next-loop for repeated execution.
---

# Ship Next Pipeline

## Overview

Use this skill as a thin orchestration layer over:

- `$ship-next-queue`
- `$ship-next-loop`

This skill should not replace those skills. It should only coordinate them in order.

The pipeline is:

1. run `$ship-next-queue`
2. present the proposed queue to the user
3. stop for approval
4. after approval, run `$ship-next-loop` with the approved queue

## When To Use

Use this skill when the user wants one entrypoint for:

- queue generation plus approval gating
- approved queue execution after review
- a full repeated Ship Next pipeline without manually choosing the next skill at each step

Do not use this skill when the user only wants queue generation or only wants execution of an already approved queue. In those cases, use the lower-level skill directly.

## Role Boundaries

- `$ship-next-queue` owns repository and GitHub triage plus queue proposal.
- `$ship-next-loop` owns worktree creation, `$ship-next` execution, PR review/check handling, merge, sync, and repeat.
- `$ship-next-pipeline` owns only the handoff and approval checkpoint.

Do not duplicate detailed queue ranking logic or loop execution logic here unless the lower-level skills are unavailable.

## Workflow

1. Start with queue discovery.
Invoke `$ship-next-queue` behavior to inspect the repository and GitHub state and produce an approval-ready queue.

2. Pause for explicit user approval.
Do not start implementation automatically after queue generation. The user must be able to:
- approve the queue as-is
- reorder items
- remove items
- stop entirely

3. Carry the approved queue forward exactly.
When the user approves, pass the approved ordering, exclusions, and any user-defined stop rule to `$ship-next-loop`.

4. Execute through the loop skill.
Invoke `$ship-next-loop` behavior for the approved queue. Do not silently rediscover a fresh queue once execution has begun.

5. Report pipeline state clearly.
Make it explicit whether the pipeline is:
- awaiting queue approval
- executing the approved queue
- stopped due to a loop blocker
- complete

## Approval Rule

User approval is mandatory between queue generation and execution.

If approval is missing, ambiguous, or conditional in a way that changes queue contents, stop and resolve that before handing off to `$ship-next-loop`.

## Failure Handling

- If queue generation fails, stop before execution.
- If the user does not approve the queue, stop without side effects.
- If loop execution fails after approval, report the exact loop blocker and preserve the lower-level skill state.
