#!/bin/bash
# Template Migration Rollback Script
# Created: 2025-08-02
# Backup: templates.backup-20250802-125926

echo "⏮️ Starting template migration rollback..."

# Remove new structure if exists
if [ -d ".claude/templates/handlers" ]; then
    echo "🗑️ Removing new handler structure..."
    rm -rf .claude/templates/handlers
fi

if [ -d ".claude/templates/shared" ]; then
    rm -rf .claude/templates/shared
fi

# Restore from specific backup
echo "📂 Restoring from backup templates.backup-20250802-125926..."
rm -rf .claude/templates
cp -r .claude/templates.backup-20250802-125926 .claude/templates

echo "✅ Rollback complete! Original structure restored from backup."