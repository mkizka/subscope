#!/usr/bin/env bash
set -euo pipefail

cleanup() {
  echo "[dev.sh] Cleaning up..."
  docker compose down
}

main() {
  # 1. docker composeを起動
  echo "[dev.sh] Starting docker containers..."
  docker compose up -d
  # 5432=Postgres, 6379=Redis, 2480=Tap
  pnpm wait-on tcp:5432 tcp:6379 tcp:2480

  # 2. dockerコンテナのPostgresにマイグレーション
  echo "[dev.sh] Migrating database..."
  pnpm -s db:migrate

  # 3. 開発環境を起動
  echo "[dev.sh] Ready to start development environment."
  pnpm turbo run dev --ui tui
}

trap cleanup EXIT
main
