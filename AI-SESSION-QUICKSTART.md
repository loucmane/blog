# 🚀 AI Session Quick Start Guide

You're all set! Here's how to use your new AI session tracking system:

## 📝 Basic Usage

### Starting a Session
When you begin working with an AI assistant:
```bash
ai-start "Implementing user authentication"
```

### Logging Progress
As you work, note what you're doing:
```bash
ai-log "Added login form component"
ai-log "Set up JWT token handling"
ai-log "STUCK: Need to figure out refresh token logic"
```

### Checking Status
See your current session:
```bash
ai-status
```

### Ending a Session
When you're done or taking a break:
```bash
ai-end
```

## 🎯 Real Example

Here's what a typical session looks like:

```bash
# Start working on a feature
ai-start "Add dark mode toggle to settings"

# Log as you go
ai-log "Created DarkModeSwitch component"
ai-log "Added theme context provider"
ai-log "Updated CSS variables for dark theme"

# Check your progress
ai-status

# Save your work
ai-save  # Quick commit everything

# Or commit just the SESSION.md
ai-commit  # Creates commit with your task name

# End when done
ai-end
```

## 📋 Your SESSION.md File

After using these commands, your SESSION.md will look like:

```markdown
## Session Started - 2025-01-06 15:30
Task: Add dark mode toggle to settings
- 15:32: Created DarkModeSwitch component
- 15:45: Added theme context provider  
- 16:10: Updated CSS variables for dark theme

### Session Ended - 16:30
```

## 💡 Tips

1. **Be specific** in your logs - future you will thank you
2. **Log when stuck** - helps AI assistants understand blockers
3. **Use ai-save frequently** - don't lose work
4. **One task per session** - keeps things focused

## 🔧 Available Commands

- `ai-start "task"` - Begin new session
- `ai-log "message"` - Add progress note
- `ai-status` - Show current session
- `ai-end` - Close session
- `ai-commit` - Commit SESSION.md
- `ai-save` - Quick commit all changes
- `ai-help` - Show command help

## 🎉 That's It!

You now have a simple but effective AI session tracking system. Start using it right away - the best system is the one you actually use!

Next time you work with Claude or any AI:
1. Run `ai-start "what you're working on"`
2. Use `ai-log` to track progress
3. Run `ai-end` when done

Your future self (and your team) will love having this context!