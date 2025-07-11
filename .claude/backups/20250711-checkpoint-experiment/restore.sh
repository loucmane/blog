#!/bin/bash
# Restore script for checkpoint experiment
# Created: 2025-07-11

echo "Restoring files from checkpoint experiment backup..."
echo "This will overwrite current files with backed up versions."
read -p "Are you sure you want to continue? (y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]
then
    # Get the directory where this script is located
    BACKUP_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
    
    # Navigate to project root (3 levels up from backup dir)
    cd "$BACKUP_DIR/../../.." || exit 1
    
    echo "Restoring CLAUDE.md..."
    cp "$BACKUP_DIR/CLAUDE.md.backup" CLAUDE.md
    
    echo "Restoring WORKFLOWS.md..."
    cp "$BACKUP_DIR/WORKFLOWS.md.backup" .claude/templates/WORKFLOWS.md
    
    echo "Restoring TOOLS.md..."
    cp "$BACKUP_DIR/TOOLS.md.backup" .claude/templates/TOOLS.md
    
    echo "Restoring CONVENTIONS.md..."
    cp "$BACKUP_DIR/CONVENTIONS.md.backup" .claude/templates/CONVENTIONS.md
    
    echo "✅ Restore complete!"
else
    echo "Restore cancelled."
fi