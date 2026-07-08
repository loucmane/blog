#!/usr/bin/env bash
# Aegis dispatcher hook. Keep this bootstrap stable; runtime fixes live behind .aegis/bin/aegis.

set -u

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-}"
if [ -z "$PROJECT_DIR" ]; then
  PROJECT_DIR="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
fi
AEGIS_BIN="$PROJECT_DIR/.aegis/bin/aegis"
if [ -x "$AEGIS_BIN" ]; then
  exec "$AEGIS_BIN" hook sessionstart "$@"
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [ "sessionstart" = "readiness" ]; then
  echo "Aegis runtime dispatcher fallback cannot execute readiness without .aegis/bin/aegis." >&2
  exit 1
fi
exec python3 "$SCRIPT_DIR/gate_lib.py" "sessionstart"
