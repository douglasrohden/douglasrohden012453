#!/usr/bin/env bash
set -euo pipefail

# Deploy script for Linux/Mac
# - Builds the Frontend (Vite)
# - Copies built assets to /dist at repo root
# - Builds and starts containers using docker-compose.prod.yml

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "[1/4] Building Frontend..."
(
  cd Frontend
  npm install
  npm run build:no-check
)

echo "[2/4] Copying build assets to dist/..."
rm -rf dist
cp -r Frontend/dist ./dist

echo "[3/4] Starting Docker containers..."
COMPOSE_FILES="-f docker-compose.yml -f docker-compose.prod.yml"

if [ "${RESET_DB:-}" = "1" ]; then
  echo "RESET_DB=1 set. Removing containers and volumes..."
  if docker compose version >/dev/null 2>&1; then
    docker compose $COMPOSE_FILES down -v --remove-orphans
  else
    docker-compose $COMPOSE_FILES down -v --remove-orphans
  fi
fi

if docker compose version >/dev/null 2>&1; then
  docker compose $COMPOSE_FILES up -d --build
else
  docker-compose $COMPOSE_FILES up -d --build
fi

echo "[4/4] Services status:"
if docker compose version >/dev/null 2>&1; then
  docker compose $COMPOSE_FILES ps
else
  docker-compose $COMPOSE_FILES ps
fi

echo
echo "Deploy completed."
