#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

PACK="template-pack.tgz"

include=(
  "templates"
  ".claude/hooks"
  "templates/metadata/workflow-guards.json"
)

# Optional settings template
if [[ -f ".claude/settings.json" ]]; then
  mkdir -p .tmp-pack
  cp .claude/settings.json .tmp-pack/settings.json
  include+=(".tmp-pack/settings.json")
fi

tar czf "$PACK" "${include[@]}"
rm -rf .tmp-pack || true

echo "Created $PACK with:"
for i in "${include[@]}"; do echo " - $i"; done
