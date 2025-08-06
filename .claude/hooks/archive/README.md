# ULTRATHINK Hook Enforcement System

## 🎯 Purpose
Eliminates the need for manual ULTRATHINK reminders by technically enforcing the protocol.

## 🔧 How It Works

### Flow:
1. **User Request** → `user_prompt_submit.py` detects if it's development work
2. **Tool Usage** → `pre_tool_use.py` blocks dev tools without ULTRATHINK
3. **ULTRATHINK** → Once proper format used, tools work normally
4. **Cleanup** → `stop.py` validates and resets for next conversation

### State Management
- State tracked in `logs/state.json`
- Persists across the conversation
- Cleared at end of each conversation

## 🧪 Testing

Run the test script to see it in action:
```bash
cd .claude/hooks
./test_enforcement.sh
```

## 🚫 What Gets Blocked
Development tools when ULTRATHINK not completed:
- Bash
- Edit, Write, MultiEdit
- Read
- Grep, Glob

## ✅ Always Allowed
- TodoWrite
- Other non-development tools
- All tools after ULTRATHINK completed

## 📝 Required Format
```
Let me ultrathink about this... [S:X|W:Y|H:searching|E:pending]
```

## 🐛 Debugging
- Check `logs/state.json` for current state
- Check `logs/stop_hook.json` for validation history
- All hooks fail gracefully (exit 0) on errors