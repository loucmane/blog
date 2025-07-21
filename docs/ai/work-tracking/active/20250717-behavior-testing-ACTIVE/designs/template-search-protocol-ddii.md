# Template Search Protocol DDII

## Document Status
- **Date**: 2025-07-21
- **Author**: Claude
- **Status**: Draft
- **Type**: Enhancement to CLAUDE.md

## Problem Statement

Currently, Claude often searches for handlers and conventions in the wrong template files, missing critical information needed for proper execution. This leads to:

1. **Incomplete handler loading** - Finding handler names but not their full definitions
2. **Missing cross-references** - Not loading related conventions when handlers reference them
3. **Inefficient searching** - Searching randomly rather than systematically
4. **False negatives** - Giving up when initial search fails despite information existing elsewhere

Example: When checking gac conventions, Claude searched in wrong files and missed the quotation mark rule in CONVENTIONS.md, leading to incorrect commit messages.

## Discovery Context

Through behavior testing and the narrative checkpoint implementation, we discovered that even with sophisticated trigger detection and enforcement mechanisms, the system fails when the correct information isn't found in the first place. The template navigation protocol exists but lacks comprehensive search strategies.

## Decision Rationale

We need a comprehensive template search protocol that:
1. **Enforces systematic searching** - Mandatory search order with REGISTRY first
2. **Provides fallback strategies** - When primary search fails
3. **Requires verification** - Confirming complete handler loaded
4. **Handles cross-references** - Loading related templates when referenced

This creates a "cannot proceed without finding" enforcement similar to our successful narrative checkpoint approach.

## Implementation Design

### 0. Complete Template File Index

**All Template Files** (in .claude/templates/):
1. **REGISTRY.md** - Master index of all handlers
2. **WORKFLOWS.md** - Development processes and workflows
3. **TOOLS.md** - Tool selection and usage patterns
4. **CONVENTIONS.md** - Standards, rules, and formats
5. **PATTERNS.md** - Meta-routing and complex patterns
6. **BUILDING-BETTER.md** - Integration and system connections
7. **MATRICES.md** - Decision support matrices
8. **BEHAVIORS.md** - Automatic enforcement hooks
9. **HANDLERS.md** - Unified handler view (alternate index)
10. **PROJECT-BLOG.md** - Project-specific patterns and rules

**Root Template**:
11. **CLAUDE.md** - The execution engine itself

### 1. Search Order Protocol

```markdown
CRITICAL: I CANNOT PROCEED without finding the correct handler through systematic search.

SEARCH ORDER (mandatory sequence):
1. REGISTRY.md - Always first, no exceptions
2. Target template from REGISTRY result
3. Related templates if needed (see matrix below)
4. PATTERNS.md for meta-routing if stuck
```

### 2. Search Strategy

```markdown
A) Primary Search in REGISTRY:
   - Try exact match: "[full action phrase]"
   - Try verb only: "implement", "fix", "test"
   - Try noun only: "bug", "feature", "component"
   - Try variations: "implement" → "create", "build", "add"

B) If REGISTRY returns multiple results:
   - Read ALL matches to find best fit
   - Check handler descriptions, not just names
   - Prefer handlers with matching trigger examples

C) If REGISTRY returns nothing:
   - Search PATTERNS.md for similar requests
   - Check Navigation Keywords section again
   - Use fallback matrix below
```

### 3. Common Search Failures to Avoid

**Historical Failure Patterns**:
1. **Wrong Keyword Variations**
   - ❌ Searching for "gac" instead of "git.*commit" or "commit.*format"
   - ❌ Looking for exact "fix bug" instead of "fix" or "debug" separately
   - ❌ Missing plurals: "handler" vs "handlers"

2. **Wrong File Assumptions**
   - ❌ Assuming all handlers are in WORKFLOWS.md
   - ❌ Looking for git conventions in TOOLS.md instead of CONVENTIONS.md
   - ❌ Skipping PROJECT-BLOG.md for project-specific rules

3. **Incomplete Searches**
   - ❌ Stopping after first result without checking if it's the right one
   - ❌ Not following "see also" or cross-references
   - ❌ Missing handlers that span multiple lines

4. **Context Loss**
   - ❌ Finding handler name but not loading full definition
   - ❌ Loading handler but not related conventions
   - ❌ Missing pre-conditions or success criteria

### 4. Fallback Matrix

| If searching for... | Also check these templates |
|-------------------|---------------------------|
| Development work | WORKFLOWS.md, TOOLS.md |
| Conventions/rules | CONVENTIONS.md, BUILDING-BETTER.md |
| Tool selection | TOOLS.md, MATRICES.md |
| Error handling | MATRICES.md (Error→Recovery) |
| Git operations | TOOLS.md, CONVENTIONS.md |
| Testing | WORKFLOWS.md, TOOLS.md |
| Documentation | CONVENTIONS.md, WORKFLOWS.md |

### 5. Handler Loading with Anchors

```markdown
LOADING PROTOCOL WITH ANCHORS:
1. Find anchor reference in REGISTRY:
   - Example: "fix-problem handler at WORKFLOWS.md#fix-problem"
   - Note the file and anchor name

2. Search for the anchor in the file:
   mcp__serena__search_for_pattern --substring_pattern "{#fix-problem}" --relative_path ".claude/templates/WORKFLOWS.md"
   
   This finds the exact location of:
   #### Handler: fix-problem {#fix-problem}

3. Read from that location:
   - Use the line number from search result
   - Read handler content with appropriate context

4. VERIFY the handler loaded by checking:
   - Process section exists and has numbered steps
   - Pre-conditions are listed
   - Success/Failure criteria defined
   - Must quote "first 10 words" of Process section

5. Follow anchor cross-references:
   - If handler mentions "see #gac-format" → search for "{#gac-format}"
   - Build complete context from all referenced anchors

ANCHOR SEARCH EXAMPLES:
✅ Good: "Searching for {#fix-problem} in WORKFLOWS.md... found at line 234"
✅ Good: "Following cross-reference by searching for {#gac-format}"

❌ Bad: "Using fix-problem handler" (didn't search for anchor)
❌ Bad: "Searching for 'fix-problem'" (forgot the {# } syntax)

ADVANTAGES OF THIS APPROACH:
- Anchors are unique search patterns (unlikely to match anything else)
- Works with existing Serena tools
- Provides exact location just like line numbers
- But survives all edits unlike line numbers
```

### 6. Cross-Reference Execution

```markdown
EXECUTION PROTOCOL:
1. Follow ALL steps in exact order
2. When handler references other templates:
   - "Check conventions" → Load from CONVENTIONS.md
   - "Use appropriate tool" → Load from TOOLS.md
   - "Follow workflow" → Load from WORKFLOWS.md
3. Never skip cross-references
4. Document which templates were checked
```

### 7. Enforcement Mechanisms

```markdown
ENFORCEMENT: Cannot Proceed Without
1. NO handler found → Ask user for clarification
2. NO Process section → Search for complete handler
3. NO verification → Re-read handler and verify
4. NO cross-reference → Load referenced template
```

## Integration Points

### 1. Placement in CLAUDE.md
Replace the current "Find the Right Handler" section (lines 106-117) with the comprehensive protocol.

### 2. Connection to Narrative Checkpoint
The search protocol feeds directly into Chapter 1 of the narrative checkpoint, ensuring handlers are found before execution begins.

### 3. Behavioral Hooks
Add to BEHAVIORS.md:
- Before handler execution → Verify complete handler loaded
- Before tool use → Check tool selection matrix loaded
- Before git operations → Ensure conventions loaded

## Success Criteria

1. **No more "handler not found" when it exists**
2. **Complete handlers loaded with all sections**
3. **Related conventions automatically loaded**
4. **Systematic search pattern observable in logs**
5. **Clear user feedback when truly not found**

## Risk Analysis

### Risks
1. **Increased search time** - Multiple searches may slow initial response
2. **Token usage** - Loading multiple templates uses more context
3. **Complexity** - More steps to follow

### Mitigations
1. **Search time** - Most requests hit on first REGISTRY search
2. **Token usage** - Only load what's needed based on handler references
3. **Complexity** - Clear protocol makes it mechanical, not complex

## Example Scenario

User: "help me fix the login bug"

1. Search REGISTRY for "fix" → find "fix-problem" handler
2. Load handler from WORKFLOWS.md
3. Handler says "gather evidence" → load search tools from TOOLS.md
4. Handler says "test the fix" → load test handlers
5. All information gathered before execution begins

## Next Steps

1. Review and refine this design
2. Implement in CLAUDE.md
3. Test with various request types
4. Document results in FINDINGS.md
5. Iterate based on testing

## Open Questions

1. Should we cache frequently used handlers?
2. How deep should fallback searches go?
3. Should we create a handler dependency graph?

## Enhancement: Universal Index in REGISTRY.md

### Current State
REGISTRY.md currently indexes:
- Handler names and locations
- Navigation keywords
- Basic trigger patterns

### Proposed Enhancement - CHOSEN APPROACH: Anchors
Transform REGISTRY.md into a comprehensive index using markdown anchors:

```markdown
## Universal Template Index

### Handlers
[Current handler index with anchors]

### Conventions
| Convention | Location | Keywords |
|------------|----------|----------|
| gac format | [CONVENTIONS.md#gac-format](#conventions-gac) | git, commit, message |
| File naming | [CONVENTIONS.md#file-naming](#conventions-files) | naming, files, conventions |
| Timestamps | [CONVENTIONS.md#timestamp-format](#conventions-time) | date, time, timestamp |

### Tool Patterns  
| Pattern | Location | Keywords |
|---------|----------|----------|
| Search tools | [TOOLS.md#search-tools](#tools-search) | serena, grep, search |
| Edit tools | [TOOLS.md#edit-operations](#tools-edit) | edit, write, modify |

### Behaviors
| Behavior | Location | Trigger |
|----------|----------|---------|
| Work tracking | [BEHAVIORS.md#work-tracking](#behaviors-work) | before file edit |
| Git operations | [BEHAVIORS.md#git-operations](#behaviors-git) | before commit |

### Project-Specific
| Rule | Location | Applies to |
|------|----------|------------|
| Component patterns | [PROJECT-BLOG.md#components](#project-components) | *.tsx files |
| API conventions | [PROJECT-BLOG.md#api-rules](#project-api) | /api/* routes |
```

**Implementation Plan**:

1. **Add anchors to all template files**:
   ```markdown
   #### Handler: gac {#gac-format}
   
   <!-- or for sections without existing IDs -->
   <a id="file-naming"></a>
   ### File Naming Conventions
   ```

2. **Update REGISTRY.md with anchor links**:
   - Each entry links to specific anchor
   - Format: `[Display Text](file.md#anchor)`
   - Enables IDE navigation (Ctrl+click)

3. **Anchor naming convention**:
   - Handlers: `#handler-name` (e.g., `#start-new-work`)
   - Conventions: `#conv-topic` (e.g., `#conv-timestamps`)
   - Behaviors: `#behavior-name` (e.g., `#behavior-work-tracking`)
   - Tools: `#tool-category` (e.g., `#tool-search`)

**Why Anchors Are The Best Choice**:
- ✅ Permanent references that survive any edit
- ✅ IDE navigation support (critical for productivity)
- ✅ Works with existing markdown structure
- ✅ Can be added incrementally
- ✅ Standard markdown feature (not custom syntax)
- ✅ GitHub/GitLab render them as clickable links
- ✅ Can coexist with current system during migration

## Alternative Approaches (Preserved for Future Scaling)

### Automated Index Generation (The "Correct" Engineering Solution)
**When to reconsider**: If the project grows to 50+ templates or multiple teams contribute

**Implementation approach**:
```javascript
// scan-templates.js
const scanTemplates = () => {
  const index = {
    handlers: [],
    conventions: [],
    behaviors: [],
    tools: []
  };
  
  // Scan all .md files in templates/
  // Extract sections with patterns like:
  // - #### Handler: name
  // - ### Convention: name
  // - ## Behavior: name
  
  // Generate REGISTRY.md with:
  // - Exact line numbers (auto-updated)
  // - Section content preview
  // - Dependency graph
  // - Last modified dates
  
  return generateMarkdown(index);
};

// Run as pre-commit hook or CI job
```

**Benefits at scale**:
- Always 100% accurate line numbers
- Can generate dependency graphs
- Can validate handler completeness
- Can track template changes over time
- Could generate TypeScript types for handlers

### Search Patterns (Original Fallback)
**When to use**: Quick fixes, temporary references, or when anchors aren't added yet

**Example patterns**:
- `"Handler: [name]"` for handlers
- `"Convention:.*gac"` for conventions  
- `"Before.*File.*Operations"` for behaviors

### Semantic Markers
**When to reconsider**: If building a template framework or API

**Example**:
```markdown
[TEMPLATE: handler, id: fix-problem, type: workflow, deps: [search-code, test-fix]]
#### Handler: fix-problem
```

Could enable:
- Template API generation
- Automated testing of templates
- Template versioning
- External tool integration

## References

- Current template navigation: CLAUDE.md lines 96-126
- Anchor system docs: https://www.markdownguide.org/extended-syntax/#heading-ids
- Handler registry: .claude/templates/REGISTRY.md
- Narrative checkpoint: CLAUDE.md lines 56-93
- Related finding: FINDINGS.md line 41-45