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
RUN pnpm deploy --prod --ignore-scripts --filter=@repo/db /out/db \
  && mkdir /out/app && cp -r apps/${BUILD_TARGET}/package.json apps/${BUILD_TARGET}/dist /out/app \
  && if [ "${BUILD_TARGET}" = web ]; then \
    mkdir -p /out/app/node_modules/@bull-board \
    && cp -rL apps/web/node_modules/@bull-board/ui /out/app/node_modules/@bull-board/; \
  fi

FROM node:24.22.1-slim AS runner
USER node
COPY --from=builder --chown=node:node /out/db /db
COPY --from=builder --chown=node:node /out/app /app
WORKDIR /app

ENV PORT=8080
ENV NODE_ENV=production
EXPOSE ${PORT}

CMD ["node", "."]
