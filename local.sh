#!/bin/bash

# shellcheck disable=SC2164

# Run full local development stack

AEM_PAGES_URL=${AEM_PAGES_URL:-https://main--assetsDashboard--aemsites.aem.page}
DM_ORIGIN=${DM_ORIGIN:-https://delivery-p64403-e544653.adobeaemcloud.com}

# https://www.aem.live/developer/cli-reference#general-options
AEM_LOG_LEVEL=${AEM_LOG_LEVEL:-info}

export FORCE_COLOR=1
set -e
set -o pipefail

# ANSI colors
RED=$'\033[31m'
BG_YELLOW=$'\033[43m'
BG_BLUE=$'\033[44m'
BG_MAGENTA=$'\033[45m'
# ANSI Reset
NC=$'\033[0m'

function prefix() {
  sed "s/^/${1}${2}$NC /"
}

function filter_cf_logs() {
  if [ "$CLOUDFLARE_REQUEST_LOGS" != "1" ]; then
    grep --line-buffered -v -E "^.*\[wrangler:info\].*(GET|HEAD|POST|OPTIONS|PUT|DELETE|TRACE|CONNECT)"
  else
    cat
  fi
}

function run_cloudflare() {
  cd cloudflare

  # add "--live-reload" if auto-reload on cloudflare changes is needed
  npm run dev -- \
    --var "HELIX_ORIGIN:http://localhost:3000" \
    --var "DM_ORIGIN:${DM_ORIGIN}" \
    2>&1 | filter_cf_logs
}

function run_aem() {
  # add "--log-level silly" if full aem logs are needed
  npx aem up --no-open --livereload --log-level "${AEM_LOG_LEVEL}"
}

function run_react_build() {
  cd assetsDashboard-react

  echo "[Vite Build] Watching for React code changes in assetsDashboard-react/* ..."
  npm run auto-build
}

if nc -z "localhost" "8787" > /dev/null 2>&1; then
  echo "${RED}Error: http://localhost:8787 is already in use${NC}"
  echo
  echo "Might be 'npm run dev' running already or some other process is listening on that port."
  echo "Please stop the other process and try again."
  exit 1
fi

# cloudflare worker: http://localhost:8787
(run_cloudflare 2>&1 | prefix $BG_YELLOW "[cfl]" ) &

while ! nc -z "localhost" "8787" > /dev/null 2>&1; do
  sleep 1
done
echo

# aem: http://localhost:3000
(run_aem 2>&1 | prefix $BG_MAGENTA "[aem]") &

sleep 1
echo

# vite react build (on file change)
(run_react_build 2>&1 | prefix $BG_BLUE "[vte]") &

sleep 1
echo

open -a "${DEV_BROWSER:-Google Chrome}" http://localhost:8787

sleep 1

echo
echo "-------------------------------------------------------------------------------------"
echo
echo "Started the following stack:"
echo
echo  "${BG_YELLOW}[cfl]$NC  http://localhost:8787    Cloudflare Worker"
echo "               |"
echo "               +-----> Local worker code in cloudflare/*"
echo "               |"
echo "               +-----> /api: Dynamic Media API (env var: DM_ORIGIN)"
echo "               |             ${DM_ORIGIN}"
echo "               |"
echo "               | EDS origin"
echo "               ↓"
echo "${BG_MAGENTA}[aem]$NC  http://localhost:3000    AEM Helix"
echo "               |"
echo "               +-----> Local EDS code in *"
echo "               |"
echo "               +-----> EDS Content (env var: AEM_PAGES_URL)"
echo "               |       ${AEM_PAGES_URL}"
echo "               |"
echo "               | React build in /tools/assets-browser/index.(js|css)"
echo "               ↓"
echo    "${BG_BLUE}[vte]$NC  Vite auto-rebuild on file changes inside assetsDashboard-react/*"
echo
echo "Running at http://localhost:8787"
echo
echo "-------------------------------------------------------------------------------------"
echo

wait
