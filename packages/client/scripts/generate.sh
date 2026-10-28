#!/usr/bin/env bash
set -euo pipefail

pnpm ts-lex install --ci

LEX_CLI_LEXICONS_DIR=./node_modules/.cache/lex-cli-lexicons
rm -rf $LEX_CLI_LEXICONS_DIR && mkdir -p $(dirname $LEX_CLI_LEXICONS_DIR)
cp -rL ./lexicons $LEX_CLI_LEXICONS_DIR
LEXICONS=$(find $LEX_CLI_LEXICONS_DIR -name '*.json' -type f)
node -e 'const fs = require("node:fs"); for (const f of process.argv.slice(1)) { const { $type, ...doc } = JSON.parse(fs.readFileSync(f, "utf8")); fs.writeFileSync(f, JSON.stringify(doc)); }' $LEXICONS
echo 'Starting client code generation...'
LEX_CLI=./node_modules/@atproto/lex-cli/bin.js
yes | node $LEX_CLI gen-api ./src/generated/api $LEXICONS &
yes | node $LEX_CLI gen-server ./src/generated/server $LEXICONS &
pnpm ts-lex build --out ./src/generated/lex --clear &
wait
