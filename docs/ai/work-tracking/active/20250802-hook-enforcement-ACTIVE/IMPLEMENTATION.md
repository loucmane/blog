# Hook Enforcement Implementation Plan

## Overview
Evolved from basic ULTRATHINK enforcement to comprehensive CLAUDE.md protocol integration with technical enforcement mechanisms.

## Completed Phases (1-7)
✅ **Phase 1-7**: Basic hook system implemented and deployed
- ULTRATHINK enforcement working with 100% effectiveness
- Template system reorganized with 69 handlers properly categorized
- Hook paths fixed with $CLAUDE_PROJECT_DIR for robustness
- CLAUDE.md analysis completed identifying key gaps

## Current Status: Phase 8 - Deep Integration

### CRITICAL IMPROVEMENTS IDENTIFIED
Based on CLAUDE_MD_IMPROVEMENT_ANALYSIS.md, we must evolve from psychology-based to technically-enforced compliance.

## Phase 8: Refinement Implementation (Current)

### Phase 8.1: S:W:H:E Format Validation 🔴 CRITICAL
**Goal**: Validate ULTRATHINK format programmatically

#### Implementation Details
```python
# In pre_tool_use.py, add:
def validate_swhe_format(ultrathink_statement):
    """
    Validate S:W:H:E format:
    - S: Session ID (YYYYMMDD or VOID)
    - W: Work context (folder name or activity)
    - H: Handler name (must exist under templates/handlers or engine)
    - E: Evidence (steps/"criteria")
    """
    pattern = r'\[S:([^|]+)\|W:([^|]+)\|H:([^|]+)\|E:([^\]]+)\]'
    match = re.match(pattern, ultrathink_statement)
    
    if not match:
        return False, "Invalid S:W:H:E format"
    
    s, w, h, e = match.groups()
    
    # Validate H against handler cache
    if h != 'searching' and h != 'VOID':
        if not handler_exists(h):
            return False, f"Handler '{h}' not found in templates/registry/"
    
    # Validate E format
    if not validate_evidence(e):
        return False, "Evidence must be steps/\"criteria\" format"
    
    return True, "Valid"
```

#### Tasks
- [ ] Implement S:W:H:E regex validation
- [ ] Add handler existence checking against HandlerCache
- [ ] Validate evidence format (steps/"criteria")
- [ ] Create helpful error messages for each validation failure
- [ ] Test with various valid/invalid formats

### Phase 8.2: Handler Verification System
**Goal**: Ensure H: values reference real handlers

#### Implementation Details
```python
# Enhance handler_cache.py:
class HandlerCache:
    def validate_handler(self, handler_name):
        """Check if handler exists and return its metadata"""
        if handler_name in self.handlers:
            return True, self.handlers[handler_name]
        
        # Fuzzy match for typos
        similar = self.find_similar(handler_name)
        if similar:
            return False, f"Did you mean: {similar}?"
        
        return False, "Handler not found"
```

#### Tasks
- [ ] Enhance HandlerCache with validation methods
- [ ] Add fuzzy matching for typo correction
- [ ] Cache handler metadata (triggers, location)
- [ ] Integrate with pre_tool_use.py validation

### Phase 8.3: VOID Resolution Mapping
**Goal**: Clear paths for all VOID states

#### Implementation Details
```python
void_resolution_map = {
    'S:VOID': {
        'handler': 'resolve-session-void',
        'location': 'handlers/orchestrators/resolve-session-void.md',
        'action': 'Initialize session with date'
    },
    'W:VOID': {
        'handler': 'resolve-work-void', 
        'location': 'handlers/operators/workflow/resolve-work-void.md',
        'action': 'Determine work context from request'
    },
    'H:VOID': {
        'handler': 'resolve-handler-void',
        'location': 'templates/handlers/operators/workflow/resolve-handler-void.md',
        'action': 'Search for matching handler'
    }
}
```

#### Tasks
- [ ] Create comprehensive VOID resolution map
- [ ] Add circular dependency detection
- [ ] Implement automatic resolution suggestions
- [ ] Test all VOID state paths

### Phase 8.4: Tool Selection Enforcement
**Goal**: Validate correct tool usage per CLAUDE.md matrices

#### Implementation Details
```python
tool_selection_matrix = {
    'search_code': {'must_use': 'mcp__serena__find_symbol', 'never': 'grep'},
    'edit_file': {'must_use': 'Edit|MultiEdit', 'never': 'Serena'},
    'timestamp': {'must_use': 'date command', 'never': 'manual typing'}
}

def validate_tool_selection(tool_name, context):
    """Ensure correct tool per selection matrix"""
    if context in tool_selection_matrix:
        rules = tool_selection_matrix[context]
        if tool_name in rules['never']:
            return False, f"Use {rules['must_use']} instead"
    return True, "Valid tool selection"
```

#### Tasks
- [ ] Implement tool selection matrix from TOOLS.md
- [ ] Add context detection for tool validation
- [ ] Create helpful suggestions for wrong tools
- [ ] Test with common tool misuse patterns

## Phase 9: Protocol Enforcement (Next Week)

### Phase 9.1: PRE-ULTRATHINK Validation
**Goal**: Enforce the required sequence before ULTRATHINK

#### Tasks
- [ ] Track if handler was actually searched
- [ ] Verify handler comprehension (step extraction)
- [ ] Validate H:searching→H:found transition
- [ ] Block premature ULTRATHINK outputs

### Phase 9.2: Evidence Quality Scoring
**Goal**: Ensure meaningful evidence in E: field

#### Tasks
- [ ] Score evidence quality (generic vs specific)
- [ ] Require minimum evidence detail
- [ ] Track evidence patterns for improvement

### Phase 9.3: Protocol Echo Implementation
**Goal**: Activate Layer 4 protocol references

#### Tasks
- [ ] Require protocol anchor references
- [ ] Validate anchor existence in BEHAVIORS.md
- [ ] Track protocol compliance patterns

## Phase 10: Deep Integration (Week 3)

### Phase 10.1: Bi-directional Communication
**Goal**: Hooks and CLAUDE.md work together

#### Tasks
- [ ] Hooks read CLAUDE.md for latest protocols
- [ ] CLAUDE.md updates trigger hook reloads
- [ ] Create feedback loop for improvements

### Phase 10.2: Comprehensive Blocking
**Goal**: Full technical enforcement

#### Tasks
- [ ] Block all protocol violations
- [ ] Provide educational corrections
- [ ] Track violation patterns
- [ ] Generate improvement reports

## Success Metrics

### Current (Phases 1-7)
- ✅ Zero ULTRATHINK reminders needed
- ✅ 100% blocking effectiveness
- ✅ 0% false positives
- ✅ ~100-200ms overhead acceptable

### Target (Phases 8-10)
- [ ] S:W:H:E validation rate: 100%
- [ ] Handler accuracy: 95%+
- [ ] VOID resolution success: 100%
- [ ] Tool selection compliance: 90%+
- [ ] Protocol echo adoption: 80%+

## Risk Mitigation

### Performance Impact
- Cache all validations aggressively
- Async validation where possible
- Fail open for non-critical checks

### User Experience
- Always provide helpful suggestions
- Never block without explanation
- Progressive enhancement (warn→block)

### Maintenance Burden
- Auto-generate from REGISTRY.md
- Self-documenting error messages
- Comprehensive test coverage

## Next Steps

1. **Immediate**: Start Phase 8.1 (S:W:H:E validation)
2. **This Week**: Complete Phase 8 (all refinements)
3. **Next Week**: Begin Phase 9 (protocol enforcement)
4. **Week 3**: Full integration (Phase 10)
5. **Week 4**: Small-team optimizations (Phase 11)

## Notes

- Each phase builds on previous work
- Rollback plan: Disable individual validations via config
- Success = Technical enforcement replaces manual reminders

## Phase 11: Small-Team Optimizations (Lightweight & Practical)

### Goals
- Keep enforcement strong but easy to operate for a small team

### Items
1. Level Toggle Scripts
   - `enforce-set <soft|stable|strict>`: Update `.claude/settings.json` and print effective mode
   - `enforce-status`: Show current mode, `soft_until` (if any), last block/escape counts

2. Minimal Registry Index
   - Generate `templates/registry/index.json` (handler id, path, tags)
   - Use to improve hint suggestions and search speed

3. One-Click ULTRATHINK Helper
   - Output a ready S:W:H:E skeleton with today’s S and inferred W; editable H

4. Legacy Sweep (Manual/Pre-Release)
   - Report-only script to grep live guides for deprecated references (`REGISTRY.md`, `enhanced_enforcement.py`)

### Acceptance Criteria
- Scripts exist and are documented
- `enforce-status` shows correct mode and session softening
- Hints use registry index when present
- Sweep report is clean on live guides