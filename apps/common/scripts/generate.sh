#!/usr/bin/env bash
set -euo pipefail

mkdir -p ./src/app/bsky/feed
mkdir -p ./src/com/atproto

cp ../dev-env/atproto/lexicons/app/bsky/feed/post.json ./lexicons/app/bsky/feed/post.json
cp -r ../dev-env/atproto/lexicons/com/atproto/repo ./lexicons/com/atproto

LEXICONS=$(find ./lexicons -name '*.json' -type f)
echo y | pnpm lex gen-api ./src/generated/api $LEXICONS
echo y | pnpm lex gen-server ./src/generated/server $LEXICONS
