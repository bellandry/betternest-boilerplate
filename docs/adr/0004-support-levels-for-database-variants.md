# ADR 0004: Define Support Levels for Database Variants

- **Status:** Accepted
- **Date:** 2026-08-27
- **Decision owners:** BetterNest maintainers

## Context

BetterNest supports more than one database setup because local development, production deployment, and adapter experimentation have different needs. A database option can be useful without being ready for the same production promise as the golden path.

Without an explicit support level, users must infer maturity from implementation details and maintainers inherit an ambiguous support burden.

## Decision

Database variants use the following support contract:

| Level | Contract |
| --- | --- |
| Golden path | The recommended default for new production projects; receives end-to-end regression and deployment validation |
| Supported | A documented option with generation, runtime, migration, and packaging coverage for its stated use case |
| Experimental | An available option with incomplete guarantees; users should expect gaps and consult its limitations |
| Deprecated | An option retained only to support migration; it is not recommended for new projects |

Prisma + PostgreSQL is the production golden path. Prisma + SQLite is the fast local development path and may be supported for local or lightweight use without being the production recommendation.

The README and release notes must identify when a variant changes level. Support claims must be backed by tests or a clearly stated validation gap.

## Consequences

Users can choose quickly without assuming that all variants are equivalent. Maintainers can invest first in the golden path while preserving useful alternatives with honest expectations.

The support matrix becomes a product artifact rather than an incidental implementation list. New database variants require an explicit support-level proposal before they are presented as first-class choices.

## Revisit criteria

Revisit when adoption, deployment evidence, migration behavior, or maintenance cost materially changes for a database variant, or when the golden-path recommendation changes.
