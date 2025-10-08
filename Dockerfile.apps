FROM node:22.12.0-slim AS base
ARG TARGET
ENV PKG=@repo/${TARGET}
RUN npm i -g turbo@^2 corepack@latest
ENV PNPM_HOME="/pnpm"
RUN corepack enable pnpm

FROM base AS pruner
WORKDIR /app
COPY . .
RUN turbo prune --scope=${PKG} --docker

FROM base AS builder
WORKDIR /app
COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=pruner /app/out/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY --from=pruner /app/out/json/ .
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile --ignore-scripts

COPY --from=pruner /app/out/full/ .
RUN pnpm --filter @repo/client postinstall
RUN turbo build --filter=${PKG}
RUN pnpm prune --prod --no-optional

FROM base AS runner
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nodejs --home /home/nodejs
USER nodejs
WORKDIR /app
COPY --from=builder --chown=nodejs:nodejs /app .
RUN corepack prepare

ENV PORT=8080
ENV NODE_ENV=production
EXPOSE ${PORT}

WORKDIR /app/apps/${TARGET}
CMD ["pnpm", "start"]
