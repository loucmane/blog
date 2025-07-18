# DDII: Work Tracking System Redesign

## Define

### Current State (Confusing)
- `tracker.md` = General progress log (timestamps + everything)
- `implementation.md` = Mix of plan + checkboxes + "what we'll do"
- `findings.md` = Discoveries and patterns
- `decisions.md` = Decision log with rationale
- `memory-refs.md` = Related memories
- `handoff.md` = Session transition info

### Problems
1. **Role confusion**: Implementation.md is both plan AND results
2. **Tracker bloat**: Everything goes in tracker (not focused)
3. **No clear "what we built"**: Lost in the logs
4. **Checkbox tracking**: Currently in implementation.md, should be tracker?

### User Requirements
- Tracker should have checkboxes to tick off
- Concise structure
- Clear file purposes
- Organized subfolders

## Design

### Option A: Task-Focused System
```
Root Files:
- tasks.md          # Checkbox list of tasks (what tracker should be)
- log.md            # Timestamped progress entries
- results.md        # What we actually built/changed
- findings.md       # Discoveries and insights
- decisions.md      # Key decisions with rationale  
- handoff.md        # Session transition

Subfolders:
- plans/            # Implementation plans, roadmaps
- designs/          # DDII, analysis, architecture
- archives/         # Old versions
```

### Option B: Dual-Track System
```
Root Files:
- plan.md           # The implementation plan
- tracker.md        # Tracks the plan (checkboxes)
- changelog.md      # What actually changed
- findings.md       # Test results, discoveries
- decisions.md      # Decision log
- session.md        # Session progress log

Subfolders: (same as above)
```

### Option C: Simplified System (Recommended)
```
Root Files (5 only):
- README.md         # Overview + current status
- TASKS.md          # [ ] Checkbox task list
- PROGRESS.md       # Timestamped log of work
- FINDINGS.md       # Key discoveries/results
- DECISIONS.md      # Important decisions made

Subfolders:
- design/           # All design docs, DDII, analysis
- code/             # Actual code changes, diffs
- archive/          # Old iterations
```

## Implement

### Proposed New Structure (Clean & Clear)

#### Root Files (5 core files)

**1. README.md**
```markdown
# Behavior Testing Work

## Status: Testing checkpoint enforcement

## Current Focus
Testing Development Mode Checkpoint with various triggers

## Progress: 4/15 behaviors tested

## Key Findings
- Checkpoint works for explicit keywords
- Missing implicit trigger detection
- Need enhanced trigger system
```

**2. TASKS.md**
```markdown
# Task List

## Phase 1: Setup ✓
- [x] Create coverage matrix
- [x] Set up work folder
- [x] Design enforcement mechanism

## Phase 2: Implementation 
- [x] Add checkpoint to CLAUDE.md
- [ ] Add implicit triggers
- [ ] Test 5 development requests
- [ ] Measure compliance rate

## Phase 3: Testing
- [ ] Test remaining 11 behaviors
- [ ] Document enforcement gaps
- [ ] Refine based on results
```

**3. PROGRESS.md**
```markdown
# Progress Log

## 2025-07-18

### 13:47 - Checkpoint Success
First successful trigger! Used "fix" keyword.

### 14:10 - Folder Reorganized  
Created subfolder structure for better organization.

### 14:30 - System Redesign
DDII'd new work tracking structure.
```

**4. FINDINGS.md**
```markdown
# Key Findings

## What Works
- Explicit keyword detection (fix, implement)
- Checkpoint executes when triggered

## What's Missing  
- Implicit triggers (questions, problems)
- Documentation work detection
- Context persistence
```

**5. DECISIONS.md**
```markdown
# Decision Log

## Use 5-file system (2025-07-18)
**Decision**: Simplify to 5 core files
**Rationale**: 6 files too many, roles unclear
**Result**: Cleaner, focused structure
```

## Iterate

### Benefits of New System
1. **Clear purposes**: Each file has ONE job
2. **README overview**: See status at a glance
3. **TASKS.md**: Proper checkbox tracking (what user wanted)
4. **PROGRESS.md**: Clean timeline (no clutter)
5. **ALL CAPS**: Makes core files stand out

### Migration Path
1. Merge tracker.md → PROGRESS.md (timeline only)
2. Extract tasks from implementation.md → TASKS.md
3. Create README.md with current status
4. Keep FINDINGS.md and DECISIONS.md (just capitalize)
5. Archive current files we're replacing

### When to Use Subfolders
- `design/` - Any design work, DDII, analysis
- `code/` - Actual code snippets, implementations
- `archive/` - Superseded documents

What do you think of this simplified 5-file system?