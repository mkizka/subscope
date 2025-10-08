FROM node:22.12.0-slim AS base
RUN npm i -g turbo@^2 corepack@latest
RUN corepack enable pnpm && pnpm config set store-dir ~/.pnpm-store

FROM base AS pruner
ARG TARGET
WORKDIR /app
COPY . .
RUN turbo prune --scope=${TARGET} --docker

FROM base AS builder
ARG TARGET
WORKDIR /app
COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=pruner /app/out/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY --from=pruner /app/out/json/ .
RUN --mount=type=cache,id=pnpm,target=~/.pnpm-store pnpm install --frozen-lockfile --ignore-scripts

COPY --from=pruner /app/out/full/ .
RUN pnpm --filter @repo/client postinstall
RUN turbo build --filter=${TARGET}
RUN pnpm prune --prod --no-optional

FROM base AS runner
ARG TARGET
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nodejs --home /home/nodejs
USER nodejs
WORKDIR /app
COPY --from=builder --chown=nodejs:nodejs /app .
RUN corepack prepare

ENV PORT=8080
ENV NODE_ENV=production
EXPOSE ${PORT}

CMD ["pnpm", "--filter", "${TARGET}", "start"]
