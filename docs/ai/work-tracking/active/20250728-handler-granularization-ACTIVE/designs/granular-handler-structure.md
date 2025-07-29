# Granular Handler Structure Design

## Design Principles

### 1. Atomic Operations
- One handler = one clear action
- No multi-step processes
- Clear input → processing → output

### 2. Naming Convention
```
[verb]-[object]-[qualifier]

Examples:
- create-work-folder
- update-todo-status
- validate-commit-message
- search-code-symbols
```

### 3. Handler Categories

#### A. Atomic Actions (single operations)
```yaml
Work Management:
  - create-work-folder
  - create-tracking-file
  - update-tracker-progress
  - add-decision-entry
  - add-finding-entry

Session:
  - create-session-entry
  - update-session-progress
  - add-session-timestamp
  - create-session-memory
  
Todos:
  - create-single-todo
  - update-todo-status
  - check-todo-dependencies
  - calculate-todo-progress

Git:
  - stage-all-changes
  - create-git-commit  
  - check-git-status
  - validate-commit-format

Files:
  - read-file-content
  - edit-file-content
  - create-new-file
  - delete-existing-file

Search:
  - search-code-symbols
  - find-text-pattern
  - locate-references
  - grep-in-files
```

#### B. Composite Handlers (orchestrate atomics)
```yaml
compose-start-work:
  calls:
    - extract-feature-name
    - create-work-folder
    - create-tracking-file (×7)
    - create-session-entry
    - create-initial-todos

compose-end-session:
  calls:
    - check-todo-status
    - update-all-trackers
    - create-session-memory
    - add-session-timestamp
    - suggest-commit-message
```

### 4. Handler Entry Format

```yaml
#### Handler: create-work-folder
Type: atomic
Triggers: none (called by compose-start-work)
Inputs:
  - feature_name: string
  - date: string (YYYYMMDD)
Process:
  1. Create folder: {date}-{feature_name}-ACTIVE
Success: Folder exists at path
Failure: Permission denied or folder exists
E-field: 1/"Folder created"
```

### 5. Discovery Mechanisms

#### A. Handler Groups in Registry
```markdown
## Atomic Handlers

### Work Management (15 handlers)
[Alphabetical list with purpose]

### Session Management (12 handlers)
[Alphabetical list with purpose]

## Composite Handlers

### Work Workflows (5 handlers)
[List of multi-step orchestrators]
```

#### B. Keyword Expansion
Instead of:
```
work → start-new-work
```

Now:
```
work → compose-start-work (full workflow)
work folder → create-work-folder (atomic)
work files → create-tracking-file (atomic)
```

### 6. Backward Compatibility

#### A. Alias System
```yaml
# Old handler name → New composite
start-new-work → compose-start-work
end-session → compose-end-session
context-compaction → compose-compaction
```

#### B. Migration Path
1. Phase 1: Add atomic handlers alongside existing
2. Phase 2: Convert existing to composites
3. Phase 3: Update all references
4. Phase 4: Deprecate old names

### 7. S:W:H:E Benefits

#### Before:
```
[S:20250128|W:template-work|H:start-new-work|E:6/"Work initialized"]
```

#### After (atomic):
```
[S:20250128|W:template-work|H:create-work-folder|E:1/"Folder created"]
```

#### After (composite):
```
[S:20250128|W:template-work|H:compose-start-work|E:5/"Todos created"]
```

### 8. Example: Granularized Session End

#### Old way (one handler, 6 steps):
```
H:end-session|E:6/"Clean session end"
```

#### New atomic sequence:
```
H:check-todo-status|E:1/"3 pending"
H:update-tracker-progress|E:1/"Entry added"
H:update-handoff-status|E:1/"Status recorded"
H:create-session-memory|E:1/"Memory saved"
H:add-session-timestamp|E:1/"11:50 added"
H:suggest-commit-message|E:1/"Message: 'Session 2025-07-28'"
```

#### New composite way:
```
H:compose-end-session|E:6/"Session ended"
(But internally uses all atomics)
```

### 9. Registry Organization

```markdown
# Handler Registry v3.0 - Granular

## Quick Jump
- [Atomic Handlers](#atomic) (150 handlers)
- [Composite Handlers](#composite) (25 handlers)
- [Handler Aliases](#aliases) (backward compat)
- [Discovery Guide](#discovery)

## Atomic Handlers {#atomic}

### Create Operations (20)
- create-commit
- create-file  
- create-folder
- create-memory
- create-session-entry
- create-todo
- create-work-folder
[...]

### Update Operations (25)
- update-changelog
- update-decision
- update-finding
- update-handoff
[...]

### Search Operations (15)
- search-code-symbols
- search-file-content
- search-references
[...]

## Composite Handlers {#composite}

### Full Workflows (10)
- compose-start-work (6 atomics)
- compose-end-session (6 atomics)
- compose-bug-fix (8 atomics)
[...]
```

### 10. Implementation Strategy

1. **Start with most-used handlers**
   - start-new-work
   - end-session
   - context-compaction
   
2. **Create atomic versions first**
   - Test each atomic independently
   - Ensure clear E field values
   
3. **Build composites from atomics**
   - Maintain same overall behavior
   - Better progress visibility
   
4. **Update S:W:H:E examples**
   - Show both atomic and composite usage
   - Document when to use each

### Benefits Summary

1. **For S:W:H:E**:
   - H field precisely identifies operation
   - E field always 1-3 steps max
   - Can't fake compliance as easily

2. **For Users**:
   - Can request specific operations
   - Better progress visibility
   - Easier to debug failures

3. **For System**:
   - Handlers become building blocks
   - Easier to test
   - More maintainable

### Next Steps

1. Implement create-work-folder as first atomic
2. Test with S:W:H:E format
3. Build compose-start-work using atomics
4. Gradually convert all handlers