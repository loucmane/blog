# Compare Orchestrated Implementations

## Variables
TASK_ID: $ARGUMENTS
COMPARISON_METRICS: $ARGUMENTS (optional: "performance,accessibility,bundle-size")

## Execute

1. Find all implementations:
```bash
find .taskmaster/infinite/orchestrated/task-${TASK_ID}/specialists -name "implementation.ts" -type f
```

2. Check if worktrees exist:
```bash
WORKTREE_COUNT=$(git worktree list | grep -c "task-${TASK_ID}-test")
if [ $WORKTREE_COUNT -eq 0 ]; then
  echo "No worktrees found. Run: /init-parallel feature-name=task-${TASK_ID}-test number-of-parallel-worktrees=5"
  exit 1
fi
```

3. Copy top implementations to worktrees:
```bash
# Get evaluation scores
EVAL_REPORT=".taskmaster/infinite/orchestrated/task-${TASK_ID}/evaluation/scores.json"

# Copy top 5 implementations based on scores
# (This would need the evaluation report to be parsed)
```

4. Run comparison metrics:
```bash
for i in {1..5}; do
  echo "=== Worktree $i Performance ==="
  cd .worktrees/task-${TASK_ID}-test-$i
  
  # Bundle size
  echo "Bundle size:"
  pnpm build && du -sh .next
  
  # Type coverage
  echo "Type coverage:"
  pnpm type-coverage
  
  # Lighthouse scores (if dev server running)
  if curl -s http://localhost:300$i > /dev/null; then
    echo "Lighthouse scores:"
    npx lighthouse http://localhost:300$i --quiet --chrome-flags="--headless" --only-categories=performance,accessibility
  fi
  
  cd -
done
```

5. Generate comparison report:
```markdown
# Implementation Comparison for Task ${TASK_ID}

| Metric | Worktree 1 | Worktree 2 | Worktree 3 | Worktree 4 | Original |
|--------|------------|------------|------------|------------|----------|
| Bundle Size | X KB | X KB | X KB | X KB | X KB |
| Performance | X/100 | X/100 | X/100 | X/100 | X/100 |
| Accessibility | X/100 | X/100 | X/100 | X/100 | X/100 |
| Type Coverage | X% | X% | X% | X% | X% |

## Recommendations
Based on the metrics, worktree X provides the best overall implementation.
```