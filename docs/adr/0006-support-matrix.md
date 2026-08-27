# ADR 0006: Publish an Explicit Support Matrix

- **Status:** Accepted
- **Date:** 2026-08-27
- **Decision owners:** BetterNest maintainers

## Context

The database matrix is useful, but each additional combination increases the number of generated outputs, CI paths, migration behaviors, and deployment assumptions that must remain correct.

A list of available choices is not enough. Users need to know which combinations are recommended, which are covered, and which are still experimental.

## Decision

Every BetterNest capability and database combination must have a published support level:

| Level | Meaning |
| --- | --- |
| Golden path | Recommended for new projects; receives the strongest documentation and regression coverage |
| Supported | Covered by contract tests and documented for its intended use |
| Experimental | Available for evaluation but may have incomplete deployment or upgrade guarantees |
| Deprecated | Kept temporarily for migration purposes and not recommended for new projects |

A combination may move to a stronger level only after it has passing generation tests, packaging coverage, build coverage, documentation, and at least one realistic runtime or deployment validation.

## Consequences

The project can preserve a broad adapter matrix without making an overly broad production promise. The support level must be visible in the README, CLI help where appropriate, and release notes when it changes.

Maintainers may remove or deprecate an option when its maintenance cost is not justified by adoption or product value, provided that the migration path is documented.

## Revisit criteria

Review the support matrix at each minor release and whenever a dependency, database adapter, deployment platform, or migration strategy changes materially.
