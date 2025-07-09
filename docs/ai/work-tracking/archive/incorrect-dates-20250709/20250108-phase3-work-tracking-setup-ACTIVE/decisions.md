# Work Tracking System Setup - Decisions

## Decision Record

### 1. Paired Folder Structure
**Decision**: Use paired folders with all related files together  
**Rationale**: 
- Keeps tracker + implementation + findings together
- No hunting across directories for related work
- Self-contained work packages
- Easy to archive complete work

**Rejected Alternatives**:
- Separate directories for trackers vs implementations (too much navigation)
- Single files with naming convention (can't scale with multiple documents)
- Database/tool-based tracking (adds complexity)

### 2. Six Core Files
**Decision**: Every work folder should have 6 standard files  
**Rationale**:
- tracker.md - Shows WHERE we are (progress)
- implementation.md - Shows HOW we're doing it (approach)
- findings.md - Shows WHAT we discovered (insights)
- decisions.md - Shows WHY we made choices (rationale)
- memory-refs.md - Shows CONTEXT from past (continuity)
- handoff.md - Shows WHAT'S NEXT (session bridge)

Together these tell the complete story for any future session.

### 3. Status in Folder Name
**Decision**: Include -ACTIVE, -DONE, or -BLOCKED in folder name  
**Rationale**:
- Immediately visible without opening files
- Easy to scan active work
- Clear when something is stuck
- Simple to update (rename folder)

**Rejected Alternative**: 
- Status only in tracker file (requires opening to check)

### 4. Date-Phase-Topic Naming
**Decision**: `[yyyymmdd]-[phase]-[topic]-[STATUS]/`  
**Rationale**:
- Date first for chronological sorting
- Phase/sprint for project context
- Topic for quick identification
- STATUS for current state

**Example**: `20250108-phase3-claude-new-review-ACTIVE/`

### 5. Monthly Completed Organization
**Decision**: Organize completed work by year/month  
**Rationale**:
- Not too granular (daily) or too broad (yearly)
- Matches typical project cycles
- Easy to navigate recent work
- Natural archiving boundaries

### 6. Separate Memory References
**Decision**: Track memory connections in dedicated memory-refs.md  
**Rationale**:
- Memories are external to work folders
- May have multiple relevant memories
- Memories might be renamed/reorganized
- Keeps clear separation of concerns

### 7. Templates for Consistency
**Decision**: Create and maintain templates for all 6 core files  
**Rationale**:
- Ensures consistent structure
- Reduces decision fatigue
- Speeds up creation
- Documents expectations

### 8. Integration Over Migration
**Decision**: Start using immediately, migrate gradually  
**Rationale**:
- Immediate value from new work
- Avoid big-bang migration risk
- Learn and adjust as we go
- Preserve git history

## Principles Behind Decisions

1. **Simplicity**: Easy to understand and follow
2. **Completeness**: Captures full context
3. **Discoverability**: Easy to find work
4. **Continuity**: Supports session handoffs
5. **Scalability**: Works for 10 or 1000 items
6. **Flexibility**: Adapts to different work types