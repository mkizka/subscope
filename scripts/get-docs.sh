#!/usr/bin/env bash
set -euo pipefail

ATPROTO_SHA=$(< dev-env/.atproto-sha)

pnpm repomix --remote https://github.com/bluesky-social/atproto --output docs/repomix/atproto-repomix-output.xml --remote-branch $ATPROTO_SHA
pnpm repomix --remote https://github.com/factory-js/factory-js --output docs/repomix/factoryjs-repomix-output.xml
