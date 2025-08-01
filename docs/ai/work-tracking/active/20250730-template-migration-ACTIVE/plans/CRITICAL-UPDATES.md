# Critical File Updates for Cutover

## 1. CLAUDE.md Updates

### Search Path Changes
All handler searches must change from monolithic files to handler directory:

```markdown
# OLD - Throughout CLAUDE.md
mcp__serena__search_for_pattern --substring_pattern "[handler-name]" --relative_path ".claude/templates/REGISTRY.md"
mcp__serena__search_for_pattern --substring_pattern "{#handler-name}" --relative_path ".claude/templates/WORKFLOWS.md"

# NEW - Update to
mcp__serena__search_for_pattern --substring_pattern "[handler-name]" --relative_path ".claude/templates/REGISTRY.md"
mcp__serena__search_for_pattern --substring_pattern "id: handler-name" --relative_path ".claude/templates/handlers/"
```

### Template Loading Pattern
```markdown
# OLD
Load: mcp__serena__search_for_pattern --substring_pattern "{#start-new-work}" --relative_path ".claude/templates/WORKFLOWS.md"

# NEW  
Load: mcp__serena__read_file --file_path ".claude/templates/handlers/triggers/development/start-new-work.md"
```

## 2. REGISTRY.md Updates

### Handler References
Every handler link must be updated:

```markdown
# OLD Format
[start-new-work](WORKFLOWS.md#start-new-work)
[edit-file](TOOLS.md#edit-file)
[session-start](CONVENTIONS.md#session-start)

# NEW Format
[start-new-work](handlers/triggers/development/start-new-work.md)
[edit-file](handlers/triggers/file/edit-file.md)
[session-start](handlers/triggers/session/session-start.md)
```

### Navigation Keywords Section
Update to reference new locations:
```markdown
- "work on X" → handlers/triggers/development/start-new-work.md
- "fix bug" → handlers/triggers/development/fix-bug.md
- "edit X" → handlers/triggers/file/edit-file.md
```

## 3. Handler Cross-References

Within handlers, update references to other handlers:
```markdown
# OLD
See also: [create-work-folder](WORKFLOWS.md#create-work-folder)

# NEW
See also: [create-work-folder](../work-tracking/create-work-folder.md)
```

## 4. BEHAVIORS.md Updates

Update any template references:
```markdown
# OLD
Always check: CONVENTIONS.md#naming-conventions

# NEW
Always check: handlers/operators/conventions/check-naming.md
```

## 5. Test These Searches

After cutover, these searches must work:
```bash
# Find handler by ID
mcp__serena__search_for_pattern --substring_pattern "id: start-new-work" --relative_path ".claude/templates/handlers/"

# Find handler by trigger
mcp__serena__search_for_pattern --substring_pattern "triggers:.*work on" --relative_path ".claude/templates/handlers/"

# Read specific handler
mcp__serena__read_file --file_path ".claude/templates/handlers/triggers/development/start-new-work.md"
```

## Update Checklist

- [ ] Search all CLAUDE.md for "templates/WORKFLOWS.md" → Update paths
- [ ] Search all CLAUDE.md for "templates/TOOLS.md" → Update paths  
- [ ] Search all CLAUDE.md for "templates/CONVENTIONS.md" → Update paths
- [ ] Update REGISTRY.md handler references (69 links)
- [ ] Update REGISTRY.md navigation keywords
- [ ] Test S:W:H:E format still works
- [ ] Test handler discovery works
- [ ] Test common workflows execute

## Gotchas to Avoid

1. **Don't change REGISTRY.md location** - It stays in templates/
2. **Don't move CLAUDE.md** - It stays in templates/
3. **Keep anchor format** - Even though files move, keep anchor style
4. **Test incrementally** - Update a few paths and test before doing all

## Rollback Points

If issues found after updating:
1. Can rollback just CLAUDE.md changes
2. Can rollback just REGISTRY.md changes  
3. Can rollback entire handler structure
4. Each is independent