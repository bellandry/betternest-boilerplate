# ADR 0003: Use a Same-Origin Proxy for Browser Authentication

- **Status:** Accepted
- **Date:** 2026-08-27
- **Decision owners:** BetterNest maintainers

## Context

Generated projects commonly split the browser application and API into separate packages. Browser authentication becomes fragile when the browser must coordinate cross-origin cookies, CORS rules, credentialed requests, and environment-specific API URLs.

The first successful project experience should work consistently in local development and in a standard deployment without requiring users to understand browser security details before they can sign in.

## Decision

The generated web application must expose browser-facing API and authentication requests through a **same-origin path**, using a development proxy and an equivalent production reverse-proxy or routing configuration. Server-to-server calls may continue to use the internal API URL.

The public documentation must distinguish the browser-facing origin from the internal service address and must explain any deployment requirement needed to preserve the same-origin contract.

## Consequences

Cookie-based authentication is easier to reason about, CORS configuration is narrower, and local and production behavior are closer. Deployments that split services across unrelated public domains require an explicit adapter or documented exception rather than silently weakening the default path.

The proxy adds routing configuration and requires health, error, and websocket behavior to be validated where applicable.

## Revisit criteria

Revisit if the generated architecture moves to a single service, adopts a different browser authentication model, or demonstrates that a multi-origin contract can provide equal reliability and onboarding simplicity.
