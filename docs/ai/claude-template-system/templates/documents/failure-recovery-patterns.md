# Failure & Recovery Patterns

## Overview

This document provides patterns for handling common failures and recovery scenarios when using the Claude Template System. Each pattern includes detection methods, recovery steps, and prevention strategies.

## Common Failure Scenarios

### 1. Context Window Exhaustion

**Symptoms**:
- AI becomes confused or forgets earlier context
- Responses become generic or lose project specifics
- Repeated questions about already-discussed topics

**Detection**:
```yaml
Warning Signs:
  - Asking for project path repeatedly
  - Forgetting task context
  - Generic responses instead of specific
  - "I don't see that in the context" errors
```

**Recovery**:
1. Create immediate checkpoint in SESSION.md
2. Start fresh conversation with minimal context:
   ```
   Continue from SESSION.md checkpoint at [timestamp].
   Focus only on: [specific subtask]
   Key context: [2-3 essential points]
   ```
3. Load only essential template files (CLAUDE-NEW.md + 1 other)

**Prevention**:
- Use focused specialists for complex tasks
- Create frequent SESSION.md checkpoints
- Limit file context to 3 files maximum per specialist
- Break large tasks into smaller subtasks

### 2. Specialist Deployment Failures

**Symptoms**:
- Specialist returns without completing work
- Specialist misunderstands the task
- Work quality below expectations

**Detection**:
```yaml
Red Flags:
  - Completion time < 50% of estimate
  - Missing expected deliverables
  - Generic implementation
  - No testing instructions provided
```

**Recovery**:
1. **Immediate**: Re-deploy with clearer context
   ```yaml
   Refined Context:
     specific_goal: "Create Header.tsx with mobile menu"
     constraints: "Use existing Button component"
     examples: "See Footer.tsx for pattern"
     avoid: "Don't create new design tokens"
   ```

2. **If still failing**: Handle directly
   - Mark subtask for main session work
   - Document why specialist deployment failed
   - Continue with next subtask

**Prevention**:
- Provide 1-2 example files showing desired patterns
- Set clear boundaries in specialist context
- Include "what NOT to do" instructions
- Verify specialist has required dependencies

### 3. Testing Checkpoint Failures

**Symptoms**:
- User finds critical issues during testing
- Implementation doesn't match requirements
- Multiple iterations without progress

**Detection**:
```yaml
Testing Failure Patterns:
  - Same issue after 2+ fix attempts
  - Regression (fixing one thing breaks another)  
  - Fundamental misunderstanding of requirement
  - Performance/accessibility failures
```

**Recovery**:
1. **Stop and Analyze**:
   ```markdown
   ## Issue Analysis
   - What's failing: [specific behavior]
   - Expected behavior: [clear description]
   - Root cause: [hypothesis]
   - Failed attempts: [what didn't work]
   ```

2. **Change Approach**:
   - Consider different implementation strategy
   - Check if missing dependency or import
   - Review similar working components
   - Ask user for clarification if needed

3. **Document Learning**:
   ```markdown
   ### Learning from Failure
   - Pattern: [what pattern caused issue]
   - Solution: [what finally worked]
   - Future: [how to avoid this]
   ```

**Prevention**:
- Test incrementally (don't batch changes)
- Verify understanding before implementing
- Check similar components first
- Include edge case handling upfront

### 4. Git/Version Control Failures

**Symptoms**:
- Merge conflicts during integration
- Lost work due to git issues
- Branch confusion
- Uncommitted changes blocking progress

**Detection**:
```bash
# Check for issues
git status
git diff --name-only
git log --oneline -5
```

**Recovery**:
1. **For uncommitted changes**:
   ```bash
   # Stash work safely
   git stash save "WIP: [description]"
   
   # Or commit to WIP branch
   git checkout -b wip-backup
   git add .
   git commit -m "WIP: Backup before recovery"
   ```

2. **For merge conflicts**:
   - Document conflict in SESSION.md
   - Resolve systematically
   - Test thoroughly after resolution

3. **For lost work**:
   ```bash
   # Check reflog
   git reflog
   
   # Recover from stash
   git stash list
   git stash apply stash@{n}
   ```

**Prevention**:
- Commit frequently with clear messages
- Use feature branches consistently
- Run `git status` before major operations
- Document branch strategy in SESSION.md

### 5. Dependency/Environment Failures

**Symptoms**:
- `pnpm install` failures
- Build errors after changes
- Type errors in previously working code
- Module not found errors

**Detection**:
```yaml
Environment Issues:
  - New imports failing
  - Build breaking on unchanged code
  - Type definitions not found
  - Inconsistent behavior across runs
```

**Recovery**:
1. **Clean and Rebuild**:
   ```bash
   # Clean everything
   rm -rf node_modules .next
   pnpm store prune
   
   # Fresh install
   pnpm install
   
   # Clear caches
   pnpm next telemetry disable
   rm -rf .next
   ```

2. **Check Dependencies**:
   ```bash
   # Verify package.json
   pnpm ls [package-name]
   
   # Check for version conflicts
   pnpm outdated
   ```

3. **Type Issues**:
   ```bash
   # Regenerate types
   pnpm typecheck
   
   # Check tsconfig
   cat tsconfig.json
   ```

**Prevention**:
- Document dependency changes in SESSION.md
- Test builds after adding packages
- Use exact versions in package.json
- Keep TypeScript strict mode enabled

### 6. Communication/Understanding Failures

**Symptoms**:
- AI implements wrong feature
- Misunderstanding of requirements
- Working on already-completed tasks
- Confusion about project structure

**Detection**:
```yaml
Misalignment Indicators:
  - User says "that's not what I meant"
  - Duplicating previous work
  - Wrong file locations
  - Incorrect assumptions about stack
```

**Recovery**:
1. **Immediate Stop**:
   ```
   I notice we may be misaligned. Let me verify:
   - You want: [what I think you want]
   - Located in: [where I think it goes]
   - Using: [tech I think we're using]
   Is this correct?
   ```

2. **Reset Understanding**:
   - Re-read original requirement
   - Check PROJECT-BLOG.md for specifics
   - Review recent SESSION.md entries
   - Ask clarifying questions

3. **Document Understanding**:
   ```markdown
   ### Requirement Clarification
   - Original request: "[user's words]"
   - My understanding: [interpretation]
   - Confirmed approach: [what we agreed]
   ```

**Prevention**:
- Echo understanding before implementing
- Ask when uncertain
- Reference user's exact words
- Check previous implementations

## Recovery Principles

### 1. Stop-Analyze-Adjust
When something fails:
1. **STOP** - Don't compound the problem
2. **ANALYZE** - Understand root cause
3. **ADJUST** - Change approach based on learning

### 2. Document Everything
Every failure is a learning opportunity:
- What went wrong
- Why it went wrong  
- What fixed it
- How to prevent it

### 3. Incremental Recovery
- Fix one thing at a time
- Test each fix independently
- Commit working states
- Build on small successes

### 4. Know When to Escalate
Some issues need user input:
- Requirement clarification
- Business logic decisions
- Architecture choices
- Tool configuration issues

## Quick Recovery Checklist

When things go wrong, run through:

- [ ] Is this a context/memory issue? → Checkpoint and restart
- [ ] Is this a misunderstanding? → Clarify requirements
- [ ] Is this environmental? → Clean and rebuild
- [ ] Is this a git issue? → Check status and branches
- [ ] Is this a complexity issue? → Break down further
- [ ] Is this a knowledge gap? → Research or ask user

## Pattern Recognition

Track failure patterns to improve:

```yaml
Failure Log Template:
  Date: [when]
  Type: [category from above]
  Trigger: [what caused it]
  Impact: [what broke]
  Recovery: [what fixed it]
  Prevention: [future avoidance]
  Time Lost: [duration]
```

## Remember

1. **Failures are normal** - Complex systems have complex failure modes
2. **Recovery is a skill** - Gets better with practice
3. **Prevention is ideal** - But perfect prevention is impossible
4. **Documentation helps** - Future you will thank current you
5. **Users understand** - Transparency about issues builds trust

---

The goal isn't to avoid all failures - it's to recover quickly and learn from each one.