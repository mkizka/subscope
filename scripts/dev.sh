#!/usr/bin/env bash
set -euo pipefail

ATPROTO_DIR=/tmp/dawn-atproto-$(< .atproto-sha)
ATPROTO_LOG=$ATPROTO_DIR.log

make_atproto() {
  make -C $ATPROTO_DIR "$@"
}

cleanup() {
  echo "[dev.sh] Cleaning up..."
  docker compose down -v
  pnpm kill-port 2583
}

main() {
  if [ -d "$ATPROTO_DIR/node_modules" ]; then
    echo "[dev.sh] Skipping atproto build, already exists."
  else
    echo "[dev.sh] Building atproto..."
    make_atproto deps
    make_atproto build
  fi

  echo "[dev.sh] Starting atproto dev server..."
  rm -f $ATPROTO_LOG
  make_atproto run-dev-env > $ATPROTO_LOG 2>&1 &
  pnpm wait-on http://localhost:2583/xrpc/_health

  echo "[dev.sh] Starting docker containers..."
  docker compose up -d
  # 5432=Postgres, 6379=Redis, 6008=Jetstream
  pnpm wait-on tcp:5432 tcp:6379 tcp:6008

  echo "[dev.sh] Migrating database..."
  pnpm -s db:migrate

  echo "[dev.sh] Ready to start development environment."
  pnpm turbo run dev --ui tui
}

trap cleanup EXIT
main
