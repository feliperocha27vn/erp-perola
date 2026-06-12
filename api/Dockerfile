# ============================================================
# Stage 1: Build frontend
# ============================================================
FROM node:22-bookworm AS web-builder

RUN corepack enable && corepack prepare pnpm@10.17.1 --activate

WORKDIR /app/web

COPY web/package.json web/pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY web/ ./
ARG VITE_API_URL=http://localhost:3333
ENV VITE_API_URL=$VITE_API_URL
ENV NODE_OPTIONS=--max-old-space-size=768
RUN pnpm build

# ============================================================
# Stage 2: Build backend
# ============================================================
FROM node:22-bookworm AS api-builder

RUN corepack enable && corepack prepare pnpm@10.17.1 --activate

WORKDIR /app

COPY api/package.json api/pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY api/ ./
RUN pnpm build

# ============================================================
# Stage 3: Production
# ============================================================
FROM node:22-bookworm-slim AS production

RUN corepack enable && corepack prepare pnpm@10.17.1 --activate

# Install curl for healthcheck
RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY api/package.json api/pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod

COPY --from=api-builder /app/dist ./dist
COPY --from=api-builder /app/drizzle ./drizzle
COPY --from=web-builder /app/web/dist ./web

COPY api/entrypoint.sh ./
RUN chmod +x entrypoint.sh

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s \
  CMD curl -f http://localhost:3333/health || exit 1

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3333

ENTRYPOINT ["./entrypoint.sh"]