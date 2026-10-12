# syntax=docker/dockerfile:1

# ---- base: shared runtime ---------------------------------------------------
FROM node:22-bookworm-slim AS base
WORKDIR /app
# Prisma's migration engine needs OpenSSL, which the slim image leaves out.
RUN apt-get update && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/* \
    && chown node:node /app
ENV NEXT_TELEMETRY_DISABLED=1

# ---- deps: all dependencies, installed from the lockfile --------------------
# Build steps run as the unprivileged `node` user.
FROM base AS deps
USER node
COPY --chown=node:node package.json package-lock.json prisma.config.ts ./
COPY --chown=node:node prisma ./prisma
RUN npm ci && sha256sum package-lock.json | cut -d' ' -f1 > node_modules/.lock-hash

# ---- dev: hot-reload server; also runs migrations, seeds and unit tests ----
FROM deps AS dev
COPY --chown=node:node . .
# .next exists in the image so its named volume is created owned by `node`.
RUN npx prisma generate && mkdir -p .next
COPY docker/dev-entrypoint.sh /usr/local/bin/dev-entrypoint
# Starts as root only to pick the uid that owns the mounted working tree; the
# entrypoint then drops to that uid before running anything.
USER root
ENTRYPOINT ["dev-entrypoint"]
EXPOSE 3000
CMD ["npm", "run", "dev"]

# ---- build: production bundle -----------------------------------------------
FROM deps AS build
# NEXT_PUBLIC_* variables are inlined into the client bundle here, so they are
# build arguments rather than runtime environment.
ARG NEXT_PUBLIC_APP_NAME="Ticketing System"
ENV NEXT_PUBLIC_APP_NAME=$NEXT_PUBLIC_APP_NAME
COPY --chown=node:node . .
RUN npx prisma generate && npm run build

# ---- runner: minimal production image ---------------------------------------
FROM base AS runner
ENV NODE_ENV=production \
    HOSTNAME=0.0.0.0 \
    PORT=3000
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
COPY --from=build --chown=node:node /app/public ./public
USER node
EXPOSE 3000
CMD ["node", "server.js"]

# ---- e2e: Playwright with browsers, runs against the stack ------------------
# The tag must match the @playwright/test version in package.json.
FROM mcr.microsoft.com/playwright:v1.64.0-noble AS e2e
WORKDIR /e2e
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts
COPY playwright.config.ts tsconfig.json ./
COPY e2e ./e2e
CMD ["npx", "playwright", "test"]
