#!/usr/bin/env bash
set -euo pipefail

ATPROTO_DIR=/tmp/dawn-atproto-$(< .atproto-sha)
ATPROTO_LOG=$ATPROTO_DIR.log

atproto() {
  cd $ATPROTO_DIR
  if [ ! -d node_modules ]; then
    make deps
    make build
  fi
  make run-dev-env
}

cleanup() {
  echo "[dev.sh] Cleaning up..."
  docker compose down -v
  pnpm kill-port 2583
}

main() {
  echo "[dev.sh] Starting atproto dev server..."
  rm -f $ATPROTO_LOG
  atproto > $ATPROTO_LOG 2>&1 &
  pnpm wait-on http://localhost:2583/xrpc/_health

  echo "[dev.sh] Starting docker containers..."
  docker compose up -d > /dev/null 2>&1
  # 5432=Postgres, 6379=Redis, 6008=Jetstream
  pnpm wait-on tcp:5432 tcp:6379 tcp:6008

  echo "[dev.sh] Migrating database..."
  pnpm db:migrate > /dev/null 2>&1

  echo "[dev.sh] Ready to start development environment."
  pnpm turbo run dev --ui tui
}

trap cleanup EXIT
main
