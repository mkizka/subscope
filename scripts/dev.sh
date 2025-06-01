#!/usr/bin/env bash
set -euo pipefail

cleanup() {
  echo "[dev.sh] Cleaning up..."
  docker compose down -v
  pnpm kill-port 2583
}

main() {
  # 1. atprotoリポジトリをダウンロードしてビルド
  pnpm --filter @dawn/dev-env setup-dev-env

  # 2. atprotoリポジトリでmake run-dev-envを実行
  DEV_ENV_LOG=dev-env/run-dev-env.log
  rm -f $DEV_ENV_LOG
  pnpm --filter @dawn/dev-env run-dev-env > $DEV_ENV_LOG 2>&1 &
  pnpm wait-on http://localhost:2583/xrpc/_health

  # 3. このリポジトリのdocker composeを起動
  echo "[dev.sh] Starting docker containers..."
  docker compose up -d
  # 5432=Postgres, 6379=Redis, 6008=Jetstream
  pnpm wait-on tcp:5432 tcp:6379 tcp:6008

  # 4. dockerコンテナのPostgresにマイグレーション
  echo "[dev.sh] Migrating database..."
  pnpm -s db:migrate

  # 5. このリポジトリの開発環境を起動
  echo "[dev.sh] Ready to start development environment."
  pnpm turbo run dev --ui tui
}

trap cleanup EXIT
main
