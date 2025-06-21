**ORCHESTRATE TASK V3 - ALL IMPLEMENTATIONS IN WORKTREES**

Deploy a sophisticated multi-agent orchestration system that writes ALL implementations to organized folders within each worktree, making it easy to switch between approaches.

**Variables:**
- task_id: $ARGUMENTS
- specialists: $ARGUMENTS (default: "all")
- depth: $ARGUMENTS (default: 3)
- synthesis_strategy: $ARGUMENTS (default: "best-of-breed")
- deployment_mode: $ARGUMENTS (optional: "central" | "worktree-all", default: "central")
- worktree_prefix: $ARGUMENTS (required if deployment_mode="worktree-all")
- target_path: $ARGUMENTS (default: "packages/web/src/components")

**KEY INNOVATION IN V3:**
Each worktree contains ALL implementations from its specialist, organized in folders, with the best one activated.

**PHASE 0: DEPLOYMENT MODE DETECTION**

If deployment_mode="worktree-all":
1. Verify worktrees exist (same as V2)
2. Create implementation structure in each worktree:

```bash
# For each worktree
for i in {1..6}; do
  mkdir -p .worktrees/${worktree_prefix}-${i}/${target_path}/_implementations
  mkdir -p .worktrees/${worktree_prefix}-${i}/${target_path}/_active
done
```

**PHASE 1: MASTER ORCHESTRATOR INITIALIZATION**

[Same initialization as V2, but with updated deployment strategy]

**1.3 Deployment Strategy for worktree-all**

```yaml
orchestration_plan:
  deployment_mode: worktree-all
  structure_per_worktree:
    example_worktree_1_performance:
      _implementations/
        bundle-optimizer/     # Full implementation
        runtime-optimizer/    # Full implementation  
        memory-optimizer/     # Full implementation
      _active/               # Symlinks to best implementation
      [component files]      # Actual active files
```

**PHASE 2: SPECIALIST ORCHESTRATOR DEPLOYMENT**

**2.1 Deploy Performance Specialist Orchestrator**

TASK: Performance Specialist Orchestrator for Task [ID] with All-in-Worktree Deployment

You are the Performance Specialist Orchestrator.

Your deployment target:
- Worktree: .worktrees/${worktree_prefix}-1/
- Base path: ${target_path}/

Your mission:
1. Deploy ${depth} sub-agents for different performance optimizations
2. Each sub-agent writes to the worktree's _implementations folder:
   - .worktrees/${worktree_prefix}-1/${target_path}/_implementations/bundle-optimizer/
   - .worktrees/${worktree_prefix}-1/${target_path}/_implementations/runtime-optimizer/
   - .worktrees/${worktree_prefix}-1/${target_path}/_implementations/memory-optimizer/

3. After all complete, evaluate and select the BEST one
4. Activate the best implementation:
   ```bash
   # Copy best implementation to active location
   BEST_IMPL="bundle-optimizer"  # Based on evaluation
   cp -r _implementations/${BEST_IMPL}/* ./
   
   # Create activation record
   echo "${BEST_IMPL}" > _implementations/ACTIVE
   
   # Create switching script
   cat > _implementations/switch.sh << 'EOF'
   #!/bin/bash
   IMPL=$1
   if [ -d "_implementations/$IMPL" ]; then
     echo "Switching to $IMPL implementation..."
     rm -rf !(implementations)
     cp -r _implementations/$IMPL/* ./
     echo "$IMPL" > _implementations/ACTIVE
     echo "Switched to $IMPL"
   else
     echo "Implementation $IMPL not found"
     ls _implementations/
   fi
   EOF
   chmod +x _implementations/switch.sh
   ```

5. Create implementation manifest:
   ```json
   // _implementations/manifest.json
   {
     "specialist": "performance",
     "implementations": [
       {
         "name": "bundle-optimizer",
         "score": 95,
         "metrics": { "bundleSize": "45KB", "treeShakeable": true },
         "description": "Optimized for minimal bundle size"
       },
       {
         "name": "runtime-optimizer",
         "score": 87,
         "metrics": { "executionTime": "12ms", "memoryUsage": "2.1MB" },
         "description": "Optimized for execution speed"
       },
       {
         "name": "memory-optimizer",
         "score": 82,
         "metrics": { "peakMemory": "1.8MB", "gcPressure": "low" },
         "description": "Optimized for memory efficiency"
       }
     ],
     "active": "bundle-optimizer",
     "selected_reason": "Best overall performance score with smallest bundle size"
   }
   ```

[Similar updates for all other specialists...]

**PHASE 3: SYNTHESIS WITH ACCESS TO ALL IMPLEMENTATIONS**

The Synthesis Orchestrator (worktree 6) can now access ALL implementations:

```typescript
// Read all implementation manifests
const implementations = {
  performance: readJSON('.worktrees/task-7-test-1/_implementations/manifest.json'),
  architecture: readJSON('.worktrees/task-7-test-2/_implementations/manifest.json'),
  ux_dx: readJSON('.worktrees/task-7-test-3/_implementations/manifest.json'),
  accessibility: readJSON('.worktrees/task-7-test-4/_implementations/manifest.json'),
  innovation: readJSON('.worktrees/task-7-test-5/_implementations/manifest.json')
}

// Can cherry-pick from ANY implementation, not just the active ones
// For example: Take bundle optimization from performance/bundle-optimizer
// But take error handling from architecture/maintainability-optimizer
```

**PHASE 4: ENHANCED WORKTREE STRUCTURE**

Final structure in each worktree:

```
.worktrees/task-7-test-1/packages/web/src/components/
├── _implementations/
│   ├── bundle-optimizer/
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   └── Layout.tsx
│   ├── runtime-optimizer/
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   └── Layout.tsx
│   ├── memory-optimizer/
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   └── Layout.tsx
│   ├── manifest.json      # Describes all implementations
│   ├── ACTIVE            # Contains "bundle-optimizer"
│   └── switch.sh         # Script to switch implementations
├── Header.tsx            # Active implementation (copy of bundle-optimizer version)
├── Footer.tsx
└── Layout.tsx
```

**PHASE 5: SWITCHING IMPLEMENTATIONS**

Users can easily switch implementations within any worktree:

```bash
# See available implementations
cd .worktrees/task-7-test-1/packages/web/src/components
cat _implementations/manifest.json

# Switch to different implementation
./_implementations/switch.sh runtime-optimizer

# Restart dev server to see the change
pnpm dev
```

**PHASE 6: COMPARISON UTILITIES**

Create comparison utilities in each worktree:

```bash
# _implementations/compare.sh
#!/bin/bash
echo "Comparing all implementations in this worktree..."
for impl in _implementations/*/; do
  if [ -d "$impl" ] && [ "$impl" != "_implementations/ACTIVE" ]; then
    name=$(basename "$impl")
    echo -e "\n=== $name ==="
    # Count lines
    echo "Total lines: $(find $impl -name "*.tsx" -o -name "*.ts" | xargs wc -l | tail -1)"
    # Check bundle size if built
    if [ -f "$impl/metrics.json" ]; then
      cat "$impl/metrics.json"
    fi
  fi
done
```

**USAGE EXAMPLES:**

**Full deployment with all implementations:**
```bash
# Create worktrees
/init-parallel feature-name=task-7-complete number-of-parallel-worktrees=6

# Deploy ALL implementations to organized folders
/orchestrate-task-v3 task_id=7 specialists=all depth=3 \
  deployment_mode=worktree-all worktree_prefix=task-7-complete

# Start dev servers
pnpm worktree:dev:tmux

# In any worktree, switch implementations on the fly:
cd .worktrees/task-7-complete-1/packages/web/src/components
./_implementations/switch.sh memory-optimizer
```

**BENEFITS OF V3:**

1. **Complete Flexibility**: All implementations available in each worktree
2. **Easy Switching**: Change active implementation with one command
3. **Better Synthesis**: Synthesis orchestrator can mix-and-match from all 15+ implementations
4. **Self-Documenting**: Each worktree has manifest describing all options
5. **Git-Friendly**: Can .gitignore _implementations/ folder
6. **Comparison Tools**: Built-in scripts to compare implementations

**ERROR PREVENTION:**

The switch script validates:
- Implementation exists before switching
- No files are lost (everything in _implementations/)
- Active implementation is tracked

**FINAL STRUCTURE EXAMPLE:**

```
.worktrees/
├── task-7-test-1/  # Performance specialist worktree
│   └── packages/web/src/components/
│       ├── _implementations/
│       │   ├── bundle-optimizer/    # Option 1
│       │   ├── runtime-optimizer/   # Option 2
│       │   ├── memory-optimizer/    # Option 3
│       │   ├── manifest.json
│       │   ├── ACTIVE              # "bundle-optimizer"
│       │   ├── switch.sh
│       │   └── compare.sh
│       └── [active component files]
├── task-7-test-2/  # Architecture specialist worktree
│   └── (same structure with architecture implementations)
└── task-7-test-6/  # Synthesis worktree
    └── (can access ALL implementations from ALL worktrees)
```

**ORCHESTRATION COMPLETE**

V3 gives you the best of all worlds - every implementation is preserved and organized within its specialist's worktree, ready to switch, compare, or cherry-pick at any time!