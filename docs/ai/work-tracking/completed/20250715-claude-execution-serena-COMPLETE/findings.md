# Findings: Claude Execution with Serena

## 2025-07-15 15:41 CEST - Key Discovery

### Problem Analysis
- CLAUDE.md (414 lines) just references templates
- CLAUDE-OLD.md (1056 lines) works because everything is embedded
- Loading all templates would cause overhead

### Solution: Dynamic Serena Search
Use Serena to search templates on-demand:
1. Detect intent from request
2. Search for specific handler/pattern
3. Load only what's needed
4. Execute the loaded content

### Serena Search Examples
```bash
# Find specific handler
mcp__serena__search_for_pattern --substring_pattern "Handler: start-new-work" --relative_path ".claude/templates/WORKFLOWS.md"

# Find pattern
mcp__serena__search_for_pattern --substring_pattern "Pattern: work-activity" --relative_path ".claude/templates/PATTERNS.md"

# Find convention
mcp__serena__search_for_pattern --substring_pattern "git conventions" --relative_path ".claude/templates/CONVENTIONS.md"
```

### Benefits
- Minimal context usage
- Always up-to-date with templates
- Fast lookup of specific sections
- No duplication between CLAUDE.md and templates

## 2025-07-15 15:55 CEST - Learnings from Past Failures

### What Failed in Previous CLAUDE.md Attempts:
1. **Too Complex** - 73 handlers caused cognitive overload (July 12)
2. **Documentation ≠ Execution** - Perfect docs don't create behavior
3. **Multi-step lookups get skipped** - I take shortcuts naturally
4. **Fighting natural flow** - Systems against instincts fail
5. **Wrong tool defaults** - I use Serena for edits despite rules

### What Worked:
1. **Lean approach** - ~150 lines worked better than 400+ (July 10)
2. **Embedded execution** - Like orchestrate-and-test.md pattern
3. **5-7 core behaviors** - Human working memory limits apply
4. **Natural language** - "I wonder..." beats "YOU MUST"

### Key Insight:
Need behavioral gates that execute automatically, not documentation to check manually.

## 2025-07-15 16:30 CEST - Registry Creation Discoveries

### Registry Benefits:
1. **Fast Lookup** - All handlers indexed in one place
2. **Complete Coverage** - Found 73+ handlers across 5 template files
3. **Searchable Structure** - Organized by category and purpose
4. **Tool Matrix** - Quick reference for tool selection
5. **Usage Examples** - Shows exact search commands

### Template Statistics:
- WORKFLOWS.md: 24 intent handlers
- TOOLS.md: 18 tool selection handlers
- CONVENTIONS.md: 15 convention handlers
- PATTERNS.md: 13 execution patterns
- BUILDING-BETTER.md: 6 integration handlers

### Key Pattern Discovery:
The registry enables a two-step search process:
1. Search REGISTRY.md for handler name/location
2. Search specific template for full handler details

This is more efficient than searching all templates blindly.

## 2025-07-15 16:35 CEST - CLAUDE.md Design Insights

### What Makes It Work:
1. **Behavioral Hooks** - "Cannot proceed without" gates
2. **Exact Commands** - Shows literal Serena searches to run
3. **Common Flows** - Step-by-step internal process examples
4. **Natural Detection** - Skips protocols for casual chat
5. **Load on Demand** - Only loads what's needed when needed

### The Key Shift:
From: "I should check templates" (voluntary)
To: "I cannot proceed without checking" (mandatory)

This makes template usage as automatic as syntax checking - unavoidable and natural.