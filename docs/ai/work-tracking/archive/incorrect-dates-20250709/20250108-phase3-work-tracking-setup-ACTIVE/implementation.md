# Work Tracking System Setup - Implementation Plan

## Purpose
Implement a structured system for organizing all work-related documentation (trackers, implementations, findings, etc.) to prevent lost work and circular efforts.

## Implementation Steps

### Step 1: Create Directory Structure
```bash
docs/ai/work-tracking/
├── active/                      # Current work in progress
├── completed/                   # Finished work
│   └── 2025/
│       ├── 01-january/
│       ├── 02-february/
│       └── ...
├── blocked/                     # Stuck work
├── templates/                   # Consistency templates
├── archive/                     # Old work (6+ months)
└── INDEX.md                     # Master tracking file
```

### Step 2: Create Templates

Each template should include:
- Purpose section
- Standard headings
- Placeholders for common content
- Instructions for use

Templates needed:
1. `tracker-template.md` - Progress tracking
2. `implementation-template.md` - Planning and approach
3. `findings-template.md` - Discoveries and insights
4. `decisions-template.md` - Rationale for choices
5. `memory-refs-template.md` - Related memories
6. `handoff-template.md` - Next session instructions

### Step 3: Create INDEX.md

Format:
```markdown
# Work Tracking Index

## Active Work
| Date | Phase | Topic | Status | Description |
|------|-------|-------|--------|-------------|
| 20250108 | phase3 | work-tracking-setup | ACTIVE | Creating work tracking system |
| 20250108 | phase3 | claude-new-review | ACTIVE | Deep review of CLAUDE-NEW.md |

## Recently Completed (Last 30 days)
[Table format]

## Blocked Work
[Table format with block reason]
```

### Step 4: Integration Updates

#### WORKFLOWS.md
Add section after "Standard Development Workflow":
```markdown
### Work Documentation
All significant work requires proper tracking:

1. **Create work folder**: `/docs/ai/work-tracking/active/[yyyymmdd]-[phase]-[topic]-ACTIVE/`
2. **Use all 6 core files**:
   - tracker.md - Progress and status
   - implementation.md - Plan and approach
   - findings.md - Discoveries
   - decisions.md - Rationale
   - memory-refs.md - Related memories
   - handoff.md - Next session guide
3. **Update INDEX.md** with new entry
4. **Link from SESSION.md** to active work
5. **When complete**: Change -ACTIVE to -DONE, move to completed/
```

#### CLAUDE-NEW.md
Update Quick Navigation section:
```markdown
### Active Work & Documentation
- **Current Work** → `/docs/ai/work-tracking/active/`
- **Work Index** → `/docs/ai/work-tracking/INDEX.md`
- **Work Templates** → `/docs/ai/work-tracking/templates/`
- **Completed Work** → `/docs/ai/work-tracking/completed/`
```

#### CONVENTIONS.md
Add to documentation standards:
```markdown
### Work Tracking Conventions
- **Folder naming**: `[yyyymmdd]-[phase/sprint]-[topic]-[STATUS]/`
- **Status values**: ACTIVE, DONE, BLOCKED
- **Core files**: Always create all 6 (see templates)
- **Completion**: Update status and move to completed/
- **Blocking**: Move to blocked/ with reason in tracker
```

### Step 5: Memory Naming Reform

Implement new convention:
- Format: `[yyyymmdd]-[type]-[brief-topic]`
- Types: session, feature, lesson, fix, review
- Topics: 2-3 words maximum
- Example: `20250108-session-template-review`

### Step 6: Migration Strategy

For existing files:
1. Create inventory of all existing trackers/implementations
2. Group by related work
3. Create new folders with proper naming
4. Move files maintaining git history
5. Update any references
6. Archive very old work

## Success Criteria
- [ ] Directory structure created and in use
- [ ] Templates created and accessible
- [ ] Current work using new system
- [ ] Documentation updated in 3 key files
- [ ] INDEX.md maintaining active status
- [ ] Team understanding new system

## Rollout Plan
1. Create structure (immediate)
2. Use for current review work (test)
3. Update documentation (today)
4. Announce change in SESSION.md
5. Gradual migration of old files

## Risk Mitigation
- Keep old file locations temporarily
- Document migration in INDEX.md
- Clear instructions in templates
- Practice with current work first