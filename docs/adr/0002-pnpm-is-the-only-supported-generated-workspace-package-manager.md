# ADR 0002: Use pnpm as the Supported Generated-Workspace Package Manager

- **Status:** Accepted
- **Date:** 2026-08-27
- **Decision owners:** BetterNest maintainers

## Context

The generated output is a pnpm workspace and relies on workspace protocol behavior, lockfile semantics, scripts, and packaging conventions that are validated with pnpm. Presenting npm, Yarn, and Bun as equivalent package managers would create undocumented combinations and increase support cost.

The CLI itself may be executed through tools such as `npx`, `yarn dlx`, or `bunx`, but that is different from managing dependencies inside the generated workspace.

## Decision

**pnpm is the only officially supported package manager for generated workspaces.**

Generated-project documentation, examples, CI checks, and support claims use pnpm commands and a pnpm lockfile. Other package managers may be used experimentally by advanced users, but BetterNest does not promise equivalent workspace, install, packaging, or upgrade behavior for them.

## Consequences

The generated project has one clear operational contract and the test suite can validate one dependency-management path deeply. Users who prefer another package manager can still adapt the repository, but that adaptation is outside the supported contract.

CLI execution documentation must distinguish the package manager used to invoke the CLI from the package manager used by the generated project.

## Revisit criteria

Revisit if generated-project portability becomes a first-class product requirement and the alternatives can pass the same generation, install, build, packaging, and upgrade validation without weakening the pnpm path.
