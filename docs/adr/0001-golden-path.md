# ADR 0001: Define a Golden Path

- **Status:** Accepted
- **Date:** 2026-08-27
- **Decision owners:** BetterNest maintainers

## Context

BetterNest supports six ORM/database combinations. Treating every combination as equally mature makes the product promise difficult to understand and multiplies documentation, testing, migration, and support costs.

Users need one path that is optimized for the first successful product launch, while advanced users still need access to supported alternatives.

## Decision

BetterNest will maintain an explicit golden path:

- **Prisma + PostgreSQL** is the reference production path.
- **Prisma + SQLite** is the fastest zero-infrastructure local path.
- Other combinations remain available when they pass the documented contract tests and are clearly labeled with their support level.

The golden path receives the most complete documentation, deployment recipes, examples, and regression coverage.

## Consequences

This decision does not remove flexibility. It makes the default experience opinionated and gives every alternative a clear support expectation.

New adapters and infrastructure modules must explain whether they belong to the golden path, the supported matrix, or an experimental area. A new option should not be added solely to increase the number of choices.

## Revisit criteria

Revisit this decision when usage data shows that another combination has materially higher adoption, lower support cost, or stronger deployment reliability than the current reference path.
