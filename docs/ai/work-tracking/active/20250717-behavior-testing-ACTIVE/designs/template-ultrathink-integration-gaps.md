# Template ULTRATHINK Integration Gaps

## Critical Discovery

The ULTRATHINK format in CLAUDE.md is NOT integrated with the template system!

## Current State

### In CLAUDE.md
```markdown
Format: "Let me ultrathink about this... [S:X|W:Y|H:Z]" before any implementation
  - S = Today's session ID from SESSION.md (or VOID→conventions for proper session)  
  - W = Current work context from active/ (or VOID→workflows for optimal work)
  - H = Handler matching request (or VOID→registry for best practice)
```

### In Templates
- No mention of VOID states
- No handlers for VOID resolution
- `deploy-ultrathink` handler exists but is unrelated
- No enforcement mechanism

## Missing Pieces

### 1. VOID Resolution Handlers

Need to create in CONVENTIONS.md:
```markdown
#### Handler: resolve-session-void {#resolve-session-void}
**Triggers**: S = VOID in ULTRATHINK
**Process**: 
1. Check SESSION.md for today's entry
2. If missing, execute session-start handler
3. Return valid session ID
```

Need to create in WORKFLOWS.md:
```markdown  
#### Handler: resolve-work-void {#resolve-work-void}
**Triggers**: W = VOID in ULTRATHINK
**Process**:
1. Analyze request domain
2. Check active work folders
3. Route to appropriate workflow (start-new-work, continue-work, etc.)
4. Return valid work context
```

Need to create in REGISTRY.md:
```markdown
#### Handler: resolve-handler-void {#resolve-handler-void}
**Triggers**: H = VOID in ULTRATHINK
**Process**:
1. Extract keywords from request
2. Search REGISTRY for matches
3. Select best handler
4. Return handler reference
```

### 2. Template Awareness of ULTRATHINK

Templates need to know:
- ULTRATHINK is mandatory before any action
- How to interpret [S:W:H] values
- What to do with VOID states
- How to guide resolution

### 3. Integration Points

Each template file needs:
```markdown
## ULTRATHINK Integration

This file participates in ULTRATHINK resolution:
- S = VOID → [link to resolve-session-void]
- W = VOID → [link to resolve-work-void]  
- H = VOID → [link to resolve-handler-void]
```

## Why I Don't Use It

1. **No Connection**: Templates don't reference ULTRATHINK
2. **No Handlers**: VOID states have no resolution path
3. **No Enforcement**: Templates don't remind me to use it
4. **Parallel Systems**: ULTRATHINK in CLAUDE.md, handlers in templates - disconnected

## Solution Design

### Option 1: Add VOID Handlers (Minimal)
- Create 3 VOID resolution handlers
- Add to appropriate template files
- Update REGISTRY with entries
- Add cross-references

### Option 2: Full Integration (Better)
- Option 1 PLUS:
- Add ULTRATHINK section to each template
- Update handler format to include SWH
- Create meta-handler for ULTRATHINK itself
- Make handlers aware they're being called via H

### Option 3: Unified System (Best)
- Option 2 PLUS:
- Every handler response starts with its SWH
- Templates check for valid SWH before executing
- Invalid SWH triggers VOID resolution
- Self-reinforcing system

## Implementation Steps

1. Create VOID resolution handlers
2. Add to appropriate templates
3. Update REGISTRY
4. Add ULTRATHINK sections to templates
5. Test with real requests
6. Refine based on usage

## Expected Outcome

When I see VOID:
- I know exactly where to look
- Templates guide the resolution
- Can't proceed without fixing
- Natural enforcement through integration

This would close the loop and make ULTRATHINK truly unavoidable!