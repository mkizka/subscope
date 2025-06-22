#!/usr/bin/env bash
set -euo pipefail

ATPROTO_SHA=$(< ../packages/client/.atproto-sha)
ATPROTO_DIR="$HOME/.cache/atproto/$ATPROTO_SHA"

if [ -d "$ATPROTO_DIR" ]; then
  echo "[dev-env] Skipping atproto download, already exists."
else
  echo "[dev-env] Downloading atproto..."
  pnpm giget gh:bluesky-social/atproto#$ATPROTO_SHA $ATPROTO_DIR --force --preferOffline
fi
cd $ATPROTO_DIR

if [ -d "$ATPROTO_DIR/packages/dev-env/dist" ]; then
  echo "[dev-env] Skipping atproto build, already exists."
else
  echo "[dev-env] Building atproto..."
  make deps
  make build
fi
