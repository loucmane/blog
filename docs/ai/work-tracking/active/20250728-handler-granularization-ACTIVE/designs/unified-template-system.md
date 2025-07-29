# Unified Template System Design

## Core Insight
The template system doesn't need revolution - it needs evolution. The pieces are good but disconnected. We need to create flow without complexity.

## Four-Layer Solution

### Layer 1: Atomic Handlers (Granularization)
**What**: Break multi-step handlers into single operations
**Why**: Easier to understand, test, and chain
**Example**: 
- Old: `start-new-work` (6 steps)
- New: `create-work-folder`, `init-tracking-files`, `create-todos`, etc.

### Layer 2: Flow Documentation 
**What**: Add "Common Flows" section to CLAUDE.md
**Why**: Shows how to chain handlers for complex tasks
**Example**:
```yaml
Bug Fix Flow:
1. detect-bug-pattern → 
2. search-related-code →
3. analyze-root-cause →
4. implement-fix →
5. write-tests →
6. validate-fix →
7. commit-changes
```

### Layer 3: Next Steps in Handlers
**What**: Add "Common Next Steps" to each handler
**Why**: Guides natural progression
**Example**:
```yaml
Handler: implement-fix
...
Success: Code changed
Next Steps:
- Run tests → test-implementation
- Check style → validate-code-style  
- Commit → commit-changes
- Update docs → update-documentation
```

### Layer 4: Journey Tracking
**What**: Enhance S:W:H:E to show flow progress
**Why**: Makes execution path visible
**Format Options**:

Option A - Flow Log:
```
[S:20250128|W:bug-fix|F:bug-flow|Step:1/7|H:detect-bug-pattern|E:1/"Pattern found"]
[S:20250128|W:bug-fix|F:bug-flow|Step:2/7|H:search-related-code|E:1/"3 files found"]
```

Option B - Journey Context:
```
Journey: Bug Fix Flow (Step 3 of 7)
Current: [S:20250128|W:bug-fix|H:analyze-root-cause|E:1/"Cause identified"]
Next: implement-fix
```

## Implementation Strategy

### Phase 1: Document Flows (Quick Win)
1. Add "Common Flows" to CLAUDE.md
2. Document 10 most common journeys
3. Start using flow references

### Phase 2: Add Next Steps (Medium)
1. Update each handler with "Next Steps"
2. Create cross-references
3. Test navigation

### Phase 3: Granularize Handlers (Longer)
1. Start with most-used handlers
2. Create atomic versions
3. Update flows to use atomic handlers

### Phase 4: Enhance Tracking (Final)
1. Implement journey tracking
2. Update S:W:H:E format
3. Make flows visible

## Example: Unified Bug Fix Experience

### User Says: "Fix the login bug"

### System Response:
```
I'll help you fix the login bug. Let me follow the bug fix flow...

Journey: Bug Fix Flow
[S:20250128|W:login-bug|F:bug-fix|Step:1/7|H:create-work-folder|E:1/"Folder created"]

✓ Created work folder: 20250128-login-bug-ACTIVE

[Step:2/7|H:gather-bug-info|E:1/"Info collected"]
What error are you seeing? [User provides details]

[Step:3/7|H:search-error-pattern|E:1/"Found in auth.js:45"]
Found error pattern in authentication module...

[Step:4/7|H:analyze-root-cause|E:1/"Missing null check"]
Root cause: Missing null check for user session...

[Step:5/7|H:implement-fix|E:1/"Code updated"]
Fixed by adding session validation...

[Step:6/7|H:run-tests|E:1/"All passing"]
Tests confirm fix works...

[Step:7/7|H:commit-changes|E:1/"Committed"]
Changes committed with message: "fix: add null check for user session in login"

✓ Bug Fix Flow Complete (7/7 steps)

Next steps available:
- Create PR → create-pull-request
- Update changelog → update-changelog
- Deploy to staging → deploy-staging
```

## Benefits

1. **For Users**:
   - Clear progress through complex tasks
   - Know what comes next
   - Can jump to any step

2. **For System**:
   - Atomic handlers easier to maintain
   - Flows document best practices
   - Journey tracking shows execution

3. **For S:W:H:E**:
   - More precise (atomic handlers)
   - More context (flow tracking)
   - Better evidence (step progress)

## Key Design Principles

1. **Preserve Simplicity**: Don't over-engineer
2. **Incremental Enhancement**: Each layer adds value independently
3. **Backward Compatible**: Existing handlers still work
4. **User-Centric**: Focus on user journey, not system architecture
5. **Visible Progress**: Always show where we are and where we're going

## What This Solves

1. **Disconnection**: Files now flow together via journeys
2. **Discovery**: Next steps guide naturally
3. **Granularity**: Atomic handlers for precision
4. **Context**: Journey tracking maintains flow state
5. **Learning**: System teaches through use

## What We Don't Need

1. Complex routing engines
2. New file formats
3. Breaking changes
4. Heavy frameworks
5. Hidden magic

## Next Actions

1. Create "Common Flows" content
2. Pick 3 handlers to add "Next Steps"
3. Prototype journey tracking format
4. Test with real bug fix scenario
5. Iterate based on usage

This design creates a connected, flowing system while keeping the simplicity that makes the templates valuable.