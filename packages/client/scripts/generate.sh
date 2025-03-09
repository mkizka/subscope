#!/usr/bin/env bash
set -euo pipefail

LEXICONS=$(find ../../lexicons -name '*.json' -type f)
echo 'Starting client code generation...'
yes | pnpm lex gen-api ./src/generated/api $LEXICONS &
yes | pnpm lex gen-server ./src/generated/server $LEXICONS &
wait
