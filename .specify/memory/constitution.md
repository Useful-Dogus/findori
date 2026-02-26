# Findori Constitution

## Core Principles

### I. Code Quality Is a Release Gate
All production code MUST be readable, modular, and maintainable. Pull requests MUST pass static analysis and formatting checks, eliminate obvious dead code, and avoid duplicated business logic. Every change MUST include clear intent in code structure and naming; unexplained complexity is rejected.

### II. Tests Define Correctness
Automated tests are mandatory for all behavioral changes. New or changed logic MUST include appropriate unit tests, plus integration tests when components or boundaries interact. Bug fixes MUST include a regression test that fails before the fix and passes after. Merges are blocked on a fully passing test suite in CI.

### III. User Experience Consistency Over Local Preference
User-facing behavior MUST be consistent across screens, flows, copy tone, interaction patterns, and error states. Existing design patterns and component conventions are the default; deviations require explicit justification and reviewer approval. Accessibility basics (keyboard navigation, semantic structure, contrast-aware styling) are required for all UI changes.

### IV. Performance Is a First-Class Requirement
Features MUST define performance expectations before implementation and verify them before release. Changes must avoid avoidable N+1 patterns, redundant renders, and unbounded memory growth. Any meaningful regression to response time, rendering speed, or resource usage must be measured, documented, and remediated before merge.

### V. Small, Verifiable, and Reversible Delivery
Changes SHOULD be scoped into small increments with clear rollback paths. Risky migrations or refactors MUST include phased rollout or fallback strategies. Reviewers must be able to verify correctness, UX behavior, and performance impact from PR evidence without relying on hidden context.

## Quality Standards

- Linting and formatting checks MUST pass in CI.
- Tests MUST pass in CI with no skipped critical-path tests.
- New features MUST include unit tests; cross-boundary changes MUST include integration tests.
- UI changes MUST preserve established design system tokens, spacing, typography, and interaction states unless explicitly approved.
- Performance-sensitive paths MUST include basic evidence (benchmark, profiling output, or before/after metrics) when modified.

## Development Workflow and Gates

1. Define acceptance criteria including quality, UX, and performance expectations.
2. Implement with tests and minimal-risk scope.
3. Run local validation: lint, tests, and relevant performance checks.
4. Submit PR with evidence:
Code quality: noteworthy design decisions.
Testing: what was added/changed and why.
UX consistency: screenshots or behavior notes for UI changes.
Performance: measured impact or explicit "no material impact" justification.
5. Require at least one reviewer to confirm constitutional compliance before merge.

## Governance
This constitution is the authoritative engineering policy for this repository. If any workflow or document conflicts with it, this constitution takes precedence. Amendments require a pull request that includes rationale, migration impact, and an effective date. Constitutional compliance MUST be checked during planning, code review, and release approval.

**Version**: 1.0.0 | **Ratified**: 2026-02-26 | **Last Amended**: 2026-02-26
