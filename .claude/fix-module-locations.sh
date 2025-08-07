#!/bin/bash

# Fix module locations - move from .claude/ to .claude/templates/

echo "Fixing module locations..."

# Directories that should be in templates/
DIRS_TO_MOVE=(
    "engine"
    "behaviors" 
    "matrices"
    "registry"
    "tools"
    "guides"
    "conventions"
    "workflows"
    "integration"
)

# Move each directory to the correct location
for dir in "${DIRS_TO_MOVE[@]}"; do
    if [ -d ".claude/$dir" ]; then
        echo "Moving .claude/$dir to .claude/templates/$dir"
        mv ".claude/$dir" ".claude/templates/$dir"
    else
        echo "Directory .claude/$dir not found"
    fi
done

# Check if shared directory needs items moved
if [ -d ".claude/shared" ]; then
    echo "Moving items from .claude/shared to .claude/templates/shared"
    # Only move if templates/shared exists
    if [ -d ".claude/templates/shared" ]; then
        cp -r .claude/shared/* .claude/templates/shared/
        rm -rf .claude/shared
        echo "Merged and removed .claude/shared"
    else
        mv .claude/shared .claude/templates/shared
        echo "Moved .claude/shared to .claude/templates/shared"
    fi
fi

echo "Module locations fixed!"
echo ""
echo "New structure:"
ls -la .claude/templates/ | grep "^d"