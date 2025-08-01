# Critical Issues from Template Scanner

## Missing Handlers (Priority: CRITICAL)

These handlers are referenced but don't exist. Users requesting these fall back to generic patterns.

### 1. fix-bug
- **References**: MATRICES.md line 30, REGISTRY.md line 519
- **User Triggers**: "fix bug X", "bug in Y", "there's a bug"
- **Current Behavior**: Falls back to generic patterns
- **Template Exists**: bug-fix-template exists but needs handler wrapper

### 2. debug-issue  
- **References**: MATRICES.md line 34, REGISTRY.md line 526
- **User Triggers**: "debug this", "why is X failing", "debug error"
- **Current Behavior**: No specific handler
- **Template Exists**: emergency-debug exists but needs handler wrapper

### 3. explain-code
- **References**: MATRICES.md line 39, REGISTRY.md line 533
- **User Triggers**: "explain this code", "how does X work", "what does this do"
- **Current Behavior**: Uses patterns instead of handler

### 4. code-review
- **References**: MATRICES.md line 41, REGISTRY.md line 539
- **User Triggers**: "review this code", "check for issues"
- **Current Behavior**: Routes to template, not handler
- **Template Exists**: code-review-template exists

### 5. optimize-code
- **References**: None found but common request
- **User Triggers**: "optimize this", "make faster", "improve performance"
- **Current Behavior**: No handler

### 6. create-docs
- **References**: None found but common request
- **User Triggers**: "document this", "create docs", "write documentation"
- **Current Behavior**: No handler

## Broken References (Priority: HIGH)

### Location Mismatches
- **session-start**: 
  - REGISTRY.md says → CONVENTIONS.md ✓
  - Some references say → WORKFLOWS.md ✗
  - Fix: Update all to CONVENTIONS.md#session-start

### Template vs Handler Confusion
- **bug-fix-template**: Referenced as handler but is template
- **emergency-debug**: Referenced as handler but is template
- **code-review-template**: Sometimes handler, sometimes template
- Fix: Create proper handler wrappers

## Orphaned Handlers (Priority: MEDIUM)

### checkpoint-session
- **Location**: WORKFLOWS.md line 189
- **Issue**: No triggers, no references
- **Solution**: Add triggers or remove

### measure-complexity  
- **Location**: TOOLS.md line 353
- **Issue**: Defined but never called
- **Solution**: Integrate into code analysis workflow

### format-code
- **Location**: CONVENTIONS.md line 425
- **Issue**: No incoming references
- **Solution**: Add to refactor-code workflow

## Trigger Ambiguity (Priority: MEDIUM)

### "update X" Conflicts
Multiple handlers match:
- update-todos (task management)
- edit-file (file operations)
- update-tracker (work tracking)
- update-session (session management)

**Solution**: Implement noun-based routing

### "create X" Conflicts
Multiple handlers match:
- create-component (code)
- create-file (files)
- create-todos (tasks)
- create-work-folder (tracking)

**Solution**: Analyze noun after "create"

## Quick Fixes Needed

1. Create the 6 missing handlers using handler-creator
2. Update REGISTRY.md to fix broken references
3. Add triggers to orphaned handlers
4. Implement disambiguation patterns for ambiguous triggers
5. Convert templates to handlers where needed