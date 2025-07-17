# Implementation Plan: CLAUDE.md with Serena Integration

## Core Design: Dynamic Template Search

### Structure
```markdown
# Claude Execution Engine with Dynamic Template Loading

I process requests by dynamically searching templates with Serena.

## Request Processing Protocol

When I receive any request, I:
1. Detect the intent and keywords
2. Search relevant template sections with Serena
3. Load and execute the found handlers
4. Track progress appropriately

## Intent Recognition & Search Patterns

### Development Work
Keywords: implement, build, create, work on
Search: `mcp__serena__search_for_pattern --substring_pattern "Handler: start-new-work" --relative_path ".claude/templates/WORKFLOWS.md"`

### Problem Solving
Keywords: fix, debug, error, issue
Search: `mcp__serena__search_for_pattern --substring_pattern "Handler: fix-problem" --relative_path ".claude/templates/WORKFLOWS.md"`

### Code Search
Keywords: find, where, locate, search
Search: `mcp__serena__search_for_pattern --substring_pattern "search-code" --relative_path ".claude/templates/TOOLS.md"`

### Git Operations
Keywords: commit, push, merge, PR
Search: `mcp__serena__search_for_pattern --substring_pattern "git conventions" --relative_path ".claude/templates/CONVENTIONS.md"`

## Cached Core Knowledge

While I search for specifics, I always remember:
- Work tracking goes in docs/ai/work-tracking/active/
- Use 6-file structure for all work
- Edit/Write for files (never Serena)
- TodoWrite for task tracking
- Single quotes in git commits

## Execution Flow Example

When you say "implement user authentication":
1. I recognize "implement" → development work
2. I search: WORKFLOWS.md for "start-new-work"
3. I find: Create folder 20250715-user-authentication-ACTIVE/
4. I execute: Create 6 files, initialize todos, begin work
```

### Key Benefits
1. **Lean CLAUDE.md** - Only ~100 lines needed
2. **Dynamic loading** - Always current with templates
3. **Context efficient** - Load only what's needed
4. **Searchable** - Can find any pattern quickly

### Implementation Steps
1. Create minimal CLAUDE.md with search patterns
2. Test each intent type
3. Verify Serena searches return correct handlers
4. Ensure execution follows loaded patterns

## 2025-07-15 16:10 CEST - Behavioral Injection Approach

### The Real Solution: Automatic Behavioral Hooks

Instead of "I should check templates", make it "I cannot proceed without checking":

```markdown
# Claude Execution Engine - Behavioral Injection

## Automatic Processing Gates

### File Operation Gate
Before I can edit/create any file, this check runs:
1. File type recognition → Triggers convention search
2. Tool selection → Must verify against TOOLS.md
3. Only then → Operation proceeds

### Implementation Gate  
Before I can write any code, this check runs:
1. Task decomposition → Triggers workflow search
2. Work folder check → Must verify/create structure
3. Only then → Coding begins

### Response Formation Gate
Before I can answer, this check runs:
1. Claim detection → Triggers evidence requirement
2. Problem detection → Triggers pattern search
3. Only then → Response generated
```

### Why This Works
- Gates are blocking - can't skip
- Checks are automatic - not voluntary
- Searches are required - not optional
- Like a pre-commit hook for my brain

## 2025-07-15 16:30 CEST - Final Implementation

### What We Built

1. **REGISTRY.md** - Complete index of all 73+ handlers
   - Quick navigation by category
   - Tool selection matrix
   - Common commands reference
   - Designed for fast Serena searches

2. **CLAUDE.md** - Execution engine with template navigation
   - Shows exact Serena commands to use
   - Behavioral hooks that block until checked
   - Common request flows with examples
   - Natural conversation detection

### Key Design Elements

#### Template Navigation Protocol
```
1. Quick Intent Check (casual vs development)
2. Find Handler in REGISTRY
3. Load Handler from Template
4. Execute Handler Completely
```

#### Behavioral Hooks
- Before File Edit → Check conventions
- Before Implementation → Load workflow
- Before Tool Use → Verify selection
- Before Claims → Gather evidence

#### Enforcement Mechanism
Changed from "I should check" to "I cannot proceed without checking"
Makes template usage automatic and unavoidable.

### Success Criteria Met
- ✅ Uses templates without embedding everything
- ✅ Shows exact search commands
- ✅ Makes checking automatic not voluntary
- ✅ Preserves natural conversation mode
- ✅ Comprehensive registry for all handlers