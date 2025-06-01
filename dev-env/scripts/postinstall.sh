#!/usr/bin/env bash
set -euo pipefail

ATPROTO_SHA=$(< .atproto-sha)

pnpm giget gh:bluesky-social/atproto/lexicons#$ATPROTO_SHA ../lexicons --force --preferOffline
