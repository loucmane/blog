# Session 2025-07-13: Execution Engine Design

## Key Discovery
The protocol navigation system with 71 handlers fails because documentation doesn't create behavior. Even with perfect handlers, I skip navigation and violate rules I know (evidence: 3 append-only violations in a row).

## Solution Pattern
Analyzing successful commands (orchestrate-and-test.md), they work because:
1. Self-contained execution logic
2. Load spec files but embed the execution
3. No external lookups during execution
4. Clear TASK blocks with full context

## New Approach
Transform CLAUDE.md into execution engine:
- CLAUDE.md = Like command files (contains execution logic)
- Template files = Like spec files (contain handler definitions)
- CLAUDE.md says "Load handler from WORKFLOWS.md Section X"
- Templates contain the actual handlers

## Critical Insights
1. I default to Serena for everything (even when documenting not to)
2. Multi-step lookups get skipped
3. Need behavioral gates, not documentation
4. Auto-execution better than manual navigation

## Tool Usage Reality
- Serena: Only for code understanding
- Edit/Write: All file modifications (NOT Serena)
- Grep: Simple text searches
- Bash: Git and system commands

## Pre-Compaction Status
- Analyzed the problem thoroughly
- Designed execution engine approach
- Ready to create CLAUDE.md draft
- Need to test with real tasks post-compaction

## Resume Instructions
```
Activate project /home/loucmane/dev/javascript/MomsBlog/blog, read memory session_2025-07-13_execution_engine_design and SESSION.md.

Continue with: Create the CLAUDE.md execution engine draft based on our design discussions. Remember to use Edit tool for file modifications, not Serena.
```