#!/usr/bin/env bash
set -euo pipefail

ATPROTO_DIR=../../atproto
LEXICONS_DIR=../../lexicons

mkdir -p $LEXICONS_DIR/app/bsky/feed
mkdir -p $LEXICONS_DIR/com/atproto

cp $ATPROTO_DIR/lexicons/app/bsky/feed/post.json $LEXICONS_DIR/app/bsky/feed/post.json
cp -r $ATPROTO_DIR/lexicons/com/atproto/repo $LEXICONS_DIR/com/atproto

LEXICONS=$(find $LEXICONS_DIR -name '*.json' -type f)
echo y | pnpm lex gen-api ./src/generated/api $LEXICONS
echo y | pnpm lex gen-server ./src/generated/server $LEXICONS
