# Session Folder Architecture Design

## Problem Statement
- SESSION.md at 46KB and growing
- Hard to navigate and search
- Potential performance issues
- Merge conflicts in team settings

## Proposed Solution

### Folder Structure
```
blog/
├── SESSION.md                    # Index/pointer to current session
├── sessions/
│   ├── 2025-07-26-ultrathink-improvements.md
│   ├── 2025-07-26-template-portability.md
│   ├── 2025-07-25-template-refinement.md
│   └── archive/
│       ├── 2025-06/
│       └── 2025-05/
```

### Naming Convention
Format: `YYYY-MM-DD-descriptive-name.md`
- Date prefix for chronological ordering
- Descriptive suffix for context
- Multiple sessions per day allowed
- All lowercase with hyphens

### SESSION.md as Index
```markdown
# Current Session Index

## Active Session
- **File**: [2025-07-26-template-portability.md](sessions/2025-07-26-template-portability.md)
- **Started**: 2025-07-26 17:25 CEST
- **Focus**: Template system portability

## Recent Sessions (Last 5)
- [2025-07-26-ultrathink-improvements.md](sessions/2025-07-26-ultrathink-improvements.md)
- [2025-07-25-template-refinement.md](sessions/2025-07-25-template-refinement.md)
- [2025-07-24-ultrathink-format.md](sessions/2025-07-24-ultrathink-format.md)
- [2025-07-23-natural-workflow.md](sessions/2025-07-23-natural-workflow.md)
- [2025-07-22-behavior-testing.md](sessions/2025-07-22-behavior-testing.md)

## Search Sessions
mcp__serena__search_for_pattern --substring_pattern "your-search" --relative_path "sessions/"
```

### Benefits
1. **Performance**: Small focused files
2. **Organization**: Clear chronological structure
3. **Search**: Serena makes navigation easy
4. **Archiving**: Move old sessions to archive/
5. **Parallel Work**: No conflicts between sessions

### Migration Strategy
1. Parse current SESSION.md by session headers
2. Extract each session to individual file
3. Create new index SESSION.md
4. Update CLAUDE.md references
5. Test search functionality

### Considerations
- Keep sessions under 10KB each
- Archive after 30 days
- Maintain backwards compatibility
- Update session-start handler