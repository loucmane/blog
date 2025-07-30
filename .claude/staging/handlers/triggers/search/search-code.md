---
id: search-code
name: Search Code
role: trigger
domain: search
stability: stable
triggers:
  - "find X"
  - "search for Y"
  - "look for Z in code"
dependencies: []
tools:
  - Grep
  - mcp__serena__search_for_pattern
  - mcp__serena__find_symbol
  - Glob
---

# Search Code Handler

**Target Pattern**: Extract search term after action verb

## Pre-conditions
- Clear search target
- Code context (not general files)

## Process

1. Analyze search intent:
   - Simple text patterns (TODO, logs) → Use `Grep` 
   - Code semantics (how X works) → Use Serena
   - Symbol definitions → Use `mcp__serena__find_symbol`
   - File patterns → Use `Glob`

2. **Balanced Tool Selection**:
   ```
   Intent                  | Tool                    | Example
   -----------------------|-------------------------|------------------
   Find text patterns     | Grep                    | "TODO", "FIXME"
   Find error messages    | Grep                    | Log strings
   Understand code flow   | Serena overview         | "How does auth work?"
   Find specific symbol   | Serena find_symbol      | "Find UserService class"
   Find implementations   | Serena find_references  | "What implements X?"
   Find file patterns     | Glob                    | "*.test.js files"
   ```

3. Configure search parameters
4. Present results clearly

## Success Criteria
Relevant results found and shown

## Failure Modes
No results, suggest alternatives

## Examples
- "find authentication logic" → Serena pattern search
- "search for TODO comments" → Serena with "TODO" pattern