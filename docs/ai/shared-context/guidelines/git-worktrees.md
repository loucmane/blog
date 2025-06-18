# Git Worktrees Guide for Orchestrate-Task

## What are Git Worktrees?

Git worktrees allow you to have multiple working directories attached to the same repository. Think of it as having multiple "checkouts" of your repo that can each be on different branches.

### Traditional Git:
```
blog/                    # Your main working directory
├── .git/               # Git database
├── packages/           # Your files (on current branch)
├── docs/
└── ...
```

### With Worktrees:
```
blog/                    # Main working directory (e.g., on 'main' branch)
├── .git/               # Shared git database
├── packages/           # Files from 'main' branch
└── ...

blog-feature-x/         # Worktree directory (on 'feature-x' branch)
├── packages/           # Files from 'feature-x' branch
└── ...

blog-experiment/        # Another worktree (on 'experiment' branch)
├── packages/           # Files from 'experiment' branch
└── ...
```

## Benefits for Orchestrate-Task

1. **Isolation**: Test generated code without touching your main working directory
2. **Easy Comparison**: Have both versions open in your editor simultaneously
3. **No Stashing**: Don't need to stash current work to test something
4. **Clean Rollback**: Just delete the worktree if you don't like the changes

## Basic Worktree Commands

### Create a worktree:
```bash
# Create worktree with new branch
git worktree add ../blog-test -b test-branch

# Create worktree from existing branch
git worktree add ../blog-feature feature-branch

# Create worktree in specific location
git worktree add /tmp/blog-experiment -b experiment
```

### List worktrees:
```bash
git worktree list
# Output:
# /home/user/blog         abc1234 [main]
# /home/user/blog-test    def5678 [test-branch]
```

### Remove a worktree:
```bash
# Remove worktree (keeps the branch)
git worktree remove /path/to/worktree

# Force remove (if has uncommitted changes)
git worktree remove --force /path/to/worktree
```

## How Orchestrate-Task Would Use Worktrees

When you use `integration_plan=worktree`, here's what happens:

### 1. Creates a Worktree
```bash
# Orchestrate-task would run something like:
git worktree add .taskmaster/infinite/orchestrated/task-5/worktree \
  -b orchestrate-task-5-test
```

This creates:
```
.taskmaster/infinite/orchestrated/task-5/
├── worktree/           # Full checkout of your repo
│   ├── packages/       # Complete project structure
│   ├── docs/
│   └── ...
├── final/              # Generated implementation
└── ...
```

### 2. Applies Changes in Worktree
```bash
# Copy generated files into worktree
cp -r final/implementation/* worktree/packages/web/src/lib/mdx/

# Run tests IN the worktree
cd worktree
pnpm install
pnpm test
```

### 3. You Can Then:
- Open the worktree in a new VS Code window to review
- Run the dev server from the worktree
- Compare with your main directory side-by-side
- Cherry-pick changes you like

### 4. Integration Options

**Option A: Copy files back**
```bash
# From main directory
cp -r .taskmaster/.../worktree/packages/web/src/lib/mdx/* \
     packages/web/src/lib/mdx/
```

**Option B: Commit in worktree, merge**
```bash
# In worktree
git add .
git commit -m "feat: orchestrated implementation"

# In main directory
git merge orchestrate-task-5-test
```

**Option C: Cherry-pick specific files**
```bash
# From main directory
git checkout orchestrate-task-5-test -- packages/web/src/lib/mdx/processor.ts
```

## Practical Example with Orchestrate-Task

```bash
# 1. Run orchestrate-task with worktree mode
/orchestrate-task task_id=5 specialists=all depth=3 \
  output_mode=project-ready target_dir=packages/web/src/lib/mdx \
  integration_plan=worktree

# 2. This creates:
# .taskmaster/infinite/orchestrated/task-5/worktree/
# with your ENTIRE project + the new implementation

# 3. Open worktree in new terminal/editor
cd .taskmaster/infinite/orchestrated/task-5/worktree
code .  # Opens in new VS Code window

# 4. Test the implementation
pnpm dev
# Visit localhost:3000 - this is the worktree version!

# 5. If you like it, go back to main and copy
cd /home/loucmane/dev/javascript/MomsBlog/blog
cp -r .taskmaster/.../worktree/packages/web/src/lib/mdx/* \
     packages/web/src/lib/mdx/

# 6. Clean up
git worktree remove .taskmaster/infinite/orchestrated/task-5/worktree
```

## Pros and Cons

### Pros:
- Complete isolation from your working directory
- Can run full app with changes
- Easy to compare implementations
- Git tracks everything

### Cons:
- Takes more disk space (full repo copy)
- Need to understand worktree commands
- Can be confusing if you forget which directory you're in

## When to Use Each Integration Mode

### Use `staging`:
- Quick testing of generated code
- Don't need full app running
- Want minimal disk usage
- Default choice for most tasks

### Use `worktree`:
- Need to run full app with changes
- Want to compare side-by-side
- Complex changes affecting multiple files
- Want git tracking during testing

### Use `manual`:
- Just want the code and docs
- Have your own integration process
- Don't want any automation

## Tips

1. **Name worktrees clearly**: Use descriptive names like `task-5-mdx-test`
2. **Clean up**: Don't leave old worktrees around (`git worktree prune`)
3. **Check location**: Always know which directory you're in
4. **Use absolute paths**: Worktrees work best with absolute paths

## Common Issues

### "Fatal: branch already checked out"
You can't have the same branch in multiple worktrees. Solution:
```bash
# Create new branch for worktree
git worktree add path -b new-branch-name
```

### "Worktree is dirty"
Uncommitted changes prevent removal. Solution:
```bash
# Force remove
git worktree remove --force path

# Or commit/stash changes first
cd worktree && git stash
```

### Finding lost worktrees
```bash
# List all worktrees
git worktree list

# Clean up missing worktrees
git worktree prune
```

## Summary

Worktrees are perfect for testing orchestrate-task implementations because they:
1. Give you a complete, isolated environment
2. Let you run the full application
3. Keep your main directory untouched
4. Make it easy to compare before/after

For orchestrate-task, I'd recommend:
- Start with `staging` mode for simple tasks
- Use `worktree` for complex implementations that need full testing
- Always clean up worktrees when done