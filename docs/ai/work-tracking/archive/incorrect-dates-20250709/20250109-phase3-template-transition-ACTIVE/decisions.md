# Template System Transition - Decision Record

## Context
User wants to test the new template system in real usage rather than continuing theoretical analysis. Need safe, reversible deployment.

## Decisions Made

### 1. Keep Both Systems Accessible
**Decision**: Maintain both CLAUDE-OLD.md and active CLAUDE.md
**Rationale**: Enables quick comparison and instant rollback
**Alternatives Considered**: 
- Delete old system - Rejected: Too risky
- Hide in subfolder - Rejected: Slower access
**Trade-offs**: Uses more root directory space but maximizes flexibility

### 2. Use Shell Scripts for Switching
**Decision**: Create .claude/switch-to-*.sh scripts
**Rationale**: One command switching, no manual renaming
**Alternatives Considered**:
- Manual instructions - Rejected: Error prone
- Git branches - Rejected: Too complex
- Symlinks - Rejected: Compatibility issues
**Trade-offs**: Requires bash but provides consistency

### 3. Archive with Timestamp
**Decision**: Create timestamped backup in .claude/archive/
**Rationale**: Clear rollback point, preserves history
**Alternatives Considered**:
- Git only - Rejected: Want explicit backup
- No archive - Rejected: User wants safety
**Trade-offs**: Disk space for peace of mind

### 4. Test Immediately
**Decision**: Deploy first, refine based on findings
**Rationale**: User explicitly wants practical testing
**Alternatives Considered**:
- More planning - Rejected: "we cant really see the friction points until we try it"
- Gradual rollout - Rejected: All or nothing clearer
**Trade-offs**: May find issues but that's the goal

### 5. Create Testing Work Folder
**Decision**: Separate folder for tracking friction points
**Rationale**: Keeps transition and testing concerns separate
**Alternatives Considered**:
- Same folder - Rejected: Different lifecycle
- No tracking - Rejected: Loses valuable feedback
**Trade-offs**: More folders but better organization

## Guiding Principles
- Safety first - easy rollback essential
- Practical testing over theoretical perfection
- User feedback drives improvements
- Document everything for learning

## Impact Analysis
- **Short-term**: New workflow to learn
- **Long-term**: Better system based on real usage
- **Dependencies**: All template files must be copied

## Review Notes
- **Review Date**: After first full session
- **Success Criteria**: Can identify real friction points
- **Adjustment Triggers**: Major blocking issues