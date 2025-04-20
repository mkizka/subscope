#!/usr/bin/env bash
set -euo pipefail

ATPROTO_SHA=$(< .atproto-sha)

pnpm giget gh:bluesky-social/atproto#$ATPROTO_SHA /tmp/dawn-atproto-$ATPROTO_SHA --force --preferOffline
pnpm giget gh:bluesky-social/atproto/lexicons#$ATPROTO_SHA lexicons --force --preferOffline
