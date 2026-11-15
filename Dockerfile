FROM node:24.22.1-slim AS base
ARG BUILD_TARGET
ENV BUILD_TARGET=${BUILD_TARGET}
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
RUN turbo build --filter=${BUILD_PACKAGE}
# pnpm pruneはmonorepoでは完全には動作しないためinstall --prodを使用する
# https://pnpm.io/ja/next/cli/prune
RUN find . -name node_modules -prune -exec rm -rf {} + \
  && pnpm install --prod --ignore-scripts --config.confirmModulesPurge=false --config.node-linker=hoisted

FROM base AS runner
WORKDIR /app
USER node
COPY --from=builder --chown=node:node /app .
RUN corepack prepare

ENV PORT=8080
ENV NODE_ENV=production
ENV pnpm_config_node_linker=hoisted
EXPOSE ${PORT}

CMD ["sh", "-c", "cd apps/${BUILD_TARGET} && exec node ."]
