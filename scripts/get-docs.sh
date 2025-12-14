#!/usr/bin/env bash
set -euo pipefail

ATPROTO_SHA=$(< packages/client/.atproto-sha)

pnpm repomix --remote https://github.com/bluesky-social/atproto --output docs/repomix/atproto-repomix-output.xml
pnpm repomix --remote https://github.com/bluesky-social/indigo --output docs/repomix/indigo-repomix-output.xml
pnpm repomix --remote https://github.com/factory-js/factory-js --output docs/repomix/factoryjs-repomix-output.xml
pnpm repomix --remote https://github.com/skyware-js/jetstream --output docs/repomix/jetstream-repomix-output.xml
