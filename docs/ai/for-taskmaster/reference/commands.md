# TaskMaster Commands Reference

## Quick Reference Card

### Essential Commands
```bash
# What should I work on?
mcp__taskmaster-ai__next_task

# See all tasks
mcp__taskmaster-ai__get_tasks

# Check specific task with subtasks
mcp__taskmaster-ai__get_task --id 32

# Update task status
mcp__taskmaster-ai__set_task_status --id 5 --status in-progress
```

## Complete Command Reference

### 🏗️ Project Setup

#### initialize_project
```bash
mcp__taskmaster-ai__initialize_project \
  --projectRoot /absolute/path/to/project \
  --yes true
```
Creates `.taskmaster/` directory structure and initial configuration.

#### parse_prd
```bash
mcp__taskmaster-ai__parse_prd \
  --projectRoot $(pwd) \
  --input .taskmaster/docs/prd.txt \
  --numTasks 15 \
  --research true
```
Generates tasks from a product requirements document.

### 📋 Task Management

#### get_tasks
```bash
# All tasks
mcp__taskmaster-ai__get_tasks --projectRoot $(pwd)

# Filtered by status
mcp__taskmaster-ai__get_tasks --status pending

# With subtasks included
mcp__taskmaster-ai__get_tasks --withSubtasks true
```

#### get_task
```bash
# Specific task with subtasks
mcp__taskmaster-ai__get_task --id 32

# Filter subtasks by status
mcp__taskmaster-ai__get_task --id 32 --status pending
```

#### next_task
```bash
# Find highest priority available task
mcp__taskmaster-ai__next_task --projectRoot $(pwd)
```
Considers dependencies and priorities to suggest the best task to work on.

#### set_task_status
```bash
# Single task
mcp__taskmaster-ai__set_task_status --id 5 --status done

# Multiple tasks/subtasks
mcp__taskmaster-ai__set_task_status --id "5.1,5.2,5.3" --status done

# Status options: pending, in-progress, done, review, deferred, cancelled
```

### ✏️ Task Creation & Updates

#### add_task
```bash
# With AI assistance
mcp__taskmaster-ai__add_task \
  --prompt "Create user authentication system with OAuth" \
  --priority high \
  --research true

# Manual task creation
mcp__taskmaster-ai__add_task \
  --title "Implement password reset" \
  --description "Add forgot password flow" \
  --priority medium \
  --dependencies "5,6"
```

#### add_subtask
```bash
# AI-generated subtask
mcp__taskmaster-ai__add_subtask \
  --id 5 \
  --prompt "Add two-factor authentication"

# Manual subtask
mcp__taskmaster-ai__add_subtask \
  --id 5 \
  --title "Add SMS verification" \
  --description "Implement Twilio SMS for 2FA"
```

#### update_task
```bash
# Update single task with new context
mcp__taskmaster-ai__update_task \
  --id 5 \
  --prompt "Payment provider changed from Stripe to PayPal" \
  --research true
```

#### update (bulk update)
```bash
# Update all tasks from ID 10 onward
mcp__taskmaster-ai__update \
  --from 10 \
  --prompt "We're now using TypeScript instead of JavaScript"
```

#### update_subtask
```bash
# Append information to subtask
mcp__taskmaster-ai__update_subtask \
  --id "5.2" \
  --prompt "Discovered we need webhook signature validation"
```

### 🗑️ Task Removal

#### remove_task
```bash
# Remove single task/subtask
mcp__taskmaster-ai__remove_task --id 5 --confirm true

# Remove multiple
mcp__taskmaster-ai__remove_task --id "5.1,5.2" --confirm true
```

#### remove_subtask
```bash
# Remove and convert to standalone task
mcp__taskmaster-ai__remove_subtask --id "5.2" --convert true

# Just remove
mcp__taskmaster-ai__remove_subtask --id "5.2"
```

#### clear_subtasks
```bash
# Clear from specific task
mcp__taskmaster-ai__clear_subtasks --id 5

# Clear from all tasks
mcp__taskmaster-ai__clear_subtasks --all true
```

### 🔄 Task Organization

#### move_task
```bash
# Move single task/subtask
mcp__taskmaster-ai__move_task --from 5 --to 10

# Move multiple (must match count)
mcp__taskmaster-ai__move_task --from "5,6,7" --to "10,11,12"

# Move subtask to different parent
mcp__taskmaster-ai__move_task --from "5.2" --to "6.4"
```

#### expand_task
```bash
# Expand single task into subtasks
mcp__taskmaster-ai__expand_task \
  --id 5 \
  --num 5 \
  --research true

# With specific context
mcp__taskmaster-ai__expand_task \
  --id 5 \
  --prompt "Focus on mobile experience"
```

#### expand_all
```bash
# Expand all pending tasks
mcp__taskmaster-ai__expand_all \
  --projectRoot $(pwd) \
  --research true
```

### 🔗 Dependency Management

#### add_dependency
```bash
mcp__taskmaster-ai__add_dependency \
  --id 10 \
  --dependsOn 5
```

#### remove_dependency
```bash
mcp__taskmaster-ai__remove_dependency \
  --id 10 \
  --dependsOn 5
```

#### validate_dependencies
```bash
# Check for circular dependencies and missing tasks
mcp__taskmaster-ai__validate_dependencies --projectRoot $(pwd)
```

#### fix_dependencies
```bash
# Automatically fix invalid dependencies
mcp__taskmaster-ai__fix_dependencies --projectRoot $(pwd)
```

### 📊 Analysis & Reporting

#### complexity_report
```bash
# View task complexity analysis
mcp__taskmaster-ai__complexity_report --projectRoot $(pwd)

# Custom report location
mcp__taskmaster-ai__complexity_report \
  --file .taskmaster/reports/complexity.json
```

#### analyze_project_complexity
```bash
# Analyze specific tasks
mcp__taskmaster-ai__analyze_project_complexity \
  --ids "5,6,7" \
  --threshold 7

# Analyze range
mcp__taskmaster-ai__analyze_project_complexity \
  --from 5 \
  --to 15 \
  --research true
```

### 🎨 Generation

#### generate
```bash
# Generate individual task files from tasks.json
mcp__taskmaster-ai__generate --projectRoot $(pwd)
```

### 🔧 Configuration

#### models
```bash
# Check current configuration
mcp__taskmaster-ai__models --projectRoot $(pwd)

# Set models
mcp__taskmaster-ai__models \
  --setMain "claude-3-opus" \
  --setFallback "gpt-4" \
  --setResearch "perplexity"

# List available models
mcp__taskmaster-ai__models --listAvailableModels true
```

## Common Workflows

### Daily Development
```bash
# Morning
next_task=$(mcp__taskmaster-ai__next_task)
mcp__taskmaster-ai__set_task_status --id $task_id --status in-progress

# During work
mcp__taskmaster-ai__update_task --id $task_id --prompt "Found edge case..."

# End of day
mcp__taskmaster-ai__set_task_status --id $task_id --status done
```

### Sprint Planning
```bash
# Review available work
mcp__taskmaster-ai__get_tasks --status pending --priority high

# Analyze complexity
mcp__taskmaster-ai__complexity_report

# Expand complex tasks
mcp__taskmaster-ai__expand_task --id 10 --num 5
```

### Discovery & Adaptation
```bash
# Found new requirement
mcp__taskmaster-ai__add_subtask --id 5 --prompt "Need GDPR compliance"

# Scope changed
mcp__taskmaster-ai__update --from 10 --prompt "Using GraphQL instead of REST"

# Remove obsolete work
mcp__taskmaster-ai__remove_task --id "15,16,17" --confirm true
```

## Pro Tips

1. **Always use absolute paths** for projectRoot
2. **Comma-separate multiple IDs** without spaces: "5,6,7"
3. **Use research flag** for complex planning tasks
4. **Update tasks immediately** when you discover new information
5. **Check dependencies** before marking tasks complete

## Error Messages

### "Task not found"
- Check task ID with `get_tasks`
- Ensure you're in the right project

### "Circular dependency detected"
- Run `validate_dependencies`
- Use `fix_dependencies` to auto-resolve

### "Invalid status"
- Valid statuses: pending, in-progress, done, review, deferred, cancelled

### "No tasks match criteria"
- Check your filters
- Ensure tasks exist with `get_tasks`