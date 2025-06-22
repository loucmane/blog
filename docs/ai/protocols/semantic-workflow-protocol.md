# Semantic Workflow Protocol

## Purpose
Master semantic code navigation using Serena MCP for efficient development workflows that understand code meaning rather than file locations.

## Prerequisites
- [ ] Serena MCP installed and configured
- [ ] Project activated in Serena
- [ ] Understanding of basic Serena commands
- [ ] Access to project codebase

## Workflow Steps

### Step 1: Project Initialization
```bash
# First time setup
mcp__serena__activate_project --project /path/to/project

# Allow indexing to complete (10-30 seconds)
# Check onboarding status
mcp__serena__check_onboarding_performed

# If needed, run onboarding
mcp__serena__onboarding
```

**Success Criteria:**
- Project activated successfully
- Onboarding completed
- No indexing errors

### Step 2: Context Discovery
```bash
# List existing memories
mcp__serena__list_memories

# Read relevant memories
mcp__serena__read_memory --memory_file_name "relevant_memory"

# Get project structure overview
mcp__serena__get_symbols_overview --relative_path "src"
```

**What to Look For:**
- Existing architectural decisions
- Established patterns
- Previous work context

### Step 3: Semantic Exploration
```bash
# Find components by meaning
mcp__serena__find_symbol --name_path "Button" --substring_matching true

# Understand relationships
mcp__serena__find_referencing_symbols --name_path "Button" --relative_path "components/Button.tsx"

# Search for patterns
mcp__serena__search_for_pattern --pattern "TODO|FIXME" --context_lines_after 2
```

**Best Practices:**
- Start broad, then narrow
- Use semantic names, not paths
- Include context lines for better understanding

### Step 4: Code Analysis
```bash
# Deep dive into implementation
mcp__serena__find_symbol --name_path "authenticate" --include_body true --depth 1

# Trace execution flow
mcp__serena__find_referencing_symbols --name_path "validateUser" --relative_path "auth/validator.ts"

# Find similar patterns
mcp__serena__search_for_pattern --pattern "similar_pattern" --only_in_code_files true
```

**Analysis Checklist:**
- [ ] Understand current implementation
- [ ] Identify dependencies
- [ ] Find related code
- [ ] Note patterns to follow

### Step 5: Implementation Planning
```bash
# Create memory for decisions
mcp__serena__write_memory --memory_name "feature_x_architecture" --content "Design decisions..."

# Find appropriate location
mcp__serena__get_symbols_overview --relative_path "target/directory"

# Check for conflicts
mcp__serena__find_symbol --name_path "ProposedName" --substring_matching true
```

**Planning Outputs:**
- Architecture memory created
- Location identified
- No naming conflicts

### Step 6: Code Modification
```bash
# Replace implementation
mcp__serena__replace_symbol_body --name_path "oldMethod" --relative_path "file.ts" --body "new implementation"

# Insert new code
mcp__serena__insert_after_symbol --name_path "existingMethod" --relative_path "file.ts" --body "new method"

# Refactor with regex
mcp__serena__replace_regex --relative_path "file.ts" --regex "oldPattern" --repl "newPattern"
```

**Modification Guidelines:**
- Preserve indentation (automatic)
- Follow existing patterns
- Update in logical order

### Step 7: Impact Verification
```bash
# Find all affected code
mcp__serena__find_referencing_symbols --name_path "modifiedSymbol" --relative_path "file.ts"

# Check for broken imports
mcp__serena__search_for_pattern --pattern "import.*ModifiedName"

# Verify completeness
mcp__serena__find_symbol --name_path "oldName" --substring_matching true
```

**Verification Checklist:**
- [ ] All references updated
- [ ] No broken imports
- [ ] Tests still reference correct code
- [ ] Documentation updated

### Step 8: Session Documentation
```bash
# Create session memory
mcp__serena__write_memory --memory_name "session_YYYY-MM-DD_feature_description" --content "Work completed..."

# Summarize changes
mcp__serena__summarize_changes

# Update feature memory
mcp__serena__write_memory --memory_name "feature_x_implementation" --content "Implementation details..."
```

## Common Patterns

### Pattern 1: Feature Development
```
1. Find similar features → Understand patterns
2. Create architecture memory → Document decisions  
3. Find appropriate location → Implement
4. Update references → Test
5. Create completion memory → Document
```

### Pattern 2: Bug Investigation
```
1. Search for error message → Find source
2. Trace references → Understand flow
3. Find related code → Identify pattern
4. Fix systematically → Verify
5. Document fix → Prevent recurrence
```

### Pattern 3: Refactoring
```
1. Find all occurrences → Plan approach
2. Create refactor memory → Document intent
3. Update systematically → Maintain consistency
4. Verify completeness → No remnants
5. Update documentation → Reflect changes
```

## Success Criteria

### Quality Checks
- [ ] All symbols found semantically (no hardcoded paths)
- [ ] Changes follow existing patterns
- [ ] No broken references
- [ ] Memories document key decisions
- [ ] Tests updated appropriately

### Performance Metrics
- Symbol search: <2 seconds
- Reference finding: <5 seconds  
- File modifications: <3 seconds
- Memory operations: <1 second

## Troubleshooting

### Issue: "Symbol not found"
```bash
# Solution 1: Enable substring matching
--substring_matching true

# Solution 2: Broaden search
--relative_path "." # Search entire project

# Solution 3: Check different name variations
"findUser" vs "find_user" vs "FindUser"
```

### Issue: "Multiple matches"
```bash
# Solution 1: Narrow by path
--relative_path "specific/directory"

# Solution 2: Use symbol kinds
--include_kinds [12] # Functions only

# Solution 3: Make pattern more specific
"Button" → "Button/render"
```

### Issue: "Language server out of sync"
```bash
# Solution: Restart language server
mcp__serena__restart_language_server

# Then retry operation
# External changes now visible
```

### Issue: "Operation too slow"
```bash
# Solution 1: Limit search scope
--relative_path "specific/package"

# Solution 2: Reduce response size
--max_answer_chars 50000

# Solution 3: Exclude body
--include_body false
```

## Best Practices

### DO:
1. **Think semantically** - "Find authentication logic" not "Find in src/auth"
2. **Create memories** - Document decisions and patterns
3. **Verify impact** - Always check references after changes
4. **Use appropriate depth** - Don't retrieve unnecessary nested symbols
5. **Trust the search** - Serena often finds things faster than manual search

### DON'T:
1. **Hardcode paths** - Let Serena find the right location
2. **Skip onboarding** - Initial indexing is crucial
3. **Ignore memories** - They provide valuable context
4. **Fight the tool** - Work with semantic navigation
5. **Modify without checking** - Always verify references first

## Integration Points

### With Other Tools:
- **Before Desktop Commander**: Find location with Serena first
- **Before Editing**: Understand context with Serena
- **After Changes**: Verify with Serena
- **For Planning**: Use Serena insights for TaskMaster

### In CI/CD:
- Document patterns in memories
- Export important discoveries
- Share memory files with team
- Include in onboarding docs

## Quick Reference

| Task | Command Pattern |
|------|-----------------|
| Find code | `find_symbol --name_path "term"` |
| Check usage | `find_referencing_symbols` |
| Explore module | `get_symbols_overview` |
| Search pattern | `search_for_pattern --pattern "regex"` |
| Modify code | `replace_symbol_body` |
| Add code | `insert_before_symbol` / `insert_after_symbol` |
| Create memory | `write_memory --memory_name "name"` |
| Read context | `read_memory --memory_file_name "name"` |

## Example Session

```bash
# 1. Start session
mcp__serena__activate_project --project /home/dev/project
mcp__serena__list_memories

# 2. Understand feature
mcp__serena__find_symbol --name_path "UserAuth" --include_body true
mcp__serena__find_referencing_symbols --name_path "UserAuth" --relative_path "auth/UserAuth.ts"

# 3. Plan changes
mcp__serena__write_memory --memory_name "auth_refactor_plan" --content "Refactoring to new pattern..."

# 4. Implement
mcp__serena__replace_symbol_body --name_path "authenticate" --relative_path "auth/UserAuth.ts" --body "new logic"

# 5. Verify
mcp__serena__find_referencing_symbols --name_path "authenticate" --relative_path "auth/UserAuth.ts"

# 6. Document
mcp__serena__write_memory --memory_name "session_2025-06-22_auth_refactor" --content "Completed refactoring..."
```

## Conclusion

Semantic workflows with Serena transform development from file-hunting to meaningful code navigation. Master these patterns to work with the natural structure of your code rather than against arbitrary file organization.