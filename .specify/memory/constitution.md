<!--
Sync Impact Report
- Version change: n/a → 1.0.0
- Modified principles:
	- PRINCIPLE_1_NAME → I. Secure by Default (NON-NEGOTIABLE)
	- PRINCIPLE_2_NAME → II. Simplicity First
	- PRINCIPLE_3_NAME → III. Basic Testing Discipline
	- PRINCIPLE_4_NAME → IV. Observability Basics
	- PRINCIPLE_5_NAME → V. Semantic Versioning & Changes
- Added sections:
	- Minimal Stack Constraints
	- Workflow & Quality Gates
- Removed sections: none
- Templates requiring updates:
	- ✅ Aligned: .specify/templates/plan-template.md (Constitution Check derives gates from principles)
	- ✅ Aligned: .specify/templates/spec-template.md (no conflicts with principles)
	- ✅ Aligned: .specify/templates/tasks-template.md (structure supports web app minimal setup)
	- ⚠ Pending: .specify/templates/commands/ (folder missing; no command docs to verify)
- Follow-up TODOs:
	- TODO(RATIFICATION_DATE): Original adoption date unknown; set when established.
-->

# Synapse Constitution

<!-- Example: Spec Constitution, TaskFlow Constitution, etc. -->

## Core Principles

### I. Secure by Default (NON-NEGOTIABLE)

Every production deployment MUST enforce HTTPS/TLS; protected resources MUST
require authenticated access; all inputs MUST be validated and sanitized; secrets
MUST be supplied via environment configuration (never committed to the repo) and
granted least-privilege access; dependencies SHOULD be kept current with
security patches. Rationale: protect users and data while minimizing attack
surface.

### II. Simplicity First

The web app MUST prefer the simplest viable architecture: a single backend
service and an optional frontend client. Avoid premature abstraction and custom
frameworks; prefer built-in framework features over new libraries; keep
configuration minimal and documented. Rationale: simple systems are easier to
develop, operate, and secure.

### III. Basic Testing Discipline

Critical routes (e.g., health, auth, primary user flows) MUST have smoke tests;
pre-merge CI MUST run linters/formatters and basic tests; deployments MUST not
proceed if these checks fail. Rationale: minimal automated checks reduce
regression risk without imposing heavy process.

### IV. Observability Basics

Implement a health/readiness endpoint; use structured logging with request IDs;
capture unhandled errors with stack traces; record minimal metrics where
available (e.g., request rate/error rate). Rationale: baseline visibility to
diagnose issues quickly.

### V. Semantic Versioning & Changes

All user-facing/API changes MUST follow semantic versioning (MAJOR.MINOR.PATCH);
breaking changes MUST include migration notes and be grouped under a MAJOR
release; public interfaces MUST be documented before release. Rationale:
predictable change management for consumers and operators.

## Minimal Stack Constraints

<!-- Example: Additional Constraints, Security Requirements, Performance Standards, etc. -->

Use a single backend service (language/framework chosen per feature) and, if
needed, a single frontend app. Configuration MUST be via environment variables;
provide an example file to document required settings. PII and secrets MUST be
handled securely (never logged, never committed). Default network ports and
paths SHOULD be documented. Rationale: constrain footprint to keep operations
straightforward.

## Workflow & Quality Gates

<!-- Example: Development Workflow, Review Process, Quality Gates, etc. -->

All changes MUST land via pull request with at least one reviewer. Before merge:
run linters/formatters, basic tests, and any available security checks. Releases
MUST be tagged; include a short changelog highlighting user-facing changes and
any migrations. Rationale: lightweight discipline that preserves velocity.

## Governance

<!-- Example: Constitution supersedes all other practices; Amendments require documentation, approval, migration plan -->

This constitution supersedes conflicting practices. Amendments MUST be proposed
via pull request with rationale and, for breaking governance changes, a migration
or rollout plan. Compliance MUST be verified during PR review ("Constitution
Check"). Versioning of this document follows semantic versioning. Periodic
reviews SHOULD occur at major milestones or release planning.

**Version**: 1.0.0 | **Ratified**: TODO(RATIFICATION_DATE) | **Last Amended**: 2026-02-01

<!-- Example: Version: 2.1.1 | Ratified: 2025-06-13 | Last Amended: 2025-07-16 -->

# [PROJECT_NAME] Constitution

<!-- Example: Spec Constitution, TaskFlow Constitution, etc. -->

## Core Principles

### [PRINCIPLE_1_NAME]

<!-- Example: I. Library-First -->

[PRINCIPLE_1_DESCRIPTION]

<!-- Example: Every feature starts as a standalone library; Libraries must be self-contained, independently testable, documented; Clear purpose required - no organizational-only libraries -->

### [PRINCIPLE_2_NAME]

<!-- Example: II. CLI Interface -->

[PRINCIPLE_2_DESCRIPTION]

<!-- Example: Every library exposes functionality via CLI; Text in/out protocol: stdin/args → stdout, errors → stderr; Support JSON + human-readable formats -->

### [PRINCIPLE_3_NAME]

<!-- Example: III. Test-First (NON-NEGOTIABLE) -->

[PRINCIPLE_3_DESCRIPTION]

<!-- Example: TDD mandatory: Tests written → User approved → Tests fail → Then implement; Red-Green-Refactor cycle strictly enforced -->

### [PRINCIPLE_4_NAME]

<!-- Example: IV. Integration Testing -->

[PRINCIPLE_4_DESCRIPTION]

<!-- Example: Focus areas requiring integration tests: New library contract tests, Contract changes, Inter-service communication, Shared schemas -->

### [PRINCIPLE_5_NAME]

<!-- Example: V. Observability, VI. Versioning & Breaking Changes, VII. Simplicity -->

[PRINCIPLE_5_DESCRIPTION]

<!-- Example: Text I/O ensures debuggability; Structured logging required; Or: MAJOR.MINOR.BUILD format; Or: Start simple, YAGNI principles -->

## [SECTION_2_NAME]

<!-- Example: Additional Constraints, Security Requirements, Performance Standards, etc. -->

[SECTION_2_CONTENT]

<!-- Example: Technology stack requirements, compliance standards, deployment policies, etc. -->

## [SECTION_3_NAME]

<!-- Example: Development Workflow, Review Process, Quality Gates, etc. -->

[SECTION_3_CONTENT]

<!-- Example: Code review requirements, testing gates, deployment approval process, etc. -->

## Governance

<!-- Example: Constitution supersedes all other practices; Amendments require documentation, approval, migration plan -->

[GOVERNANCE_RULES]

<!-- Example: All PRs/reviews must verify compliance; Complexity must be justified; Use [GUIDANCE_FILE] for runtime development guidance -->

**Version**: [CONSTITUTION_VERSION] | **Ratified**: [RATIFICATION_DATE] | **Last Amended**: [LAST_AMENDED_DATE]

<!-- Example: Version: 2.1.1 | Ratified: 2025-06-13 | Last Amended: 2025-07-16 -->
