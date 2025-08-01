# Migration Strategy

## Core Principles

### 1. Staging Isolation
- All work happens in `.claude/staging/`
- Production remains untouched until cutover
- Easy rollback: just delete staging

### 2. Incremental Progress
- Migrate one file at a time
- Validate each handler immediately
- Create checkpoints after each file

### 3. State Persistence
- `migration-state.json` tracks everything
- Can resume from any point
- No lost work on interruption

## Migration Flow

### Per-Handler Flow
```
1. Extract handler from source
2. Parse metadata
3. Generate YAML frontmatter
4. Determine folder placement
5. Create handler file
6. Validate immediately
7. Update state tracker
```

### Per-File Flow
```
1. Scan file for all handlers
2. Security check
3. Migrate each handler
4. Run integration tests
5. Create checkpoint
6. Update memory
```

## Testing Strategy

### Level 1: Syntax Validation
- YAML frontmatter valid
- Required fields present
- Markdown structure correct

### Level 2: Reference Validation
- All dependencies exist
- Tool names are valid
- Cross-references work

### Level 3: Integration Testing
- Handler chains execute
- Workflows complete
- No circular dependencies

## Rollback Procedures

### Handler-Level Rollback
- Delete the handler file
- Remove from state tracker
- Log the issue

### File-Level Rollback
- Delete all handlers from that file
- Reset file state to "pending"
- Investigate issues

### Full Rollback
- Delete entire staging directory
- Start fresh
- No production impact

## Success Criteria
- All handlers migrated
- Zero validation errors
- All tests passing
- Performance maintained
- Documentation complete