#!/usr/bin/env bash
set -euo pipefail

ATPROTO_DIR=/tmp/dawn-atproto-22a96d6

cd $ATPROTO_DIR
if [ ! -d node_modules ]; then
  make deps
  make build
fi
make run-dev-env
