# Phase 2: Session Handler Updates - Discovery-Based Approach

## Your Mission
Update 5 session handlers to use the new sessions/ directory structure instead of SESSION.md. The session-resolver module exists but isn't integrated yet.

## Critical Context
- **Session-resolver module**: `.claude/templates/engine/core/session-resolver.md` - READ THIS FIRST
- **Existing sessions**: Check `/sessions/2025/08/` for example formats
- **Current handlers**: All hardcoded to SESSION.md - need complete rewrite

## Discovery Phase First

### 1. Understand the Current System
```bash
# Examine existing session files
ls -la sessions/2025/08/
head -30 sessions/2025/08/2025-08-04-001-untitled.md

# Check current symlink
readlink sessions/current

# Understand session-resolver
Read .claude/templates/engine/core/session-resolver.md
```

### 2. Analyze Each Handler's Current Logic
Read each handler completely to understand:
- How they currently interact with SESSION.md
- What tools they use (Edit, Read, etc.)
- Their process steps
- Their dependencies

### 3. Determine Integration Pattern
Based on session-resolver module:
- How should handlers import it?
- What functions does it export?
- How to call resolve-session()?
- How to handle returned data?

## Handler Update Strategy

### For Each Handler:

#### Step 1: Analysis
1. Read the full handler file
2. Identify all SESSION.md references
3. Understand the current process flow
4. Note which tools are used

#### Step 2: Planning
1. Determine how to import session-resolver
2. Map old operations to new:
   - "Edit SESSION.md" → Create/update session file
   - "Read SESSION.md" → Load via session-resolver
   - "Append to SESSION.md" → Update current session

#### Step 3: Implementation
1. Update YAML frontmatter:
   - Add session-resolver to dependencies
   - Keep existing tools
2. Rewrite Process section:
   - Replace SESSION.md operations
   - Use session-resolver functions
   - Handle new file structure
3. Update Pre-conditions:
   - Remove "SESSION.md exists"
   - Add "sessions/ directory exists"
4. Update examples with new behavior

## Specific Handler Considerations

### start-session
**Current**: Appends new session to SESSION.md
**Discover**:
- How to generate session IDs (YYYY-MM-DD-NNN)
- How to create YAML frontmatter (see existing files)
- How to create/update symlinks
- Directory creation process

### session-start (orchestrator)
**Current**: Complex initialization with SESSION.md
**Discover**:
- How orchestrators import modules
- How to use session-resolver's load function
- Compatibility handling logic

### update-session
**Current**: Appends progress to SESSION.md
**Discover**:
- How to read current session via resolver
- How to preserve YAML frontmatter while updating content
- Checksum calculation method

### end-session
**Current**: Adds end marker to SESSION.md
**Discover**:
- Archive directory structure
- How to move files to archive/
- Symlink cleanup process

### checkpoint-session
**Current**: Creates inline checkpoints
**Note**: This is an operator, not a trigger
**Discover**:
- How operators differ from triggers
- Checkpoint metadata format
- Backup file creation

## Testing Approach

### For Each Updated Handler:
1. **Syntax Validation**
   - Valid YAML frontmatter
   - Proper markdown format
   - No SESSION.md write operations

2. **Functional Testing**
   ```bash
   # Test new session creation
   echo "start new session" | assistant
   
   # Verify no SESSION.md changes
   git diff SESSION.md
   
   # Check new file created
   ls -la sessions/2025/08/
   ```

3. **Compatibility Testing**
   - Can still read old SESSION.md entries
   - Handles missing directories gracefully
   - Falls back appropriately

## Important Discoveries Needed

### Before Starting Updates:
1. **Module Import Syntax**
   - How do handlers import other modules?
   - Is it just listing in dependencies?
   - Or is there special syntax in Process?

2. **File Operations**
   - How to create directories in this system?
   - How to create/update symlinks?
   - How to calculate checksums?

3. **YAML Frontmatter Format**
   - Examine existing session files
   - Understand all required fields
   - Learn metadata update process

4. **Error Handling**
   - How handlers handle missing files
   - Fallback strategies
   - User communication patterns

## Success Criteria
- [ ] All 5 handlers updated to use session-resolver
- [ ] Zero writes to SESSION.md (verify with git diff)
- [ ] New sessions created in sessions/YYYY/MM/
- [ ] sessions/current symlink working
- [ ] Backwards compatibility maintained
- [ ] All handlers properly documented

## Investigation Commands

```bash
# Find how other handlers import modules
grep -r "import\|require\|load" .claude/templates/handlers/

# Check for existing session operations
grep -r "session" .claude/templates/handlers/ | grep -v SESSION.md

# Find checksum calculation examples
grep -r "checksum\|sha256" .claude/templates/

# Look for symlink operations
grep -r "symlink\|ln -s" .claude/templates/
```

## Note to Implementer
This is a discovery-based approach. You'll need to:
1. Research the existing system thoroughly
2. Understand the patterns before changing
3. Test incrementally
4. Document your findings
5. Ask for clarification if needed

The session-resolver module provides the framework, but you need to understand how to integrate it properly into each handler's unique workflow.