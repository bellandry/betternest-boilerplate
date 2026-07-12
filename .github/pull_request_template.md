<!--
  Thanks for contributing! Please fill in the sections below and complete the
  checklist. See CONTRIBUTING.md for the full workflow.
-->

## Summary

<!-- What does this PR do, and why? One or two sentences. -->

## Type of change

- [ ] Bug fix (patch)
- [ ] New capability — e.g. new auth provider or database (minor)
- [ ] Breaking change to generated projects or CLI flags (major)
- [ ] Docs / chore (no release)

## Related issues

<!-- e.g. "Closes #123" -->

## Checklist

- [ ] I added a changeset if this affects `packages/cli` or `packages/generator`
      (`pnpm changeset`), with the correct semver bump and a user-facing description.
- [ ] I regenerated the reference output (`pnpm generate:default`) and committed
      the updated `examples/mvp/` if any template changed.
- [ ] Tests pass locally: `pnpm smoke-test` and, for anything touching packaging
      or before a release, `pnpm test:pack`.
- [ ] I updated the README / docs (root, `packages/cli/README.md`, or
      `CONTRIBUTING.md`) if behavior, flags, or setup steps changed.
- [ ] My changes follow the existing conventions (no stray comments, consistent style).

## Notes for reviewers

<!-- Anything reviewers should pay special attention to, or manual steps to verify. -->
