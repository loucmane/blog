#!/bin/bash
# Convenience wrapper for SESSION.md migration
# Run from blog root: ./migrate.sh

echo "SESSION.md Migration Tool"
echo "========================="
echo ""

# Check if rich is installed
if ! python3 -c "import rich" 2>/dev/null; then
    echo "Installing required dependencies..."
    pip install -r scripts/migration/requirements.txt
fi

# Run the migration script from its location
python3 scripts/migration/migrate_sessions.py "$@"