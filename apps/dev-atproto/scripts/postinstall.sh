#!/usr/bin/env bash
set -euo pipefail

ATPROTO_COMMIT=98711a147a8674337f605c6368f39fc10c2fae93

if [ ! -d atproto ]; then
  pnpm giget gh:bluesky-social/atproto#$ATPROTO_COMMIT atproto
fi
