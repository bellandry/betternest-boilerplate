# Discovery: Organizations, Invitations, Roles, and Permissions

- **Status:** Proposed — discovery complete, implementation deferred
- **Date:** 2026-08-27
- **Related issue:** [#52](https://github.com/bellandry/betternest-boilerplate/issues/52)
- **Related decisions:** [Generated project contract](../adr/0005-generated-project-contract.md), [Golden path](../adr/0001-golden-path.md), [Support matrix](../adr/0006-support-matrix.md)

## Question

Should organizations, invitations, roles, and permissions become part of BetterNest’s core generated-project promise, or should BetterNest remain focused on single-project authentication and application foundations?

## Concrete user scenarios

| Scenario                                       | User need                                                                                                           | Minimum capability                                                                                         |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Solo founder adding a contractor               | A founder needs to grant a developer access to one product without sharing a personal account.                      | A project owner, a member record, and a revocable invitation.                                              |
| Agency operating several client projects       | An agency needs to keep client data and collaborator access separated across projects.                              | Organization or project boundaries, membership checks on every protected resource, and explicit ownership. |
| Product team with operational responsibilities | A team needs to distinguish the person who owns billing and configuration from people who can work on product data. | A small role vocabulary such as `owner`, `admin`, and `member`, with server-side authorization.            |
| Departing collaborator                         | A team needs to remove access immediately without deleting the person’s historical contributions.                   | Membership revocation, session invalidation, and an audit trail for access changes.                        |

These scenarios are materially different from “add a role column to User.” They require a resource boundary, membership lifecycle, invitation security, authorization checks, and a migration path.

## Product recommendation

**Do not make organizations or full RBAC part of the default BetterNest promise yet.** The current default remains a portable project foundation with optional authentication. The evidence required by this discovery is not available in the repository, and implementing a broad collaboration model before validating repeated demand would increase schema, onboarding, migration, and support costs for every generated project.

The smallest valuable first slice, if user research confirms the need, should be a **project-scoped team primitive** rather than a general-purpose enterprise authorization framework:

1. Add `Organization`, `Membership`, and `Invitation` records to the generated project.
2. Support only `owner` and `member` initially; add `admin` only when a concrete workflow requires delegated administration.
3. Enforce membership on the server for one explicitly documented resource family. A role field without authorization guards is not considered delivered.
4. Provide invitation creation, one-time acceptance, expiry, revocation, and immediate access removal. Invitation delivery must use the project’s existing email abstraction and must not require a BetterNest-hosted service.
5. Keep the first UI surface intentionally small: member list, invite, revoke, and leave. Advanced policy builders, arbitrary permissions, billing teams, and cross-organization switching remain out of scope.

The first slice should be introduced as an opt-in capability or feature template, not silently added to every generated project. This keeps the default schema and onboarding journey stable for solo users and preserves the portability contract.

## Security and data-ownership constraints

| Constraint             | Required behavior                                                                                                                                       | Failure to avoid                                                                                                   |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Tenant isolation       | Every organization-owned query must derive the organization and membership from authenticated server state, then apply that boundary to the data query. | Filtering only in the client or accepting an organization ID from an untrusted request without a membership check. |
| Least privilege        | Authorization must be enforced in API services and guards, with explicit role-to-action tests.                                                          | Treating authentication as authorization or relying on a mutable client-side role.                                 |
| Invitation secrecy     | Invitation tokens must be high-entropy, stored hashed where practical, single-use, short-lived, and never logged in plaintext.                          | Reusable tokens, tokens embedded in analytics, or invitation enumeration through different response messages.      |
| Membership lifecycle   | Revocation must take effect immediately, invalidate relevant sessions when required, and preserve audit history.                                        | Removing a UI link while existing sessions and direct API calls remain authorized.                                 |
| Ownership and deletion | The project must define who owns data, what happens when an owner leaves, and how data export or deletion works.                                        | A deleted user accidentally deleting the organization or orphaning all project data.                               |
| Portable operation     | The generated repository must run without a BetterNest account, hosted authorization service, or proprietary control plane.                             | Moving authorization decisions or invitation state into an external BetterNest-only service.                       |
| Migration safety       | Existing single-user projects must have a deterministic owner backfill and a reversible migration plan.                                                 | Making existing rows inaccessible or assigning ownership from an unverified email match.                           |
| Provider independence  | OAuth-only, email-password, and no-email generated projects must have an explicit invitation behavior.                                                  | Assuming an email provider exists in projects generated with `--skip-email` or `--skip-auth`.                      |

## Proposed data model boundary

The first slice should attach memberships to an explicit organization or project resource rather than placing organization identity directly on `User`. A minimal relational model is:

| Entity         | Purpose                                         | Important invariants                                                                                                 |
| -------------- | ----------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `Organization` | Names the collaboration boundary and its owner. | Stable ID, explicit owner membership, created-at timestamp.                                                          |
| `Membership`   | Connects a user to an organization.             | Unique `(organizationId, userId)`, constrained role, revocable status or deletion semantics.                         |
| `Invitation`   | Represents a pending invitation.                | Unique token digest, expiration, one-time acceptance, inviter, target organization, and accepted/revoked timestamps. |

The generated project should not introduce arbitrary permission records until the role model and resource checks have proven insufficient. A small role enum is easier to audit, migrate, document, and port across Prisma and Drizzle than an unbounded policy engine.

## Success signals and evidence gate

Implementation should be promoted only after maintainers complete a short research cycle with at least **two target users** and at least **three concrete teams or projects** represented in the evidence. The interviews should test the scenarios above rather than ask only whether “teams sound useful.”

| Signal                      |                                                    Suggested threshold before implementation | Measurement                                                    |
| --------------------------- | -------------------------------------------------------------------------------------------: | -------------------------------------------------------------- |
| Repeated collaboration need |          At least three independent teams describe a current workaround or blocked workflow. | Structured interview notes linked from the roadmap review.     |
| Boundary clarity            | Users can explain whether access is project-scoped or organization-scoped without prompting. | Five-minute concept test using the proposed model.             |
| Role sufficiency            |                Owner/member covers the first validated workflow without invented exceptions. | Scenario walkthrough with permission matrix.                   |
| Invitation usability        |              At least three users can accept, reject, or recover from an expired invitation. | Prototype or paper-flow test.                                  |
| Portability                 |       A maintainer can run the proposed flow without a BetterNest account or hosted service. | Generated-project contract review plus local integration test. |
| Operational cost            |    Migration, support, and documentation impact is understood for all supported DB variants. | ADR and support-matrix review before implementation.           |

If these signals are not met, the recommendation is to defer the feature and keep documenting guidance for application-level roles in generated projects.

## Risks and mitigations

**Overbuilding authorization** is the primary risk. It is mitigated by limiting the first slice to one resource family, two roles, and generated-project-local state. **Tenant leaks** are mitigated by requiring server-side membership checks and negative authorization tests before calling the feature supported. **Invitation abuse** is mitigated by expiring, single-use, hashed tokens, rate limits, and non-enumerating responses. **Schema lock-in** is mitigated by keeping the model relational and portable across the existing Prisma/Drizzle matrix. **Onboarding regression** is mitigated by keeping the capability opt-in and documenting the no-email and no-auth boundaries explicitly.

## Portability review

This discovery is consistent with the [generated project contract](../adr/0005-generated-project-contract.md) only if the future implementation satisfies all of the following conditions:

- Runtime authorization, migrations, invitation state, and data ownership remain visible in the generated repository.
- No organization or invitation operation depends on a BetterNest-hosted control plane.
- `.betternest.json` records feature selection only and never stores invitation tokens, credentials, or personal data.
- The feature has explicit support statements for Prisma and Drizzle, PostgreSQL, MySQL, and SQLite before it is advertised as supported.
- Generated projects without email or authentication receive either a documented alternative invitation flow or a clear statement that collaboration is unavailable.
- The default generation path does not acquire new mandatory services or environment variables without a versioned product decision.

## Decision record to create if promoted

If the evidence gate is passed, create a new ADR before implementation that fixes the scope, role vocabulary, ownership semantics, invitation lifecycle, migration strategy, and support level. The ADR should link a permission matrix, generated-project tests, and an explicit decision about whether the capability is default or opt-in.

Until that review occurs, this discovery is a recommendation and not an implementation commitment.
