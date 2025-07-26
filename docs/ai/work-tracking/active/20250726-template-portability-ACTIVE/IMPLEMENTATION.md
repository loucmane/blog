# Implementation Details

## Changes Made

### 1. Work Folder Rule (CLAUDE.md line 20)
```markdown
- In work folders (/work-tracking/active/*): Always required
```
- Location: After "Context:" line in ULTRATHINK section
- Impact: 100% coverage for active work folders

### 2. Work Activity Triggers (CLAUDE.md line 43)
```markdown
- Work activities: "plan", "discuss", "design", "document", "walk through"
```
- Location: Added to Layer 2 implicit triggers
- Impact: Catches work activities anywhere in project

## Testing Plan
1. Test planning discussion in root → Should trigger ULTRATHINK
2. Test casual chat in work folder → Should still trigger (by design)
3. Test work transition commands → Need to implement
4. Test existing workflows → Should work unchanged

## Files Created
- `/designs/` - 4 design documents exploring approaches
- `/code/` - 5 implementation examples (not all used)
- Core tracking files for work folder

## Integration Points
- execute-ultrathink pattern reads pwd for context
- Handlers need to manage directory changes
- Casual mode transition still needs implementation

---

## Session Folders Migration Plan

### Phase 0: Protocol Enforcement (URGENT)
Add automatic protocol checking to CLAUDE.md to prevent skipping conventions.

**Why Critical:**
- Currently forgetting to check templates before actions
- User constantly reminding about proper procedures
- Need "cannot proceed without checking" enforcement

**Implementation:**
- Add new section to CLAUDE.md after ULTRATHINK
- Make protocol checking mandatory before ANY action
- Include specific checks for: file structures, conventions, templates

### Phase 1: Template Preparation
Update templates to support session folder structure.

**Templates to Update:**
1. **CLAUDE.md** - Change SESSION.md references to support folders
2. **WORKFLOWS.md** - Update session-start/end handlers
3. **CONVENTIONS.md** - Add session file naming rules
4. **PATTERNS.md** - Update session management patterns

**Key Changes:**
- SESSION.md becomes index (< 1KB)
- Individual sessions in `sessions/YYYY-MM-DD-description.md`
- Serena handles cross-session search
- Archive old sessions to `sessions/archive/`

### Phase 2: Migration Execution
1. Parse current SESSION.md by headers
2. Create individual session files
3. Generate new index SESSION.md
4. Update all references
5. Test functionality

### Phase 3: Validation
- Test session creation/closure
- Verify search works
- Check memory integration
- Validate work tracking

---

## Template Portability Plan (Full Scope)

### Objective
Make the Claude Template System project-agnostic and idempotent for use across all projects.

### Key Requirements
1. **Project Agnostic** - Works in any codebase
2. **Idempotent** - Safe to run multiple times
3. **Preservation** - Doesn't overwrite existing customizations
4. **Discovery** - Easy to install and update

### Design Considerations

#### 1. Installation Mechanism
- Script or command to install templates
- Check for existing .claude/ folder
- Merge vs replace logic
- Backup existing files

#### 2. Project-Specific Sections
- CLAUDE.md project instructions
- Memory files
- Work tracking folders
- Custom handlers

#### 3. Core Template Files
- REGISTRY.md, WORKFLOWS.md, TOOLS.md
- CONVENTIONS.md, PATTERNS.md
- BUILDING-BETTER.md, MATRICES.md
- BEHAVIORS.md, USER-GUIDE.md

#### 4. Versioning Strategy
- Template version tracking
- Update mechanism
- Changelog for templates

#### 5. Customization Points
- Project-specific handlers
- Custom conventions
- Additional matrices

### Discussion Topics
1. Installation approach (script, git submodule, npm package?)
2. Update strategy (how to merge updates with customizations)
3. Project detection (how to know what type of project)
4. Default configurations per project type
5. Distribution mechanism