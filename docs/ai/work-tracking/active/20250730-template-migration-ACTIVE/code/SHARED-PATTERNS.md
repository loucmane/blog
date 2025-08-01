# Shared Patterns to Extract

## Pattern 1: Serena Tool Usage

**Found in**: 14/18 handlers (78% duplication)

### Current Repetition
```markdown
**Tool Selection**:
**PRIMARY**: Use Serena's `find_symbol` or `search_for_pattern`
**FALLBACK**: Use Read if exact path known
**ALWAYS**: Prefer Serena for discovery
**NEVER**: Use Bash for file reading
```

### Proposed Shared Pattern
Create: `.claude/staging/handlers/shared/serena-usage.md`

```markdown
# Serena Tool Usage Pattern

When searching for code or patterns:

**PRIMARY**: Use Serena MCP tools
- `find_symbol` - For finding code symbols (classes, functions, methods)
- `search_for_pattern` - For text patterns and content search
- `get_symbols_overview` - For understanding file structure

**FALLBACK**: Direct file access
- Use Read when you have the exact file path
- Use Glob for file discovery by name pattern

**ALWAYS**:
- Prefer Serena for any discovery operation
- Use Serena before attempting manual search
- Trust Serena's search over grep/find

**NEVER**:
- Use Bash commands for file reading (cat, head, tail)
- Use Bash find/grep when Serena is available
- Parse files manually when Serena can search
```

## Pattern 2: Tool Selection Matrix

**Found in**: 12/18 handlers (67% duplication)

### Current Repetition
```markdown
- **Code Search**: Always use Serena
- **File Edits**: Always use Edit/MultiEdit  
- **File Creation**: Always use Write
- **Never**: Use Bash for file operations
```

### Proposed Shared Pattern
Create: `.claude/staging/handlers/shared/tool-selection.md`

```markdown
# Tool Selection Matrix

## By Operation Type

### Search Operations
| Need | Use | Never Use |
|------|-----|-----------|
| Find code symbols | Serena find_symbol | Grep, Bash |
| Search text patterns | Serena search_for_pattern | Bash grep |
| Find files by name | Glob | Bash find |
| List directory | LS | Bash ls |

### File Operations
| Need | Use | Never Use |
|------|-----|-----------|
| Read file | Read | Bash cat |
| Edit file | Edit/MultiEdit | Write (overwrites) |
| Create new file | Write | Edit (needs existing) |
| Delete file | Bash rm | Manual editing |

### Code Operations
| Need | Use | Never Use |
|------|-----|-----------|
| Run tests | Bash | Direct execution |
| Check syntax | Bash (linter) | Manual parsing |
| Format code | Bash (formatter) | Manual formatting |

### Git Operations
| Need | Use | Never Use |
|------|-----|-----------|
| Status/Diff | Bash git | File reading |
| Commit | Bash git | Direct file manipulation |
| Branch ops | Bash git | Manual editing |
```

## Pattern 3: Error Handling

**Found in**: 10/18 handlers (56% duplication)

### Current Repetition
```markdown
**Failure Modes**:
- Tool not available → Check tool access
- No results found → Broaden search
- Multiple matches → Ask for clarification
```

### Proposed Shared Pattern
Create: `.claude/staging/handlers/shared/error-handling.md`

```markdown
# Standard Error Handling Patterns

## Tool Availability Errors
**Symptom**: "Tool X not available" or "No such tool"
**Action**: 
1. Check available tools with get_current_config
2. Use fallback tool if available
3. Inform user of limitation

## Search/Discovery Errors
**Symptom**: No results found
**Action**:
1. Broaden search terms
2. Check different locations
3. Verify search syntax
4. Ask user for more specific information

## Ambiguity Errors
**Symptom**: Multiple matches or unclear target
**Action**:
1. List all matches with context
2. Ask user to specify which one
3. Provide disambiguation hints

## Permission/Access Errors
**Symptom**: Cannot read/write file
**Action**:
1. Check file exists
2. Verify path is correct
3. Inform user of access issue
4. Suggest alternative approach

## Validation Errors
**Symptom**: Invalid syntax or format
**Action**:
1. Show specific error
2. Highlight problematic section
3. Suggest correction
4. Offer to fix automatically
```

## Pattern 4: Success Criteria

**Found in**: 8/18 handlers (44% duplication)

### Proposed Shared Pattern
Create: `.claude/staging/handlers/shared/success-criteria.md`

```markdown
# Standard Success Criteria Patterns

## For Search Operations
- ✓ Found target symbol/pattern
- ✓ Displayed relevant context
- ✓ Confirmed with user if ambiguous

## For Edit Operations
- ✓ File successfully modified
- ✓ Changes match user intent
- ✓ No syntax errors introduced
- ✓ Tests still pass (if applicable)

## For Create Operations
- ✓ File/component created
- ✓ Follows project conventions
- ✓ Includes necessary boilerplate
- ✓ Integrated with project structure

## For Analysis Operations
- ✓ Complete analysis performed
- ✓ Results clearly presented
- ✓ Actionable recommendations provided
- ✓ No false positives
```

## Implementation Plan

1. Create shared/ directory in staging
2. Extract patterns to individual files
3. Update handlers to reference shared patterns:
   ```markdown
   ## Tool Usage
   See: [Serena Usage Pattern](../shared/serena-usage.md)
   ```
4. Remove duplicated content from handlers
5. Validate handlers still complete

## Expected Benefits
- **Size Reduction**: 25-30% smaller handlers
- **Consistency**: Same patterns everywhere
- **Maintenance**: Update in one place
- **Clarity**: Handlers focus on unique logic