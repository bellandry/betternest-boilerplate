# Generated Project Definition of Done

A BetterNest generation path is complete only when it produces a project that a new user can understand, run, validate, and continue maintaining. A successful file copy alone is not sufficient.

## Required contract

| Area               | Required outcome                                                                                         | Evidence                                                        |
| ------------------ | -------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| Generation         | The selected framework, database, and auth providers produce a coherent project without manual repair    | Generator contract test and generated reference diff            |
| Package management | The generated workspace installs with pnpm and preserves its workspace metadata                          | Isolated install using the packaged CLI                         |
| Configuration      | Example environment files identify required values, safe defaults, and the file that consumes each value | README review and startup validation                            |
| Database           | The selected database can be generated, initialized locally, and migrated using the documented commands  | Database matrix test plus local migration check                 |
| Runtime            | The web app starts, the API starts, and the same-origin browser path reaches the API                     | Smoke test and health endpoint verification                     |
| Authentication     | The selected auth providers have working routes, documented credentials, and correct callback origins    | Auth generation assertions and manual golden-path check         |
| Packaging          | The published CLI tarball contains every required template and reproduces the reference output           | `pnpm test:pack`                                                |
| Deployment         | The golden path has a documented deployment journey, required environment variables, and health checks   | Deployment guide review and platform validation where available |
| Documentation      | A first-time user can follow one ordered path from generation to a working project                       | Onboarding test with representative users                       |
| Safety             | No secrets are generated or committed, and production-sensitive defaults are explicit                    | Secret scan, template review, and security checklist            |

## Pull request checklist

Before merging a change to a generation path, maintainers should verify that the affected rows remain true. If a row cannot be validated, the pull request must state the gap and link a follow-up issue rather than silently expanding the support promise.

The minimum repository checks are:

```bash
pnpm lint
pnpm test:unit
pnpm test:pack
pnpm smoke-test
```

For changes to templates or manifests, regenerate `examples/mvp/` and review the resulting diff. For changes to Docker, deployment configuration, or migration behavior, run the relevant checks in an environment that provides the required infrastructure and record any unavailable validation explicitly.

## Support-level rule

The definition of done is evidence for a support claim. A path may remain **Experimental** when it is useful but lacks one or more required guarantees. It may be called **Golden path** only when it receives the strongest end-to-end documentation and regression coverage.

See the [product roadmap](./product-roadmap.md) and the [architecture decisions](./adr/README.md) for the prioritization and support policy.
