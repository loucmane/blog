# Implementation Plan: Navigation Improvements

## Step-by-Step Implementation

### Step 1: Add Navigation Keywords to REGISTRY.md
```markdown
## 🔍 Navigation Keywords

Quick keyword lookup for finding handlers.

### Action Keywords → Handlers
| Keywords | Primary Handler | Secondary Options |
|----------|----------------|-------------------|
| work, working, start | start-new-work | continue-work |
| implement, implementing | implement-feature | start-new-work |
| fix, fixing, resolve | fix-problem | debug |
| debug, debugging | debug | analyze-error |
| error, failing, failed | analyze-error | debug |
| search, find, looking | search-code | find-symbol, grep-pattern |
| edit, modify, update, change | edit-file | - |
| commit, save | create-commit-message | commit-changes |
| create, new, make | create-component | start-new-work |
| test, testing | test-implementation | create-test-checkpoint |

### Context Keywords
| Keywords | Likely Context | Handlers |
|----------|---------------|----------|
| bug, issue, problem | Problem solving | fix-problem, debug |
| feature, functionality | Development | start-new-work, implement-feature |
| component, widget, ui | UI work | create-component |
| git, repository, branch | Version control | Git handlers |
| code, function, class | Code search | search-code, find-symbol |
```

### Step 2: Update CLAUDE.md Navigation Logic
Add after current navigation protocol:

```markdown
### Keyword-Based Navigation

When exact phrase match fails:

1. **Extract Keywords**
   ```
   User: "I need to resolve the login issue"
   Keywords: [resolve, login, issue]
   ```

2. **Search Navigation Keywords**
   ```
   mcp__serena__search_for_pattern --substring_pattern "resolve" --relative_path ".claude/templates/REGISTRY.md#navigation-keywords"
   ```

3. **Load Best Match**
   - Single match → Load handler
   - Multiple matches → Check context keywords
   - Still ambiguous → Show options
```

### Step 3: Test with Common Variations

Test cases:
1. "let's work on authentication" → start-new-work
2. "I need to fix the login bug" → fix-problem
3. "can you help debug this error" → debug
4. "search for where user auth happens" → search-code
5. "please implement the payment feature" → implement-feature

### Step 4: Create Quick Reference

Add to CLAUDE.md:
```markdown
## Navigation Quick Reference

**Not finding what you need?** Try these keywords:
- Development: work, implement, build, create
- Problems: fix, debug, error, issue
- Search: find, search, where, locate
- Files: edit, read, modify, update
- Git: commit, branch, merge, push
```

## Why This Works

1. **Leverages Existing System**: Uses current search mechanisms
2. **Incremental Improvement**: Can add keywords over time
3. **Testable**: Easy to verify improvements
4. **Fallback Safe**: Doesn't break current navigation

## Next Steps After Implementation

1. Track which keywords users actually use
2. Add missing keyword mappings
3. Consider more advanced fuzzy matching
4. Maybe create dedicated NAVIGATION.md later