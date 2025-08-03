# Hook System Critical Fixes - 2025-08-03

## What Happened
After implementing hook-template integration on 2025-08-02, discovered hooks weren't executing. Used `/doctor` command to diagnose.

## Critical Discoveries

### 1. Invalid Hook Type
- **Issue**: `AssistantResponse` is NOT a valid hook type
- **Impact**: Prevented ALL hooks from loading
- **Fix**: Removed from `.claude/settings.json`
- **Valid types**: PreToolUse, PostToolUse, Notification, UserPromptSubmit, SessionStart, Stop, SubagentStop, PreCompact

### 2. Over-Blocking Problem
- **Issue**: PreToolUse matcher includes `Bash|Edit|Write|MultiEdit|Read|Grep|Glob`
- **Impact**: Blocks 11 tools including Read/Bash (should never block these)
- **Fix Needed**: Change to `Edit|Write|MultiEdit` only
- **Evidence**: Stop hook reported "11 tool(s) were blocked"

### 3. State Persistence Bug
- **Issue**: Old trigger "implement user authentication" stuck from 2025-08-02
- **Impact**: Forces ULTRATHINK even for reading files
- **Fix Needed**: Clear state after successful ULTRATHINK

## Why Subagents Worked
- Subagents run fresh with corrected config
- Main assistant was in session with broken config
- Restart fixed the loading issue

## Next Steps
1. Fix PreToolUse matcher pattern
2. Implement state clearing logic
3. Test hooks work without over-blocking