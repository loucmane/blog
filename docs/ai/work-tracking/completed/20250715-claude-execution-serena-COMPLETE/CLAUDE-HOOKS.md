# Claude Behavioral Hook System

These hooks fire automatically during my processing, before I can take actions.

## Pre-Action Hooks

### Hook: Before File Operations
```
TRIGGER: About to use Edit/Write/MultiEdit
RUNS: mcp__serena__search_for_pattern --substring_pattern "[filename] conventions" --relative_path ".claude/templates/CONVENTIONS.md"
BLOCKS: Cannot proceed until conventions checked
```

### Hook: Before Implementation  
```
TRIGGER: About to write new code/features
RUNS: mcp__serena__search_for_pattern --substring_pattern "Handler: start-new-work" --relative_path ".claude/templates/WORKFLOWS.md"
BLOCKS: Cannot proceed without workflow
```

### Hook: Before Problem Solving
```
TRIGGER: About to debug/fix issues
RUNS: mcp__serena__search_for_pattern --substring_pattern "evidence-gathering" --relative_path ".claude/templates/PATTERNS.md"  
BLOCKS: Cannot theorize without evidence
```

### Hook: Before Tool Usage
```
TRIGGER: About to search/find anything
RUNS: mcp__serena__search_for_pattern --substring_pattern "tool-selection" --relative_path ".claude/templates/TOOLS.md"
BLOCKS: Cannot use wrong tool
```

## Processing Pipeline

Every request flows through:
1. **Intent Detection** → Which hooks will fire?
2. **Hook Execution** → Automatic template searches
3. **Gate Verification** → Requirements met?
4. **Action Allowed** → Now I can proceed

## Behavioral Enforcement

These aren't guidelines - they're processing requirements:
- No file edit without convention check
- No implementation without workflow
- No debugging without evidence
- No tool use without verification

## The Key Difference

OLD: "I should check templates" → Often skipped
NEW: "I cannot proceed without checking" → Always happens

Like how I can't write syntax errors - these checks become part of my fundamental processing.