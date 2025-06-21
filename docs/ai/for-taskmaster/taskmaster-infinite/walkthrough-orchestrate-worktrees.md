# Step-by-Step Walkthrough: Testing Orchestrate-Task with Worktrees

This guide walks you through using the orchestrate-task command with parallel worktrees to test multiple AI-generated implementations.

## Prerequisites
- You're in a new Claude session (so commands are loaded)
- You're in the project root: `/home/loucmane/dev/javascript/MomsBlog/blog`
- You have no uncommitted changes (check with `git status`)

## Step 1: Generate Multiple Implementations

First, let's use Task 7 (Layout Components) as our test case:

```bash
/orchestrate-task task_id=7 specialists=performance,architecture depth=2 synthesis_strategy=best-of-breed
```

**What to expect:**
- This will take 2-3 minutes as it deploys ~6 agents
- You should see agents being created and working
- Check progress by looking for files appearing in `.taskmaster/infinite/orchestrated/task-7/`

**Verify it worked:**
```bash
# Check the structure was created
ls -la .taskmaster/infinite/orchestrated/task-7/

# You should see:
# - specialists/
# - evaluation/
# - synthesis/
# - final/
# - state.yaml
```

## Step 2: Review What Was Generated

Look at what each specialist created:

```bash
# See all implementations
find .taskmaster/infinite/orchestrated/task-7/specialists -name "*.ts" -o -name "*.tsx" | head -20

# Read a specific implementation
cat .taskmaster/infinite/orchestrated/task-7/specialists/performance/bundle-optimizer/implementation.ts
```

## Step 3: Create Parallel Worktrees

Now create 3 worktrees to test different versions:

```bash
/init-parallel feature-name=layout-test number-of-parallel-worktrees=3
```

**What happens:**
- Creates `.worktrees/layout-test-1/` (port 3001)
- Creates `.worktrees/layout-test-2/` (port 3002)
- Creates `.worktrees/layout-test-3/` (port 3003)
- Runs `pnpm install` in each
- Updates package.json with unique ports

**Verify:**
```bash
git worktree list
# Should show 3 new worktrees
```

## Step 4: Copy Implementations to Worktrees

Now let's put different implementations in each worktree:

```bash
# Worktree 1: Performance-optimized version
cp -r .taskmaster/infinite/orchestrated/task-7/specialists/performance/bundle-optimizer/* \
     .worktrees/layout-test-1/packages/web/src/components/

# Worktree 2: Architecture-optimized version
cp -r .taskmaster/infinite/orchestrated/task-7/specialists/architecture/patterns-optimizer/* \
     .worktrees/layout-test-2/packages/web/src/components/

# Worktree 3: The synthesized final version
cp -r .taskmaster/infinite/orchestrated/task-7/final/implementation/* \
     .worktrees/layout-test-3/packages/web/src/components/
```

## Step 5: Create Test Page (if needed)

If the implementations need a test page, create one in each worktree:

```bash
# Create a simple test page in each worktree
for i in {1..3}; do
  cat > .worktrees/layout-test-$i/packages/web/src/app/layout-test/page.tsx << 'EOF'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { MainLayout } from '@/components/MainLayout'

export default function LayoutTest() {
  return (
    <MainLayout>
      <div className="container mx-auto py-8">
        <h1 className="text-4xl font-bold mb-8">Layout Component Test</h1>
        <p>Testing the AI-generated layout components.</p>
      </div>
    </MainLayout>
  )
}
EOF
done
```

## Step 6: Run All Worktrees

Open 3 terminal windows/tabs:

**Terminal 1:**
```bash
cd .worktrees/layout-test-1
pnpm dev
# Opens at http://localhost:3001
```

**Terminal 2:**
```bash
cd .worktrees/layout-test-2
pnpm dev
# Opens at http://localhost:3002
```

**Terminal 3:**
```bash
cd .worktrees/layout-test-3
pnpm dev
# Opens at http://localhost:3003
```

## Step 7: Compare in Browser

Open your browser with all three versions:
1. http://localhost:3001/layout-test - Performance version
2. http://localhost:3002/layout-test - Architecture version
3. http://localhost:3003/layout-test - Synthesized version

**What to look for:**
- Visual differences
- Performance (open DevTools Network tab)
- Responsiveness (resize browser)
- Accessibility (test with keyboard)

## Step 8: Run Metrics (Optional)

In separate terminals, check metrics for each:

```bash
# Terminal 4 - Check bundle sizes
cd .worktrees/layout-test-1 && pnpm build
cd .worktrees/layout-test-2 && pnpm build
cd .worktrees/layout-test-3 && pnpm build

# Compare .next directory sizes
du -sh .worktrees/layout-test-*/.next
```

## Step 9: Choose the Best Implementation

After testing, decide which you prefer. Let's say you like worktree 3:

```bash
# Copy the chosen implementation back to your main project
cp -r .worktrees/layout-test-3/packages/web/src/components/* \
     packages/web/src/components/

# Or cherry-pick specific files
cp .worktrees/layout-test-3/packages/web/src/components/Header.tsx \
   packages/web/src/components/
```

## Step 10: Clean Up

Remove the worktrees when done:

```bash
# Stop all dev servers first (Ctrl+C in each terminal)

# Remove worktrees
git worktree remove .worktrees/layout-test-1
git worktree remove .worktrees/layout-test-2
git worktree remove .worktrees/layout-test-3

# Verify they're gone
git worktree list
```

## Troubleshooting

**If orchestrate-task doesn't create files:**
- Check `.taskmaster/infinite/orchestrated/task-7/state.yaml` for errors
- Make sure you're using a task ID that exists in TaskMaster
- Try with fewer specialists first: `specialists=performance depth=1`

**If worktrees fail to create:**
- Make sure you have no uncommitted changes
- Check that `.worktrees/` directory doesn't already exist
- Try creating one manually first: `git worktree add -b test .worktrees/test`

**If dev servers won't start:**
- Check that ports 3001-3003 are free
- Verify pnpm install completed in each worktree
- Look for TypeScript errors from the copied implementations

## Quick Reference Commands

```bash
# Generate implementations
/orchestrate-task task_id=7 specialists=performance,architecture depth=2

# Create worktrees
/init-parallel feature-name=layout-test number-of-parallel-worktrees=3

# Check what was generated
ls -la .taskmaster/infinite/orchestrated/task-7/specialists/

# Copy an implementation
cp -r .taskmaster/infinite/orchestrated/task-7/final/implementation/* \
     .worktrees/layout-test-1/packages/web/src/components/

# Start a dev server
cd .worktrees/layout-test-1 && pnpm dev

# Clean up worktree
git worktree remove .worktrees/layout-test-1
```

## Next Steps

Once you've mastered this workflow, you can:
1. Try with more specialists: `specialists=all depth=3`
2. Test different synthesis strategies
3. Create the `compare-implementations` automation
4. Try with more complex tasks

Good luck! This workflow gives you superpowers for testing AI-generated code safely!