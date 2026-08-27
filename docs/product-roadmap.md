# BetterNest Product Roadmap

## Product direction

BetterNest is an open-source launchpad for TypeScript web products. Its purpose is not to expose the largest possible number of framework combinations, but to help teams generate, understand, deploy, and evolve a reliable application foundation.

> BetterNest should make a generated project the safest and most understandable way for a small team to start a serious web product.

## Prioritization model

Issues should be written as observable outcomes rather than implementation activities. Each issue must state the problem, the expected outcome, its scope, acceptance criteria, dependencies, and validation method.

| Priority | Meaning                                                                      |
| -------- | ---------------------------------------------------------------------------- |
| P0       | Required to make the current product promise credible                        |
| P1       | Important product capability after the foundation is reliable                |
| P2       | Strategic or exploratory work that should not distract from the current path |

The repository uses GitHub labels for `priority:*`, `status:*`, and `area:*`. Milestones represent the three roadmap horizons.

## NOW — Golden Path and Developer Onboarding

The current objective is to prove that a new user can generate, configure, run, and understand a project without friction.

Success means that a first-time user can follow the documentation from `create-betternest-app` to a working local application and a reachable health endpoint. The primary golden path should remain deliberately opinionated, with Prisma + PostgreSQL as the reference production path and Prisma + SQLite as the fastest local path.

Current P0 themes:

- reduce the time to first local run;
- reduce the time to first deployment;
- publish a clear support matrix;
- make generated projects self-explanatory;
- keep the packaged CLI and reference output deterministic;
- document the limits of each database and hosting option.

## NEXT — Product Primitives

Once the golden path is reliable, BetterNest can add capabilities that recur across many products. Each capability must have a clear data model, migration strategy, security model, generated documentation, and compatibility statement.

Candidate P1 themes:

- organizations, invitations, roles, and permissions;
- transactional notifications and email workflows;
- file storage with provider-independent interfaces;
- portable observability and audit events;
- background jobs with retry and idempotency guarantees;
- billing primitives with webhook safety.

The first discovery deliverable for this horizon is [Organizations, Invitations, Roles, and Permissions](./product-discovery/0001-organizations-invitations-and-rbac.md). It recommends deferring implementation until repeated demand, a portable design, and the required security evidence are confirmed.

## LATER — Project Evolution and Ecosystem

The long-term opportunity is to help projects after their initial generation. This includes diagnostics, compatibility checks, upgrade previews, migration guidance, private presets, and a maintained module registry.

These are P2 until the generated project experience is proven. BetterNest should not introduce a hosted control plane or a marketplace before it has a clear compatibility contract and a meaningful active user base.

## Product success metrics

The most useful metrics measure user success, not feature count:

| Metric                    | Product question                                               |
| ------------------------- | -------------------------------------------------------------- |
| Generation success rate   | Does the CLI produce a usable project without repair work?     |
| Time to first local run   | How quickly does a new user see the application?               |
| Time to first deployment  | How quickly does a project reach a public URL?                 |
| Authentication activation | Does the user create and use the first account?                |
| Day-7 retention           | Is the generated project still being developed after one week? |
| Upgrade success rate      | Can existing projects evolve without regressions?              |
| Generated-project defects | How many issues appear after generation?                       |
| Support burden            | Which onboarding steps create confusion?                       |

## Working agreement

The roadmap is intentionally short. Ideas that are not ready for implementation belong in discovery notes or in the `LATER` milestone, not in the active queue.

A roadmap review should happen every two weeks. Select three to five issues for the current cycle, keep dependencies visible, and close an issue only when code, generated output, documentation, and relevant tests are complete.

Architecture decisions belong in `docs/adr/`. Product work belongs in GitHub Issues. The README explains how to use the product; this roadmap explains why the next work matters.
