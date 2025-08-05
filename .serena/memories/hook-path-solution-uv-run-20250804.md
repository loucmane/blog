# Hook Path Resolution Solution - 2025-08-04

## Problem
Claude Code hooks failing with error:
```
● Stop [hooks/stop.py] failed with non-blocking status code 127: /bin/sh: 1: hooks/stop.py: not found
```

## Root Cause
- Claude Code executes hook commands through shell
- Direct Python script paths (even absolute) don't work as shell commands
- Shell needs an executable command, not a script path

## Solution
Use `uv run` to execute Python scripts:

```json
{
  "hooks": {
    "UserPromptSubmit": [{
      "hooks": [{
        "type": "command",
        "command": "uv run .claude/hooks/user_prompt_submit.py"
      }]
    }],
    "PreToolUse": [{
      "matcher": "Edit|Write|MultiEdit",
      "hooks": [{
        "type": "command",
        "command": "uv run .claude/hooks/pre_tool_use.py"
      }]
    }],
    "Stop": [{
      "hooks": [{
        "type": "command",
        "command": "uv run .claude/hooks/stop.py"
      }]
    }]
  }
}
```

## Key Points
1. Use `uv run` as the command (executable in PATH)
2. Use relative paths from project root `.claude/hooks/...`
3. No need for absolute paths or $CLAUDE_PROJECT_DIR
4. Working example: https://github.com/disler/claude-code-hooks-mastery

## Why It Works
- `uv` is executable in PATH
- `uv run` knows how to execute Python scripts with dependencies
- Relative paths work because Claude Code runs from project root