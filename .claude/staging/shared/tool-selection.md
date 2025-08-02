# Tool Selection Patterns

Standardized tool usage keywords and selection patterns.

## Keywords Standard

### PRIMARY
First choice tool for the operation. Should be used unless specific constraints apply.
```
2. **PRIMARY**: Serena searches:
2. **PRIMARY**: Check format:
2. **PRIMARY**: Apply style checks:
```

### SECONDARY 
Alternative approach when primary isn't sufficient.
```
3. **SECONDARY**: External evidence:
```

### FALLBACK
Last resort when other methods fail.
```
4. **FALLBACK**: Link to full HANDLERS.md
3. **FALLBACK**: Create memory snapshot
```

### ALWAYS
Mandatory operations that must occur.
```
**ALWAYS**: Check conventions before edit
**ALWAYS**: Validate path before creation
```

### NEVER
Prohibited operations.
```
**NEVER**: Skip evidence gathering
**NEVER**: Assume file exists
```

## Selection Matrix

### Search Operations
- **PRIMARY**: Serena (code understanding, symbol finding)
- **SECONDARY**: Grep (text search, simple patterns)
- **FALLBACK**: Manual inspection

### File Operations
- **PRIMARY**: Read (content inspection)
- **PRIMARY**: Edit (modifications)
- **FALLBACK**: Write (new files only)

### Analysis Operations
- **PRIMARY**: Serena search + evidence gathering
- **SECONDARY**: Static analysis
- **FALLBACK**: Manual code review

### Validation Operations
- **ALWAYS**: Check conventions first
- **PRIMARY**: Automated validation
- **FALLBACK**: Manual review

## Common Patterns

### Evidence-Based Operations
```
1. Identify target
2. **PRIMARY**: Use Serena for evidence
3. **SECONDARY**: Check external sources
4. **FALLBACK**: Request clarification
```

### File Modification Pattern
```
1. **ALWAYS**: Check conventions
2. **PRIMARY**: Read existing content
3. **PRIMARY**: Edit with minimal changes
4. **NEVER**: Assume structure
```

### Search Pattern
```
1. **PRIMARY**: Serena for code/symbols
2. **SECONDARY**: Grep for text patterns
3. **FALLBACK**: Manual exploration
```
