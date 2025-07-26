# Template Updates for Session Folder Migration

## Overview
Found 100+ references to SESSION.md across templates. Need systematic updates.

## Update Strategy

### 1. References to Keep As-Is
These still make sense with SESSION.md as index:
- "read memory X and SESSION.md" → Still valid (reads index + current)
- "Update SESSION.md progress" → Still updates current session
- "SESSION.md format" → Format applies to individual sessions

### 2. References to Clarify
Add notes that SESSION.md now refers to current session:
- "SESSION.md lifecycle" → "Session lifecycle (current session)"
- "SESSION.md exists" → "Current session exists"

### 3. References to Update
These need explicit changes:
- "at TOP of SESSION.md" → "create new session file"
- "Previous SESSION.md read" → "Previous sessions checked"
- "SESSION.md fully updated" → "Current session fully updated"

## Files to Update (Priority Order)

### 1. WORKFLOWS.md (45 references)
**Key Changes:**
- session-start handler: Create new session file, update index
- session-end handler: Close current session properly
- Activation examples: Still work with "read SESSION.md"

### 2. CONVENTIONS.md (17 references)
**Key Changes:**
- Add session file naming: `YYYY-MM-DD-description.md`
- Archive rules: Move to `sessions/archive/YYYY-MM/`
- SESSION.md structure: Now applies to individual files

### 3. BEHAVIORS.md (11 references)
**Key Changes:**
- Session compaction: Now archives old sessions
- Timestamp checking: Still applies to current session
- Session boundaries: New file creation behavior

### 4. REGISTRY.md (6 references)
**Key Changes:**
- session-start: Creates new file + updates index
- session-update: Works on current session
- Add: session-switch handler for changing sessions

### 5. Other Files (21 references across 4 files)
- TOOLS.md: Minor clarifications
- PATTERNS.md: Update routing for sessions
- MATRICES.md: Update decision matrix
- USER-GUIDE.md: Explain new structure

## Implementation Plan

### Phase 1: Core Handler Updates
1. Update session-start in WORKFLOWS.md
2. Add session file creation logic
3. Update index management

### Phase 2: Convention Updates
1. Add naming conventions
2. Document archive rules
3. Update format guidelines

### Phase 3: Behavior Updates
1. Session switching logic
2. Archive automation
3. Search patterns

### Phase 4: Testing
1. Create test session
2. Verify search works
3. Test continuity

## Key Principle
Most references stay the same! "SESSION.md" conceptually means "the session system" which now includes index + current session. Only mechanical changes needed for file creation/management.