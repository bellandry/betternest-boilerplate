# ── Base ──────────────────────────────────────────────────────────────
# Shared base image with pnpm, turbo, and OS-level deps required by
# Prisma's native binaries (libc6-compat, openssl).
FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat openssl
RUN npm install -g turbo pnpm@10

# ── Pruner ────────────────────────────────────────────────────────────
# turbo prune keeps only the packages that the api target actually needs,
# producing a slim out/ tree for the builder stage.
FROM base AS pruner
WORKDIR /app
COPY . .
RUN turbo prune api --docker

# ── Builder ───────────────────────────────────────────────────────────
# Install dependencies with the pruned lockfile, then build the project.
# DATABASE_URL is set to a dummy value so prisma generate can parse the
# config file — the real URL is injected at runtime by the host.
FROM base AS builder
WORKDIR /app
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
RUN pnpm install --frozen-lockfile
COPY --from=pruner /app/out/full/ .
ENV DATABASE_URL=file:./placeholder.db
RUN pnpm turbo run build --filter=api
RUN pnpm --filter @repo/db exec prisma generate

# ── Runner ────────────────────────────────────────────────────────────
# Non-root user, minimal surface area. The entrypoint runs migrations
# first, then starts the compiled server.
FROM node:20-alpine AS runner
RUN addgroup --system --gid 1001 app && adduser --system --uid 1001 app
USER app
WORKDIR /app
COPY --from=builder --chown=app:app /app .

COPY --chown=app:app apps/api/docker-entrypoint.sh /app/apps/api/docker-entrypoint.sh
RUN chmod +x /app/apps/api/docker-entrypoint.sh

EXPOSE 4000
CMD ["sh", "/app/apps/api/docker-entrypoint.sh"]
