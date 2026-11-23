# Keep the Node patch in sync with config/runtime.json.
FROM node:24.18.0-bookworm-slim AS base
WORKDIR /app

FROM base AS dependencies
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/web/package.json packages/web/package.json

FROM dependencies AS build
# Check the actual filtered context without copying it into an image layer.
RUN --mount=type=bind,target=/context \
    set -eu; \
    unexpected="$(find /context -mindepth 1 \( -type l -o \
      -name '.env*' -o -name '*.env' -o -name '*.env.*' -o \
      -name '.npmrc' -o -name '.yarnrc*' -o -name '.git' -o \
      -name '.beads' -o -name '.gc' -o -name '.gascity' -o -name '.aegis' -o \
      -name '.codex' -o -name '.aws' -o -name '.ssh' -o -name 'credentials*' -o \
      -name '*.key' -o -name '*.pem' -o -name '*.p12' -o -name '*.pfx' -o \
      -name '*.local' -o -name '.next' -o -name 'node_modules' -o \
      -name 'ci-artifacts' -o -name 'coverage' -o -name 'worktrees' \) -print -quit)"; \
    if [ -n "$unexpected" ]; then echo 'Forbidden file in the Docker build context.' >&2; exit 1; fi
RUN corepack pnpm install --frozen-lockfile
COPY packages/web/next.config.ts packages/web/postcss.config.mjs packages/web/tsconfig.json packages/web/
COPY packages/web/src packages/web/src
COPY packages/web/public packages/web/public
ENV NEXT_TELEMETRY_DISABLED=1
RUN corepack pnpm --filter web build
RUN rm -rf packages/web/.next/cache

ARG REVISION
RUN set -eu; \
    case "$REVISION" in ''|*[!0-9a-f]*) exit 1;; esac; \
    test "${#REVISION}" -eq 40; \
    printf '%s\n' "$REVISION" > packages/web/public/build-revision.txt

FROM dependencies AS production-dependencies
RUN corepack pnpm install --prod --frozen-lockfile

FROM base AS runtime
ARG REVISION
LABEL org.opencontainers.image.revision=$REVISION
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1
COPY --from=production-dependencies /app/node_modules ./node_modules
COPY --from=production-dependencies /app/packages/web/node_modules ./packages/web/node_modules
COPY packages/web/package.json packages/web/next.config.ts ./packages/web/
COPY --from=build /app/packages/web/.next ./packages/web/.next
COPY --from=build /app/packages/web/public ./packages/web/public
COPY packages/web/migrations ./packages/web/migrations
COPY packages/web/scripts/migrate.mjs ./packages/web/scripts/migrate.mjs
COPY packages/web/src/server/database/migrations.ts ./packages/web/src/server/database/migrations.ts

WORKDIR /app/packages/web
# The launcher mounts /tmp as tmpfs under a read-only root filesystem.
RUN ln -s /tmp .next/cache
USER node
EXPOSE 3000
HEALTHCHECK --interval=5s --timeout=4s --start-period=15s --retries=3 \
  CMD ["node", "-e", "fetch('http://127.0.0.1:3000/api/health',{signal:AbortSignal.timeout(3000)}).then(r=>process.exit(r.ok?0:1),()=>process.exit(1))"]
CMD ["node", "node_modules/next/dist/bin/next", "start", "--hostname", "0.0.0.0", "--port", "3000"]
