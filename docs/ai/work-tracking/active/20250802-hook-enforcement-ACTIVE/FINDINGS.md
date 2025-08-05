# Hook Enforcement Findings

## Hook System Capabilities
- Hooks execute at specific lifecycle points
- Can block (exit 2), warn (exit 1), or continue (exit 0)
- Communicate via JSON over stdin/stdout
- stderr for error messages shown to user

## Key Hook Types
1. **UserPromptSubmit** - Perfect for detecting development requests
2. **PreToolUse** - Can block tools without proper setup
3. **Stop** - Final validation and cleanup
4. **SessionStart** - Initialize enforcement state

## Implementation Patterns
- All hooks use `#!/usr/bin/env -S uv run --script`
- Graceful error handling is critical
- State via JSON files in logs/ directory
- Modular utils for shared functionality

## Security Insights
From pre_tool_use.py:
- Comprehensive regex for dangerous commands
- Pattern normalization for reliable matching
- Multiple validation layers
- Clear blocking messages

## ULTRATHINK Enforcement Strategy
1. Detect development triggers in UserPromptSubmit
2. Set state flag requiring ULTRATHINK
3. Block tools in PreToolUse if no ULTRATHINK
4. Validate in Stop hook
5. Clear state on success

## CRITICAL DISCOVERY - Hook Execution Fix (2025-08-05)
**Problem**: Hooks were not executing despite correct configuration
**Root Cause**: Command format in settings.json was incompatible with Claude Code

### What Didn't Work
```json
"command": "uv run $CLAUDE_PROJECT_DIR/.claude/hooks/user_prompt_submit.py"
```
- `$CLAUDE_PROJECT_DIR` was not being set by Claude Code
- `uv run` might not be in PATH during hook execution

### What Fixed It
```json
"command": "python3 .claude/hooks/user_prompt_submit.py"
```
- Direct Python execution works reliably
- Relative paths work because Claude Code runs hooks from project root
- No dependency on environment variables

### Evidence of Success
- PreToolUse hook immediately started blocking operations
- State updates properly in logs/state.json
- Helpful error messages display when ULTRATHINK is missing
- Multiple blocked attempts tracked correctly

### Key Lessons
1. Keep hook commands simple - avoid complex shell constructs
2. Use direct executables (python3) not wrapper scripts (uv)
3. Relative paths are more reliable than environment variables
4. Test hooks both manually AND in Claude Code context