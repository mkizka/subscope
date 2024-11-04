#!/usr/bin/env bash
set -euo pipefail

ATPROTO_DIR=../../atproto

cd $ATPROTO_DIR
if [ ! -d node_modules ]; then
  make deps
  make build
fi
make run-dev-env
