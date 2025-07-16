# Implementation: Navigation Improvements

## Analysis Approach

### Phase 1: Current State Analysis
1. Document typical navigation flows
2. Count search iterations for common tasks
3. Identify failure patterns
4. Map pain points

### Phase 2: Design Improvements
1. Enhanced REGISTRY.md with trigger phrases
2. Navigation shortcuts and quick paths
3. Better search patterns
4. Visual aids and decision trees

### Phase 3: Implementation
1. Update template files
2. Test navigation flows
3. Measure improvements
4. Iterate based on results

## Navigation Pain Points

### 1. Handler Discovery Issues
- Handler names don't match user phrases
  - User says "work on X" → Handler is "start-new-work"
  - User says "fix bug" → Handler is "fix-problem"
  - User says "commit" → Handler is "create-commit-message"

### 2. Multiple Search Iterations
- First search: Find general area in REGISTRY
- Second search: Load specific handler from template
- Third search: Sometimes need to check conventions too

### 3. Cross-Template Dependencies
- Some workflows reference tools
- Tools may have convention requirements
- Conventions might trigger behaviors
- Need to hop between files

### 4. Ambiguous Routing
- "Search for X" - Serena or Grep?
- "Edit file" - Which conventions apply?
- "Start work" - Multiple possible workflows

## Proposed Solutions

### 1. Trigger Phrase Index
Add to REGISTRY.md:
```
## Trigger Phrase Index
| User Says | → Handler | Location |
|-----------|----------|----------|
| "work on" | start-new-work | WORKFLOWS.md |
| "fix bug" | fix-problem | WORKFLOWS.md |
| "commit" | create-commit-message | WORKFLOWS.md |
```

### 2. Quick Navigation Paths
Pre-defined search patterns:
```
COMMON_FLOWS = {
  "start_work": "mcp__serena__find_symbol --name_path 'Handler: start-new-work'",
  "fix_bug": "mcp__serena__find_symbol --name_path 'Handler: fix-problem'",
  "commit": "mcp__serena__find_symbol --name_path 'Handler: create-commit-message'"
}
```

### 3. Handler Naming Convention
Standardize handler names to match common phrases:
- work-on-X → Handler: work-on
- fix-bug-Y → Handler: fix-bug
- search-for-Z → Handler: search-for

### 4. Navigation Flow Diagrams
Add visual aids to templates showing common paths.

## Search Iteration Analysis

### Current Navigation Flow
Example: User says "work on user authentication"

1. **Search 1**: Find where handler might be
   ```
   search "work on" in REGISTRY → Multiple results
   ```

2. **Search 2**: Check WORKFLOWS.md 
   ```
   search "Handler: start-new-work" → Find full handler
   ```

3. **Search 3**: Check for behaviors
   ```
   search "development work" in BEHAVIORS.md → Find enforcement
   ```

4. **Search 4**: Check conventions
   ```
   search "work folder" in CONVENTIONS.md → Find naming rules
   ```

**Total**: 4 searches for one request!

### Common Request Search Counts
| User Request | Current Searches | Ideal |
|--------------|------------------|-------|
| "work on X" | 3-4 | 1 |
| "fix bug Y" | 2-3 | 1 |
| "commit changes" | 3-4 | 1 |
| "search for Z" | 2-3 | 1 |
| "edit file" | 3-4 | 1 |
| "create test" | 2-3 | 1 |

### Why So Many Searches?
1. **Ambiguous triggers** - Same phrase in multiple contexts
2. **Handler name mismatch** - User phrase ≠ handler name
3. **Cross-file dependencies** - Need to check multiple templates
4. **Missing direct routes** - No phrase→handler index

## Implementation Strategy

### Option 1: Enhanced REGISTRY.md (Static)
Add keyword-based sections to REGISTRY.md that I can search:

```markdown
## 🔍 Navigation Keywords

### Work/Development Keywords
**Keywords**: work, working, implement, build, create, develop, feature, component
**Handlers**: 
- start-new-work (primary for: work, build, feature)
- implement-feature (primary for: implement)
- create-component (primary for: component)

### Problem/Debug Keywords
**Keywords**: fix, bug, debug, error, issue, resolve, problem, failing
**Handlers**:
- fix-problem (primary for: fix, bug, resolve, issue)
- debug (primary for: debug)
- analyze-error (primary for: error, failing)
```

### Option 2: CLAUDE.md Navigation Logic
Add smart navigation to CLAUDE.md execution engine:

```markdown
### Smart Navigation Protocol

When receiving a request:
1. Extract key terms (remove: the, a, to, please, etc.)
2. Search for keywords in Navigation Keywords section
3. Score matches based on keyword presence
4. If clear winner → load handler
5. If ambiguous → check decision tree
6. If still unclear → ask user

Example Flow:
User: "I need to resolve the login issue"
1. Keywords: [resolve, login, issue]
2. Search: "resolve" → fix-problem handler
3. Search: "issue" → fix-problem handler
4. High confidence → Load fix-problem
```

### Option 3: New NAVIGATION.md Template
Create dedicated navigation template:

```markdown
# Navigation Template

## Keyword → Handler Mapping

### Action Verbs
- work, working → start-new-work
- implement, implementing → implement-feature  
- fix, fixing, resolve → fix-problem
- debug, debugging → debug
- search, find, locate → search-code or find-symbol
- edit, modify, update → edit-file
- commit, save → commit-changes or create-commit-message

### Object Nouns
- bug, issue, problem → fix-problem
- feature, functionality → start-new-work
- component, widget → create-component
- error, failure → analyze-error
- test, tests → test-implementation
```

### Recommended Implementation

**Phase 1: Quick Win**
1. Add Navigation Keywords section to REGISTRY.md
2. Update CLAUDE.md to search keywords first
3. Fall back to current search if no match

**Phase 2: Smart Routing**  
1. Create NAVIGATION.md with comprehensive mappings
2. Add keyword extraction logic to CLAUDE.md
3. Implement scoring system

**Phase 3: Learning System**
1. Track successful navigations
2. Update mappings based on usage
3. Add common variations