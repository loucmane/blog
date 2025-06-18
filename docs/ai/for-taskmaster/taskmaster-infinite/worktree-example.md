# Orchestrate-Task with Worktrees: Practical Example

This example shows how worktrees provide a safe, isolated environment for testing orchestrated implementations.

## Scenario: Implementing Task 5 (MDX Processing)

### Step 1: Current State
```bash
pwd
# /home/loucmane/dev/javascript/MomsBlog/blog

git status
# On branch main
# Your branch is up to date with 'origin/main'
# 
# Changes not staged for commit:
#   modified:   SESSION.md
#   modified:   packages/web/src/components/Header.tsx
```

### Step 2: Run Orchestrate-Task with Worktree
```bash
/orchestrate-task task_id=5 specialists=all depth=3 \
  output_mode=project-ready \
  target_dir=packages/web/src/lib/mdx \
  integration_plan=worktree
```

### Step 3: What Happens

The command:
1. Deploys all the orchestration agents
2. Generates 15+ implementations
3. Synthesizes the best solution
4. Then creates a worktree:

```bash
# Behind the scenes:
git stash push -m "orchestrate-task: temporary stash"  # Save your current work
git worktree add .taskmaster/infinite/orchestrated/task-5/worktree \
  -b orchestrate-task-5-test
git stash pop  # Restore your work in main
```

### Step 4: Directory Structure

You now have:
```
blog/                                    # Your main directory (unchanged)
├── SESSION.md                          # Still has your uncommitted changes
├── packages/web/src/components/        # Your in-progress work
└── .taskmaster/
    └── infinite/
        └── orchestrated/
            └── task-5/
                ├── worktree/           # FULL COPY of your repo
                │   ├── packages/       # Clean from main branch
                │   ├── docs/          
                │   └── ...            
                ├── final/              # Generated implementation
                ├── staging/            # Test results
                └── commit-message.txt  # Suggested message
```

### Step 5: The Magic - Two Independent Environments

**Your Main Directory:**
- Still on `main` branch
- Still has your uncommitted changes
- Completely unaffected

**The Worktree:**
- On `orchestrate-task-5-test` branch
- Has the orchestrated MDX implementation
- Can run independently

### Step 6: Test in Isolation

```bash
# Terminal 1 - Your normal work continues
cd /home/loucmane/dev/javascript/MomsBlog/blog
pnpm dev
# http://localhost:3000 - your current version

# Terminal 2 - Test the orchestrated implementation
cd .taskmaster/infinite/orchestrated/task-5/worktree
pnpm dev
# http://localhost:3001 - version with new MDX processing!
```

### Step 7: Compare Side by Side

Open both in VS Code:
```bash
# Window 1 - Your current work
code /home/loucmane/dev/javascript/MomsBlog/blog

# Window 2 - Orchestrated implementation  
code /home/loucmane/dev/javascript/MomsBlog/blog/.taskmaster/infinite/orchestrated/task-5/worktree
```

You can now:
- See the differences
- Test both versions
- Cherry-pick what you like

### Step 8: Integration Options

**Option A: Copy Specific Files**
```bash
# Just take the processor
cp .taskmaster/infinite/orchestrated/task-5/worktree/packages/web/src/lib/mdx/processor.ts \
   packages/web/src/lib/mdx/

# And maybe the transformers
cp -r .taskmaster/infinite/orchestrated/task-5/worktree/packages/web/src/lib/mdx/transformers \
      packages/web/src/lib/mdx/
```

**Option B: Take Everything**
```bash
# Copy all MDX implementation
cp -r .taskmaster/infinite/orchestrated/task-5/worktree/packages/web/src/lib/mdx/* \
     packages/web/src/lib/mdx/
```

**Option C: Use Git Cherry-Pick**
```bash
# First, commit in the worktree
cd .taskmaster/infinite/orchestrated/task-5/worktree
git add packages/web/src/lib/mdx
git commit -m "feat: orchestrated MDX implementation"

# Then cherry-pick from main
cd /home/loucmane/dev/javascript/MomsBlog/blog
git cherry-pick orchestrate-task-5-test
```

### Step 9: Clean Up
```bash
# Remove the worktree when done
git worktree remove .taskmaster/infinite/orchestrated/task-5/worktree

# List worktrees to confirm
git worktree list
# /home/loucmane/dev/javascript/MomsBlog/blog  abc1234 [main]
```

## Real-World Benefits

### 1. Zero Risk Testing
Your main directory is never touched. If the implementation breaks everything, just delete the worktree.

### 2. A/B Testing
Run both versions simultaneously on different ports. Show stakeholders the difference.

### 3. Incremental Adoption
Take only the parts you want. Maybe just the parser today, transformers next week.

### 4. Clean Git History
The worktree branch can be messy with test commits. Your main branch stays clean.

## Common Scenarios

### "I accidentally closed my terminal"
```bash
# Find the worktree
git worktree list

# Navigate back
cd /home/loucmane/dev/javascript/MomsBlog/blog/.taskmaster/infinite/orchestrated/task-5/worktree
```

### "I want to test with my current changes too"
```bash
# In main, commit temporarily
git add . && git commit -m "WIP: current work"

# Cherry-pick into worktree
cd .taskmaster/infinite/orchestrated/task-5/worktree
git cherry-pick main

# Later, soft reset in main to uncommit
cd /home/loucmane/dev/javascript/MomsBlog/blog
git reset --soft HEAD~1
```

### "The worktree is taking too much space"
```bash
# See all worktrees
git worktree list

# Remove old ones
git worktree remove .taskmaster/infinite/orchestrated/task-3/worktree
git worktree remove .taskmaster/infinite/orchestrated/task-4/worktree

# Or prune all broken ones
git worktree prune
```

## Worktree vs Staging Mode

### Use Worktree When:
- Need to run the full app
- Want git tracking during testing  
- Have complex multi-file changes
- Need to compare running versions
- Want maximum safety

### Use Staging When:
- Just testing individual components
- Don't need the full app running
- Want to save disk space
- Need quick iterations
- Trust the test suite

## Pro Tips

1. **Name branches clearly**: The auto-generated `orchestrate-task-5-test` is good
2. **Don't commit secrets**: Worktrees share the same .git folder
3. **Use different ports**: Configure your dev server to use 3001 in worktrees
4. **Clean up regularly**: Old worktrees eat disk space
5. **Document which approach**: Note in SESSION.md if you used worktree mode

## Summary

Worktrees give you a "parallel universe" to test orchestrated implementations:
- Your work continues uninterrupted
- Test in complete isolation  
- Compare versions side-by-side
- Integrate only what you want
- Zero risk to your current work

It's like having a sandbox where the orchestrate-task command can go wild with optimizations while your main codebase stays pristine!