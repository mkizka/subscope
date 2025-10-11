FROM node:22.20.0-slim AS base
ARG BUILD_TARGET
ENV BUILD_PACKAGE=@repo/${BUILD_TARGET}
RUN npm i -g turbo@^2 corepack@latest
ENV PNPM_HOME="/pnpm"
RUN corepack enable pnpm

FROM base AS pruner
WORKDIR /app
COPY . .
RUN turbo prune --scope=${BUILD_PACKAGE} --docker

FROM base AS builder
WORKDIR /app
COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=pruner /app/out/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY --from=pruner /app/out/json/ .
RUN pnpm install --frozen-lockfile --ignore-scripts

COPY --from=pruner /app/out/full/ .
RUN pnpm --filter @repo/client postinstall
RUN turbo build --filter=${BUILD_PACKAGE}
# pnpm pruneはmonorepoでは完全には動作しないためinstall --prodを使用する
# https://pnpm.io/ja/next/cli/prune
RUN rm -rf **/node_modules \
  && pnpm install --prod --ignore-scripts --config.confirmModulesPurge=false

FROM base AS runner
WORKDIR /app
USER node
COPY --from=builder --chown=node:node /app .
RUN corepack prepare

ENV PORT=8080
ENV NODE_ENV=production
EXPOSE ${PORT}

CMD ["sh", "-c", "pnpm --filter ${BUILD_PACKAGE} start"]
