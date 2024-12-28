#!/usr/bin/env bash
set -euo pipefail

ATPROTO_DIR=../../atproto/lexicons
LEXICONS_DIR=../../lexicons

cp -r $ATPROTO_DIR/* $LEXICONS_DIR

LEXICONS=$(find $LEXICONS_DIR -name '*.json' -type f)
echo y | pnpm lex gen-api ./src/generated/api $LEXICONS
echo y | pnpm lex gen-server ./src/generated/server $LEXICONS
