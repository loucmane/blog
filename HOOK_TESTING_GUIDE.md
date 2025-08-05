# Claude Code Hook System Testing Guide

## Overview

The Claude Code hook system enforces the ULTRATHINK protocol for development work. This guide explains how to test and validate the hook system.

## Quick Start

Run the comprehensive test suite:
```bash
./run_hook_tests.sh
```

## Hook System Components

### 1. UserPromptSubmit Hook
- **Purpose**: Detects development requests and sets `ultrathink_required` flag
- **Triggers**: Keywords like "implement", "fix", "debug", "test", etc.
- **State**: Updates `logs/state.json` with trigger information

### 2. PreToolUse Hook
- **Purpose**: Blocks development tools (Edit, Write, MultiEdit) without ULTRATHINK
- **Allows**: Non-development tools (Read, Grep, etc.) always pass through
- **Format**: Validates S:W:H:E format in messages

### 3. Stop Hook
- **Purpose**: Validates ULTRATHINK compliance and generates analytics
- **Analytics**: Tracks success/failure rates in `logs/analytics.json`
- **Cleanup**: Resets state for next conversation

## Test Scenarios

### Manual Testing

1. **Test Development Detection**:
   ```
   User: "implement a new login feature"
   Expected: Sets ultrathink_required = true in state.json
   ```

2. **Test Tool Blocking**:
   ```
   User: "fix the bug in auth.js"
   AI: *tries to Edit without ULTRATHINK*
   Expected: Hook blocks with error message
   ```

3. **Test ULTRATHINK Compliance**:
   ```
   User: "create a new component"
   AI: "Let me ultrathink about this... [S:20250804|W:development|H:create-component|E:5/'tests pass']"
   AI: *proceeds with Edit/Write tools*
   Expected: Tools allowed, state shows completed = true
   ```

### Automated Tests

The test suite (`test_hook_system.js`) covers:

- ✅ Development trigger detection (explicit, implicit, file context)
- ✅ Handler suggestion generation
- ✅ Tool blocking without ULTRATHINK
- ✅ Tool allowing with ULTRATHINK
- ✅ Handler validation warnings
- ✅ Session cleanup and analytics
- ✅ State persistence across calls
- ✅ Edge cases (empty input, invalid JSON, corrupted state)

## State File Structure

```json
{
  "session": {
    "id": "20250804",
    "started_at": "2025-08-04T10:00:00.000Z",
    "last_activity": "2025-08-04T10:15:00.000Z"
  },
  "ultrathink": {
    "required": true,
    "completed": false,
    "statements": [],
    "blocked_attempts": 0,
    "trigger": {
      "type": "explicit",
      "keyword": "implement",
      "full_text": "implement user authentication",
      "confidence": 1.0
    },
    "handler_suggestions": [
      {"name": "create-component", "score": 4.5},
      {"name": "standard-dev-workflow", "score": 3.0}
    ]
  },
  "context": {
    "work_folders": [],
    "recent_searches": [],
    "tools_used": []
  }
}
```

## Debugging Hook Issues

1. **Check Hook Installation**:
   ```bash
   cat .claude/settings.json
   ```

2. **View Current State**:
   ```bash
   cat logs/state.json | jq .
   ```

3. **View Analytics**:
   ```bash
   cat logs/analytics.json | jq .
   ```

4. **Test Individual Hooks**:
   ```bash
   echo '{"user_prompt":"test message"}' | uv run .claude/hooks/user_prompt_submit.py
   ```

## Common Issues

### Hook Not Triggering
- Ensure `.claude/settings.json` has correct hook configuration
- Check that `uv` is installed and available
- Verify Python dependencies in hook scripts

### State Not Persisting
- Check `logs/` directory permissions
- Ensure `logs/state.json` isn't corrupted
- Clear state with `rm logs/state.json` if needed

### False Positives/Negatives
- Review trigger keywords in `user_prompt_submit.py`
- Check confidence thresholds for handler suggestions
- Adjust trigger patterns if needed

## Hook Configuration

The hooks are configured in `.claude/settings.json`:

```json
{
  "hooks": {
    "UserPromptSubmit": [{
      "hooks": [{
        "type": "command",
        "command": "uv run $CLAUDE_PROJECT_DIR/.claude/hooks/user_prompt_submit.py"
      }]
    }],
    "PreToolUse": [{
      "matcher": "Edit|Write|MultiEdit",
      "hooks": [{
        "type": "command",
        "command": "uv run $CLAUDE_PROJECT_DIR/.claude/hooks/pre_tool_use.py"
      }]
    }],
    "Stop": [{
      "hooks": [{
        "type": "command",
        "command": "uv run $CLAUDE_PROJECT_DIR/.claude/hooks/stop.py"
      }]
    }]
  }
}
```

## Extending the Tests

To add new test cases:

1. Edit `test_hook_system.js`
2. Add test function following the pattern:
   ```javascript
   function testNewFeature() {
     logSection('Testing New Feature');
     // Your test logic
     logTest('Test name', passed, 'Details');
   }
   ```
3. Call your function in `runAllTests()`

## Performance Considerations

- Hook execution adds ~50-200ms per trigger
- State file I/O is minimal (<1KB)
- Analytics file rotates at 100 entries
- Handler cache builds on first use (~100ms)

## Contributing

When modifying hooks:
1. Run full test suite
2. Test manually with real conversations
3. Update tests for new functionality
4. Document changes in this guide