#!/usr/bin/env bash
set -euo pipefail

ATPROTO_SHA=$(< .atproto-sha)
ATPROTO_DIR="$HOME/.cache/atproto/$ATPROTO_SHA"
DEV_ENV_LOG="$PWD/run-dev-env.log"

pnpm kill-port 2583

cd $ATPROTO_DIR && make run-dev-env > $DEV_ENV_LOG 2>&1 &
pnpm wait-on http://localhost:2583/xrpc/_health
