#!/usr/bin/env bash
# Lance la suite E2E Playwright contre le stack docker compose déjà démarré.
#
# Le conteneur `frontend` est Alpine (musl) et ne peut pas exécuter les
# navigateurs Playwright ; on utilise donc l'image officielle (node + navigateurs)
# en network_mode host, pour que le XHR du navigateur vers l'API en dur
# http://localhost:8000/api atteigne nginx (port publié).
#
# Prérequis : `docker compose up -d` + base seedée (fixtures chargées).
# Usage : bash scripts/e2e.sh [args playwright]   (ex : bash scripts/e2e.sh e2e/stale-token.spec.ts)
set -euo pipefail

# La version de l'image DOIT correspondre à @playwright/test dans app/package.json.
IMAGE="mcr.microsoft.com/playwright:v1.58.2-jammy"

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

exec docker run --rm --network host \
    -v "${ROOT}/app":/work -w /work \
    -e PW_BASE_URL="${PW_BASE_URL:-http://localhost:5173}" \
    -e CI="${CI:-1}" \
    "${IMAGE}" \
    bash -c "npm ci --no-audit --no-fund && npx playwright test $*"
