#!/usr/bin/env bash
set -euo pipefail

mkdir -p ./lexicons/app/bsky/feed
mkdir -p ./lexicons/com/atproto

cp ../dev-atproto/atproto/lexicons/app/bsky/feed/post.json ./lexicons/app/bsky/feed/post.json
cp -r ../dev-atproto/atproto/lexicons/com/atproto/repo ./lexicons/com/atproto

LEXICONS=$(find ./lexicons -name '*.json' -type f)
echo y | pnpm lex gen-api ./src/generated/api $LEXICONS
echo y | pnpm lex gen-server ./src/generated/server $LEXICONS
