#!/usr/bin/env bash
set -euo pipefail

ATPROTO_COMMIT=22a96d6b7459dbfd88c289ace88ec823e9adc6ee

if [ ! -d atproto ]; then
  pnpm giget gh:bluesky-social/atproto#$ATPROTO_COMMIT atproto
fi
