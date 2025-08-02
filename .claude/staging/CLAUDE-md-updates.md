# CLAUDE.md Updates for Handler Migration

## Search Path Changes

### 1. Handler Discovery Pattern
Replace all instances of searching in monolithic template files with handler directory searches:

**OLD Pattern:**
```
mcp__serena__search_for_pattern --substring_pattern "{#handler-name}" --relative_path ".claude/templates/WORKFLOWS.md"
mcp__serena__search_for_pattern --substring_pattern "{#handler-name}" --relative_path ".claude/templates/TOOLS.md"
mcp__serena__search_for_pattern --substring_pattern "{#handler-name}" --relative_path ".claude/templates/CONVENTIONS.md"
mcp__serena__search_for_pattern --substring_pattern "{#handler-name}" --relative_path ".claude/templates/PATTERNS.md"
```

**NEW Pattern:**
```
mcp__serena__search_for_pattern --substring_pattern "id: handler-name" --relative_path ".claude/templates/handlers/"
```

### 2. Handler Loading Pattern
Replace template anchor searches with direct file reads:

**OLD Pattern:**
```
Load: mcp__serena__search_for_pattern --substring_pattern "{#start-new-work}" --relative_path ".claude/templates/WORKFLOWS.md"
```

**NEW Pattern:**
```
Load: Read --file_path ".claude/templates/handlers/triggers/development/start-new-work.md"
```

### 3. Common Request Flows Section
Update all example flows:

**OLD:**
```
### "Work on X" → Development Flow
1. Search REGISTRY: "start-new-work"
2. Find: Handler link [start-new-work](WORKFLOWS.md#start-new-work)
3. Load: mcp__serena__search_for_pattern --substring_pattern "{#start-new-work}" --relative_path ".claude/templates/WORKFLOWS.md"
```

**NEW:**
```
### "Work on X" → Development Flow
1. Search REGISTRY: "start-new-work"
2. Find: Handler link [start-new-work](handlers/triggers/development/start-new-work.md)
3. Load: Read --file_path ".claude/templates/handlers/triggers/development/start-new-work.md"
```

### 4. Template Navigation Protocol
Update the search examples:

**OLD:**
```
Once I find the handler in REGISTRY (now with anchor links), I load it using:
mcp__serena__search_for_pattern --substring_pattern "{#handler-name}" --relative_path "[template-file]"
```

**NEW:**
```
Once I find the handler in REGISTRY (now with file links), I load it using:
Read --file_path ".claude/templates/handlers/[role]/[domain]/[handler-name].md"
```

### 5. Template System Structure Section
Update descriptions:

**OLD:**
```
### WORKFLOWS.md - Development Processes
- **Purpose**: How to do development work
- **When I use it**: Implementation, features, bugs
- **Key handlers**: start-new-work, fix-problem, test-implementation
```

**NEW:**
```
### handlers/ - All System Handlers
- **Purpose**: Complete handler collection organized by role and domain
- **Structure**: handlers/triggers/, handlers/orchestrators/, handlers/operators/
- **When I use it**: Direct handler access via Read tool
- **Key benefit**: Fast, direct access without searching
```

## Testing Commands

After updates, these should work:

```bash
# Find handler by ID
mcp__serena__search_for_pattern --substring_pattern "id: start-new-work" --relative_path ".claude/templates/handlers/"

# Find handlers by trigger
mcp__serena__search_for_pattern --substring_pattern "work on" --relative_path ".claude/templates/handlers/" --context_lines_after 5

# Read handler directly
Read --file_path ".claude/templates/handlers/triggers/development/start-new-work.md"
```

## Update Summary

1. Replace ~15-20 search pattern references
2. Update all example flows in COMMON REQUEST FLOWS
3. Update Template System Structure descriptions
4. Ensure REGISTRY.md searches remain unchanged (still in templates/)
5. Test each major workflow after updates