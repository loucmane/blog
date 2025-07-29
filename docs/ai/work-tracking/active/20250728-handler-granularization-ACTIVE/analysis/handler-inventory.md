# Handler Inventory and Granularization Analysis

## Summary Statistics
- **Total Handlers**: 69 in REGISTRY.md
- **Over-broad handlers identified**: ~45 (65%)
- **Atomic handlers (already good)**: ~24 (35%)
- **Potential new atomic handlers needed**: ~150-200

## Analysis by Category

### 1. Development Work Handlers (5 total) - ALL need granularization

#### `start-new-work` - Currently 6 operations
**Current Process**:
1. Extract feature name from input
2. Create work folder: `YYYYMMDD-{feature-name}-ACTIVE`
3. Initialize 7-file structure (ALL CAPS)
4. Update SESSION.md with new work
5. Create initial todos with TodoWrite
6. Route to Standard Development Workflow

**Proposed Atomic Handlers**:
- `extract-feature-name` - Parse user input for feature name
- `create-work-folder` - Create folder with date prefix
- `initialize-work-files` - Create 7-file structure
- `update-session-new-work` - Add work entry to SESSION.md
- `create-initial-todos` - Generate starter todos
- `route-to-workflow` - Redirect to appropriate workflow

#### `standard-dev-workflow` - Currently 8+ steps
**Current**: Full development workflow with research, implementation, testing

**Proposed Atomic Handlers**:
- `research-implementation` - Gather context and constraints
- `plan-implementation` - Design approach
- `implement-code` - Write the actual code
- `write-tests` - Create test cases
- `run-validation` - Execute tests
- `update-documentation` - Update relevant docs
- `create-commit` - Stage and commit changes
- `update-progress` - Update tracking files

### 2. Task Management (3 handlers) - Mixed needs

#### `create-todos` - Good as is
Single purpose: Creates comprehensive task list. Keep atomic.

#### `update-todos` - Needs slight split
**Current**: Updates status AND checks dependencies

**Proposed Split**:
- `update-todo-status` - Change status of single todo
- `check-todo-dependencies` - Validate dependency chain

#### `check-progress` - Currently 3 operations
**Current**: Shows percentage, blockers, next priorities

**Proposed Split**:
- `calculate-completion` - Get completion percentage
- `identify-blockers` - Find blocking tasks
- `suggest-next-task` - Recommend next priority

### 3. Session Management (6 handlers) - Most need splitting

#### `start-session` - Currently 4 operations
**Proposed Split**:
- `initialize-session-context` - Set up environment
- `check-git-status` - Verify repository state
- `create-session-entry` - Add SESSION.md entry
- `load-previous-context` - Restore from memory

#### `end-session` - Currently 6 operations
**Proposed Split**:
- `final-todo-check` - Review task status
- `update-work-files` - Save all progress
- `create-session-memory` - Generate memory file
- `update-session-end` - Add end status to SESSION.md
- `suggest-commit-message` - Generate commit suggestion
- `cleanup-temp-files` - Remove temporary files

#### `context-compaction` - Currently 5+ operations
**Proposed Split**:
- `check-documentation-complete` - Verify all docs updated
- `create-compaction-summary` - Generate summary
- `generate-resume-message` - Create restart instructions
- `save-compaction-state` - Preserve current state
- `handle-auto-compaction` - React to automatic compaction

### 4. Search Operations (4 handlers) - Mostly good

These are already fairly atomic:
- `search-code` ✓ (routes to tool)
- `find-symbol` ✓ (single operation)
- `find-references` ✓ (single operation)
- `grep-pattern` ✓ (single operation)

### 5. File Operations (4 handlers) - All good as atomic

Already atomic:
- `read-file` ✓
- `edit-file` ✓
- `create-file` ✓
- `delete-file` ✓

### 6. Git Operations (4 handlers) - Mostly good

#### `commit-changes` - Needs split
**Current**: Multiple validation steps

**Proposed Split**:
- `validate-commit-message` - Check format
- `stage-changes` - Git add
- `create-commit` - Git commit
- `verify-commit` - Confirm success

### 7. Testing Handlers (3) - All need granularization

#### `create-test-checkpoint` - Currently 3 operations
**Proposed Split**:
- `design-test-scenarios` - Plan test cases
- `implement-tests` - Write test code
- `verify-test-coverage` - Check completeness

### 8. Work Tracking (4) - Mixed needs

#### `create-work-folder` - Already atomic ✓
#### `update-tracker` - Already atomic ✓
#### `document-findings` - Already atomic ✓
#### `record-decision` - Already atomic ✓

### 9. Analysis Operations (3) - Need splitting

#### `analyze-code` - Multiple analysis types
**Proposed Split**:
- `analyze-quality` - Code quality metrics
- `find-code-smells` - Identify issues
- `suggest-improvements` - Recommend fixes

### 10. Evidence & Claims (3) - Need refinement

#### `verify-claim` - Currently multi-step
**Proposed Split**:
- `identify-claim` - Extract what needs verification
- `search-evidence` - Find supporting code
- `validate-evidence` - Confirm claim truth

## Summary of Granularization Impact

### Before Granularization
- 69 handlers total
- Average steps per handler: 4-6
- Hard to specify exact operation
- E field often vague

### After Granularization
- ~200 atomic handlers
- 1-2 steps per handler max
- Precise operation targeting
- E field always specific

### Benefits
1. **Precision**: H:create-work-folder vs H:start-new-work
2. **Clarity**: E:1/"Folder created" vs E:6/"Work initialized"
3. **Composability**: Chain atomic handlers for complex tasks
4. **Debuggability**: Know exactly where failures occur
5. **Discoverability**: More specific handler names

### Challenges
1. **Registry size**: 3x larger
2. **Discovery complexity**: Need better search/grouping
3. **Backward compatibility**: Existing references break
4. **Learning curve**: Users need to know more handler names