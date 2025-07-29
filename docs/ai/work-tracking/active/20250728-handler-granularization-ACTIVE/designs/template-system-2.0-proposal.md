# Template System 2.0 Proposal

## Core Philosophy
**Evolution, not revolution.** Keep what works, fix what doesn't, connect everything.

## 8 Key Enhancements (Small Changes, Big Impact)

### 1. Handler Prerequisites (Structural Enforcement)
Add to each handler:
```yaml
Prerequisites:
  - check: conventions#naming-rules
  - verify: tests-passing
  - require: git-clean-status
```
**Impact**: Can't skip important checks - system enforces them

### 2. Tool Manifests (Declare Upfront)
```yaml
Tools Required:
  - serena: find_symbol, search_pattern
  - bash: date, git status
  - edit: multifile
```
**Impact**: Know all tools needed before starting

### 3. Related Sections (Web of Connections)
```yaml
Related:
  conventions: [naming, commit-message]
  tools: [serena-search, git-operations]
  common-next: [run-tests, commit-changes]
  common-errors: [see behaviors#file-ops]
```
**Impact**: Everything connected, no more island hopping

### 4. FLOWS.md (Document Common Sequences)
New file with just sequences:
```markdown
## Bug Fix Flow
1. reproduce-issue → 
2. search-codebase →
3. analyze-cause →
4. implement-fix →
5. test-fix →
6. commit-changes

When to use: User reports unexpected behavior
Time estimate: 15-30 minutes
Success rate: 85%
```
**Impact**: Implicit knowledge becomes explicit

### 5. Split CLAUDE.md
From monolith to focused files:
- `ENGINE.md` - Just execution logic
- `GUIDE.md` - User documentation  
- `FLOWS.md` - Common sequences
**Impact**: Cleaner, more maintainable

### 6. Enhanced REGISTRY.md (Multiple Indexes)
Instead of one list:
```markdown
## By Frequency
1. edit-file (used 50x/day)
2. search-code (used 30x/day)
3. commit-changes (used 20x/day)

## By Intent
Fix something: [debug-issue, analyze-error, fix-bug]
Build something: [create-component, implement-feature]
Find something: [search-code, find-symbol, grep-pattern]

## By Phase
Planning: [create-todos, design-approach]
Implementing: [edit-file, create-component]
Testing: [run-tests, validate-changes]
```
**Impact**: Find handlers how you think

### 7. Checkpoints (Pauseable Flows)
```yaml
Checkpoint: bug-reproduced
Context Saved:
  - error_message: "Login timeout after 30s"
  - test_case: "test/auth/login.test.js:45"
  - hypothesis: "Token expiry issue"
Resume With: analyze-root-cause
```
**Impact**: Complex work becomes resumable

### 8. Metrics Sections (Self-Improvement)
```yaml
Metrics:
  avg_time: 2 minutes
  success_rate: 95%
  common_failures:
    - "Permission denied" (15%)
    - "File not found" (5%)
  last_updated: 2025-07-28
```
**Impact**: Data-driven optimization

## What Stays The Same
- All current handlers remain
- File structure unchanged
- S:W:H:E format (just more useful)
- Tool selection matrix
- Existing workflows

## Migration Path
1. **Phase 1**: Add FLOWS.md and split CLAUDE.md
2. **Phase 2**: Add Prerequisites to top 20 handlers
3. **Phase 3**: Add Related sections progressively
4. **Phase 4**: Implement checkpoints and metrics

## Example: How It Works Together

User: "Fix the login bug"

System 2.0 Experience:
1. **REGISTRY** → By Intent → "Fix something" → `debug-issue`
2. **Handler** shows Prerequisites → Check git status first
3. **Handler** shows Tools Required → Load all needed tools
4. **FLOWS.md** → Shows bug-fix sequence 
5. **Related** → Links to conventions, next steps
6. **Checkpoint** → Can pause after reproducing
7. **Metrics** → "This usually takes 15 minutes"

## Benefits
- **Connected**: No more jumping between files blindly
- **Enforced**: Prerequisites prevent skipping steps
- **Discoverable**: Multiple ways to find what you need
- **Resumable**: Complex work with checkpoints
- **Optimizable**: Metrics show what needs improvement
- **Maintainable**: Split files, clear responsibilities

## This is "Cutting Edge" Because
- **Self-documenting**: System explains itself
- **Self-enforcing**: Can't skip important steps
- **Self-improving**: Metrics drive optimization
- **User-centric**: Multiple discovery paths
- **Future-proof**: Versioning enables evolution
- **Elegant**: Simple additions, powerful results

## What We DON'T Need
- New file formats
- Complex architectures  
- Breaking changes
- Heavy frameworks
- Complete rewrites

## Next Steps for Discussion
1. Which enhancement to implement first?
2. Any missing connections you see?
3. Concerns about complexity?
4. Additional ideas to consider?