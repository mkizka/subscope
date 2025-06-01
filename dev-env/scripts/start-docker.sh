#!/usr/bin/env bash
set -euo pipefail

docker compose down -v --remove-orphans
docker compose up -d
# 5432=Postgres, 6379=Redis, 6008=Jetstream
pnpm wait-on tcp:5432 tcp:6379 tcp:6008
