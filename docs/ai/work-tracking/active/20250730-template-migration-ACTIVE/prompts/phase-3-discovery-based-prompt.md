# Phase 3: Full Session Migration - Discovery-Based Approach

## Your Mission
Complete the migration from SESSION.md to sessions/ directory. This requires understanding the system deeply before making changes.

## Prerequisites
- Phase 2 complete (5 handlers updated)
- Verify handlers are creating sessions in sessions/ directory
- Confirm SESSION.md is no longer being written to

## Critical Discovery Phase

### 1. Understand Current SESSION.md Usage
```bash
# Find ALL references to SESSION.md
grep -r "SESSION\.md" .claude/templates/ --exclude-dir=handlers > session-references.txt
grep -r "SESSION\.md" .claude/hooks/ >> session-references.txt

# Count and categorize references
wc -l session-references.txt

# Find Read vs Write operations
grep -r "Edit.*SESSION\.md\|Write.*SESSION\.md" .claude/
grep -r "Read.*SESSION\.md" .claude/

# Check Python hooks specifically
grep -r "SESSION" .claude/hooks/*.py
```

### 2. Understand Session Format Requirements
```bash
# Examine existing migrated sessions
ls -la sessions/2025/*/
head -50 sessions/2025/08/*.md

# Understand the migration that already happened
grep -r "migrated_at" sessions/

# Check SESSION.md structure
head -100 SESSION.md
tail -100 SESSION.md

# Find session boundaries/patterns
grep -E "^#{1,3}\s+Session" SESSION.md
```

### 3. Investigate Module Dependencies
```bash
# How do Python hooks load files?
grep -r "open\|read_file\|with.*as" .claude/hooks/*.py

# How do templates reference sessions?
grep -r "session-resolver\|resolve-session" .claude/templates/

# Find import patterns
grep -r "from\|import" .claude/hooks/*.py
```

## Task 1: SESSION.md Deprecation Strategy

### Research First:
1. **Check current SESSION.md state**
   - Is it still being updated?
   - When was last update?
   - Any critical information only there?

2. **Determine safe deprecation approach**
   - Can we add a notice without breaking anything?
   - Do any tools parse the first line?
   - Where should deprecation notice go?

3. **Test deprecation impact**
   ```bash
   # Backup first
   cp SESSION.md SESSION.md.backup-$(date +%Y%m%d)
   
   # Add notice and test
   # Then check if anything breaks
   ```

## Task 2: Update References - Discovery Method

### For Each File Type:

#### Python Hooks (.claude/hooks/*.py)
**Discover**:
- How they currently read SESSION.md
- What data they extract
- Can they use session-resolver?
- Or do they need Python-specific solution?

**Research Commands**:
```bash
# Understand Python session access
grep -A5 -B5 "SESSION" .claude/hooks/ultrathink_detector.py
grep -A5 -B5 "SESSION" .claude/hooks/session_analyzer.py

# Find file reading patterns
grep -r "open.*SESSION\|read.*SESSION" .claude/hooks/
```

#### Template Files (.claude/templates/)
**Discover**:
- Which templates reference SESSION.md
- Are they documentation or functional?
- How to update without breaking handlers

**Research Commands**:
```bash
# Categorize template references
grep -l "SESSION\.md" .claude/templates/engine/core/*.md
grep -l "SESSION\.md" .claude/templates/engine/enforcement/*.md

# Check if references are in comments or active code
grep -C3 "SESSION\.md" .claude/templates/engine/core/*.md
```

## Task 3: Migration Tool Design

### Research Existing Migration:
```bash
# Sessions already exist - was there a migration?
ls -la sessions/2025/
grep "migrated" sessions/2025/*/*.md

# Understand existing session structure
head -30 sessions/2025/08/2025-08-04-001-untitled.md

# Check if SESSION.md has migration markers
grep -i "migrat" SESSION.md
```

### Key Questions:
1. **Has migration already happened?**
   - Check migrated_at timestamps in sessions/
   - If yes, tool might not be needed

2. **If tool needed, what format?**
   - Handler? Python script? Bash script?
   - Where should it live?
   - How to invoke it?

3. **Session boundary detection**
   - What patterns mark session starts?
   - How to handle malformed sessions?
   - How to generate session IDs for old sessions?

### Investigate Session Structure:
```bash
# Find session patterns
grep -n "^##.*Session" SESSION.md | head -20

# Check for session separators
grep -n "^---" SESSION.md | head -20

# Understand date formats used
grep -oE "[0-9]{4}-[0-9]{2}-[0-9]{2}" SESSION.md | sort -u
```

## Task 4: System-Wide Update Strategy

### Map All Dependencies:
```bash
# Create dependency map
echo "=== Files referencing SESSION.md ===" > session-deps.txt
grep -rl "SESSION\.md" .claude/ >> session-deps.txt

# Categorize by type
echo "=== Python files ===" >> session-deps.txt
grep -rl "SESSION\.md" .claude/hooks/*.py >> session-deps.txt

echo "=== Template files ===" >> session-deps.txt
grep -rl "SESSION\.md" .claude/templates/ >> session-deps.txt

echo "=== Documentation ===" >> session-deps.txt
grep -rl "SESSION\.md" docs/ >> session-deps.txt
```

### Understand Each Reference Type:
1. **Functional references** (must update)
   - Files that read/write SESSION.md
   - Critical for system operation

2. **Documentation references** (should update)
   - Mentions in guides/examples
   - Not breaking but confusing if outdated

3. **Historical references** (can keep)
   - Logs, memories, old reports
   - Part of system history

## Task 5: Compatibility Layer Investigation

### Current State:
```bash
# Check if session-resolver already handles compatibility
grep -A10 -B10 "compatibility\|fallback\|legacy" \
  .claude/templates/engine/core/session-resolver.md

# See if handlers already fall back
grep -r "SESSION\.md.*sessions/\|sessions/.*SESSION\.md" \
  .claude/templates/handlers/
```

### Questions to Answer:
1. Does session-resolver already handle both formats?
2. Are handlers already using the compatibility?
3. What's the current fallback behavior?
4. When is it safe to remove compatibility?

## Task 6: Testing Strategy

### Build Test Cases:
```bash
# Test new session creation
TEST_1="Create new session in sessions/"

# Test SESSION.md reading (compatibility)
TEST_2="Read old SESSION.md entries"

# Test reference updates
TEST_3="All updated files work correctly"

# Test performance
TEST_4="System performs acceptably"
```

### Validation Approach:
1. **Before changes**: Document current behavior
2. **After each change**: Test incrementally
3. **Final validation**: Full system test

## Investigation Priorities

### Must Understand Before Starting:
1. **Current migration state**
   - Has SESSION.md → sessions/ migration already happened?
   - Check migration-state.json for clues
   - Verify with file timestamps

2. **Python hook session access**
   - How to update Python file reading
   - Can they use session-resolver?
   - Need Python-specific approach?

3. **Template reference types**
   - Which are functional vs documentation
   - Which are critical vs optional
   - Update priority order

4. **Existing compatibility**
   - What session-resolver already handles
   - Current fallback mechanisms
   - When to remove compatibility

## Success Validation

### Incremental Checks:
```bash
# After each file update
git diff [filename]  # Review changes
grep SESSION.md [filename]  # Verify updates

# After deprecating SESSION.md
git diff SESSION.md  # Only deprecation notice

# After updating references
grep -r "SESSION\.md" .claude/ | grep -v DEPRECATED

# Final validation
echo "start new session" | assistant  # Test creation
echo "update session" | assistant     # Test update
```

## Important Notes

### Don't Assume - Investigate:
1. **Migration might be partially done** - Check existing sessions/
2. **Some references might be intentional** - Historical/documentation
3. **Python hooks might need different approach** - Can't use .md modules
4. **Compatibility might already exist** - session-resolver might handle it

### Document Findings:
Create a findings file as you go:
```markdown
# Phase 3 Migration Findings

## Current State
- SESSION.md last updated: [date]
- Sessions directory has: [count] sessions
- Migration appears: [complete/partial/not started]

## References Found
- Python hooks: [list]
- Templates: [list]
- Documentation: [list]

## Decisions Made
- [Decision 1]: [Reasoning]
- [Decision 2]: [Reasoning]
```

## Final Checklist

### Research Complete:
- [ ] Understand current migration state
- [ ] Map all SESSION.md references
- [ ] Categorize reference types
- [ ] Understand Python hook needs
- [ ] Verify compatibility layer status

### Implementation Ready:
- [ ] Deprecation strategy clear
- [ ] Update approach for each file type
- [ ] Testing plan established
- [ ] Rollback plan prepared
- [ ] Documentation plan ready

### Only Proceed When:
- Research phase complete
- Understanding documented
- Approach validated
- Risks identified
- Rollback possible