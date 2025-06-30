#!/bin/bash

# Scan all task-7 orchestration worktrees for implementations
WORKTREES=(
    "task-7-orch-perf-1"
    "task-7-orch-perf-2"
    "task-7-orch-arch-1"
    "task-7-orch-arch-2"
    "task-7-orch-ux-1"
    "task-7-orch-ux-2"
    "task-7-orch-a11y-1"
    "task-7-orch-a11y-2"
    "task-7-orch-innov-1"
    "task-7-orch-innov-2"
)

BASE_PATH="/home/loucmane/dev/javascript/MomsBlog/blog/.worktrees"

for WORKTREE in "${WORKTREES[@]}"; do
    LAYOUT_PATH="$BASE_PATH/$WORKTREE/packages/web/src/components/layout"
    
    echo "=== $WORKTREE ==="
    
    if [ -d "$LAYOUT_PATH" ]; then
        echo "Found layout components:"
        ls -la "$LAYOUT_PATH" | grep -E "(Header|Footer|MainLayout|MobileNav|index)" | awk '{print "  - " $9}'
        
        # Check file sizes
        echo "Bundle sizes:"
        for file in Header.tsx Footer.tsx MainLayout.tsx MobileNav.tsx; do
            if [ -f "$LAYOUT_PATH/$file" ]; then
                SIZE=$(wc -c < "$LAYOUT_PATH/$file")
                echo "  - $file: $SIZE bytes"
            fi
        done
    else
        echo "No layout directory found"
    fi
    
    echo ""
done