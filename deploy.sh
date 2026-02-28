#!/usr/bin/env bash
# ============================================
# deploy.sh -- push site files to Neocities
# usage:  ./deploy.sh
# ============================================
set -euo pipefail

SITE="hidingfromtomorrow"
API="https://neocities.org/api/upload"

# ------ Auth ------
# Load .env if it exists
if [[ -f ".env" ]]; then
  source .env
fi

# Set your API key in .env or as an env var, or it'll prompt you.
# You can find it at: https://neocities.org/settings/hidingfromtomorrow#api_key
if [[ -z "${NEOCITIES_API_KEY:-}" ]]; then
  read -rsp "Neocities API key (hidden): " NEOCITIES_API_KEY
  echo
fi

# ------ Collect files ------
# Everything in the current directory except stuff we don't want to upload
EXCLUDE=(
  "deploy.sh"
  "README.md"
  ".env"
  "guestbook-api"
  "guestbook-worker"
  "node_modules"
  ".git"
  ".gitignore"
)

should_skip() {
  local f="$1"
  for ex in "${EXCLUDE[@]}"; do
    if [[ "$f" == "$ex"* ]]; then
      return 0
    fi
  done
  return 1
}

# Build the curl args
CURL_ARGS=()
COUNT=0

while IFS= read -r -d '' file; do
  # Strip leading ./
  rel="${file#./}"

  if should_skip "$rel"; then
    continue
  fi

  CURL_ARGS+=(-F "${rel}=@${file}")
  COUNT=$((COUNT + 1))
done < <(find . -type f -print0 | sort -z)

echo "uploading ${COUNT} files to ${SITE}.neocities.org ..."

curl -s \
  -H "Authorization: Bearer ${NEOCITIES_API_KEY}" \
  "${CURL_ARGS[@]}" \
  "$API" | python3 -m json.tool

echo ""
echo "done. visit https://${SITE}.neocities.org"
