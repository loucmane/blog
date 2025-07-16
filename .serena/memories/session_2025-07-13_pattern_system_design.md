# Pattern System Design Session - 2025-07-13

## Session Overview
Designed solution for why users need to constantly remind Claude about conventions (6-file structure, append-only rules, etc.)

## Problem Identified
Execution engine handles external requests well (92% success) but fails on internal patterns. I know the rules but nothing triggers me to follow them.

## Solution Development Process

### 1. Options Evaluated
- Option 1: Enhanced Execution Engine (more phases)
- Option 2: Behavioral Hooks (tool wrappers) - Rejected
- Option 3: Pattern Service (100% success in simulation)
- Option 4: Embedded Defaults (67% success)
- Option 5: Hybrid (Pattern Service + Defaults) - SELECTED

### 2. Key Discovery: The Query Problem
How does "Query PATTERNS.md" actually work? Can't literally parse file every time.

**Solution**: 3-Layer Architecture
1. Smart Routing (category detection)
2. Pattern Loading (only complex cases)
3. Handler Execution (existing templates)

### 3. Final Design

#### CLAUDE.md Addition (~35 lines):
```markdown
**SMART ROUTING** 🎯
work_signals = ["test", "implement", "build", "fix"]
file_signals = ["edit", "update", "modify", "append"]
tool_signals = ["search", "find", "where", "create"]
[Maps signals to categories]

**QUICK DEFAULTS** ⚡
If category = "work" → Check 6-file structure
If category = "file" → Check edit rules
If category = "tool" → Check tool matrix
[Handles 80% of cases instantly]
```

#### PATTERNS.md Structure:
- Location: .claude/templates/PATTERNS.md
- Organized by category (Work, File, Tool, Evidence, Complex, Meta)
- Each pattern uses standard handler format
- Routes to existing handlers (doesn't duplicate)

## Implementation Strategy
1. Detect category from signal words
2. Apply quick defaults (80% of cases)
3. Load PATTERNS.md#{category} for complex cases
4. Route to appropriate handler

## Key Insights
- Patterns are meta-handlers that route, not implement
- Category detection avoids the "query" problem
- Quick Defaults provide fast common path
- PATTERNS.md only loaded when needed

## Next Steps
1. Create PATTERNS.md in .claude/templates/
2. Update CLAUDE.md with Smart Routing + Quick Defaults
3. Test with scenarios from test plan
4. Document results and refine

Remember: The goal is to make internal patterns (6-file structure, append-only, etc.) part of natural execution flow!