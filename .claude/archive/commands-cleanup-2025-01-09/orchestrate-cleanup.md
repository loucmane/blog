**ORCHESTRATE CLEANUP - Smart Cleanup with History**

Clean up orchestration artifacts while preserving useful information.

**Variables:**
- task_id: $ARGUMENTS (required)
- preserve_best: $ARGUMENTS (optional, default: true)
- archive: $ARGUMENTS (optional, default: true)

**EXECUTION:**

```bash
# 1. Find orchestration state
STATE_FILE=".taskmaster/orchestration-state.yaml"
if [ ! -f "$STATE_FILE" ]; then
  echo "❌ No orchestration state found for task ${task_id}"
  exit 1
fi

WORKTREE_PREFIX=$(grep "worktree_prefix:" "$STATE_FILE" | awk '{print $2}')
echo "🧹 Cleaning up orchestration for Task ${task_id}"
echo "   Worktree prefix: ${WORKTREE_PREFIX}"
echo ""

# 2. Stop any running servers
if tmux has-session -t orchestration 2>/dev/null; then
  echo "📡 Stopping development servers..."
  tmux kill-session -t orchestration
fi

# 3. Archive implementations if requested
if [ "${archive}" = "true" ]; then
  ARCHIVE_DIR=".taskmaster/orchestration-archive/task-${task_id}-$(date +%Y%m%d-%H%M%S)"
  echo "📦 Archiving implementations to: ${ARCHIVE_DIR}"
  mkdir -p "${ARCHIVE_DIR}"
  
  # Save decision record
  cat > "${ARCHIVE_DIR}/decision-record.md" << EOF
# Orchestration Decision Record - Task ${task_id}

Date: $(date)
Worktree Prefix: ${WORKTREE_PREFIX}

## Implementations Tested

EOF

  # Archive each worktree's best implementation
  for worktree in .worktrees/${WORKTREE_PREFIX}*; do
    if [ -d "$worktree" ]; then
      WORKTREE_NAME=$(basename "$worktree")
      echo "  Archiving: ${WORKTREE_NAME}"
      
      # Copy implementation manifest
      if [ -f "$worktree/packages/web/src/components/_implementations/manifest.json" ]; then
        mkdir -p "${ARCHIVE_DIR}/${WORKTREE_NAME}"
        cp "$worktree/packages/web/src/components/_implementations/manifest.json" \
           "${ARCHIVE_DIR}/${WORKTREE_NAME}/"
        
        # If preserve_best, copy the active implementation
        if [ "${preserve_best}" = "true" ] && [ -f "$worktree/packages/web/src/components/_implementations/ACTIVE" ]; then
          ACTIVE=$(cat "$worktree/packages/web/src/components/_implementations/ACTIVE")
          cp -r "$worktree/packages/web/src/components/_implementations/$ACTIVE" \
                "${ARCHIVE_DIR}/${WORKTREE_NAME}/implementation"
          
          echo "- **${WORKTREE_NAME}**: Chose ${ACTIVE}" >> "${ARCHIVE_DIR}/decision-record.md"
        fi
      fi
    fi
  done
  
  # Copy state file
  cp "$STATE_FILE" "${ARCHIVE_DIR}/orchestration-state.yaml"
  
  echo "✅ Archive created"
fi

# 4. Remove worktrees
echo ""
echo "🌳 Removing worktrees..."
REMOVED_COUNT=0
for worktree in .worktrees/${WORKTREE_PREFIX}*; do
  if [ -d "$worktree" ]; then
    WORKTREE_PATH=$(realpath "$worktree")
    echo "  Removing: $(basename $worktree)"
    git worktree remove "$WORKTREE_PATH" --force 2>/dev/null || true
    ((REMOVED_COUNT++))
  fi
done
echo "✅ Removed ${REMOVED_COUNT} worktrees"

# 5. Clean up branches
echo ""
echo "🌿 Cleaning up branches..."
git branch -d $(git branch | grep "${WORKTREE_PREFIX}") 2>/dev/null || true

# 6. Clean up state file
mv "$STATE_FILE" "$STATE_FILE.cleaned-$(date +%Y%m%d-%H%M%S)"

# 7. Final summary
echo ""
echo "✅ CLEANUP COMPLETE!"
echo "━━━━━━━━━━━━━━━━━━━"
echo ""
if [ "${archive}" = "true" ]; then
  echo "📁 Archived to: ${ARCHIVE_DIR}"
  echo "   • Decision record saved"
  if [ "${preserve_best}" = "true" ]; then
    echo "   • Best implementations preserved"
  fi
fi
echo ""
echo "💡 To orchestrate again: /orchestrate-and-test task_id=${task_id}"
```