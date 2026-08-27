# ADR 0005: Keep Generated Projects Standard and Portable

- **Status:** Accepted
- **Date:** 2026-08-27
- **Decision owners:** BetterNest maintainers

## Context

A generator can accelerate initial setup while creating long-term lock-in if the generated project depends on hidden runtime services, proprietary metadata, or undocumented conventions.

BetterNest is intended to remain useful after the initial command and should not prevent a team from operating its project without a BetterNest account or hosted control plane.

## Decision

Generated projects must remain ordinary, readable repositories:

- runtime behavior must be visible in the generated files;
- secrets must never be embedded in templates or manifests;
- deployment must work without a BetterNest-hosted service;
- `.betternest.json` may describe the generated choices but must not contain credentials;
- migrations, environment variables, and external services must be documented;
- future upgrades must be opt-in and reviewable.

The generator may provide convenience commands, diagnostics, and upgrade suggestions, but it must not hide required business or operational behavior behind a proprietary service.

## Consequences

This increases the amount of documentation and generated metadata required for a high-quality release. It also creates trust: users can inspect, fork, deploy, and maintain their projects independently.

Any future cloud layer must be additive. Removing the cloud service must not make an existing generated project unusable.

## Revisit criteria

Revisit only if the product strategy changes explicitly and the team can demonstrate that portability, source visibility, and data ownership remain intact.
