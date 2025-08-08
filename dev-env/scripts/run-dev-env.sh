#!/usr/bin/env bash
set -euo pipefail

ATPROTO_SHA=$(< ../packages/client/.atproto-sha)
ATPROTO_DIR="$HOME/.cache/atproto/$ATPROTO_SHA"

echo "[dev-env] Starting atproto dev server..."
cd $ATPROTO_DIR && make run-dev-env-logged
