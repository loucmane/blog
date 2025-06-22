# TaskMaster Documentation

## Overview
TaskMaster is your AI-powered project management companion. It transforms ideas into actionable plans, tracks progress intelligently, and adapts as your project evolves.

## Quick Start
```bash
# What should I work on?
mcp__taskmaster-ai__next_task

# Check project status
mcp__taskmaster-ai__get_tasks --status in-progress

# Update progress
mcp__taskmaster-ai__set_task_status --id 5 --status done
```

## Directory Contents

### 📝 prompts/
Ready-to-use prompts for common scenarios:
- `project-planning.md` - Creating comprehensive project plans
- `task-management.md` - Daily task updates and tracking

### 💡 examples/
Real project stories:
- `twes-implementation.md` - How we managed the TWES project with discoveries and pivots

### 📋 guidelines/
Strategic guidance:
- `effective-planning.md` - Philosophy and patterns for successful project management

### 📚 reference/
Technical details:
- `commands.md` - Complete command reference with examples

### 🚀 taskmaster-infinite/
Advanced multi-agent task implementation system:
- `README.md` - Overview of the TaskMaster Infinite System
- `implementation-guide.md` - Step-by-step implementation guide
- `orchestrate-usage.md` - How to use the orchestrate-task command
- `implementation-notes.md` - Technical details and confidence assessment
- `worktree-example.md` - Practical example using git worktrees

## When TaskMaster Shines ✨

### Perfect For:
1. **Complex Project Planning**
   - Breaking down large initiatives
   - Managing dependencies
   - Balancing priorities

2. **Adaptive Development**
   - Capturing discoveries as you code
   - Updating plans based on learnings
   - Tracking evolving requirements

3. **Team Coordination**
   - Clear task ownership
   - Dependency management
   - Progress visibility

4. **Sprint Management**
   - Capacity planning
   - Priority balancing
   - Complexity analysis

### Not Ideal For:
- Simple personal todos → Use simpler tools
- Real-time collaboration → Use Jira/Linear/etc
- Gantt charts → Use MS Project/similar

## Core Concepts

### Tasks vs Subtasks
- **Tasks**: Major deliverables (1-2 weeks)
- **Subtasks**: Implementation details (1-3 days)

### Dependencies
- **Hard**: Can't start without
- **Soft**: Better to wait for
- **Resource**: Same person/system needed

### Status Flow
```
pending → in-progress → review → done
            ↓
         deferred/cancelled
```

## Power Workflows

### Morning Routine
```bash
# What's my priority?
mcp__taskmaster-ai__next_task

# See my active work
mcp__taskmaster-ai__get_tasks --status in-progress

# Dive into specifics
mcp__taskmaster-ai__get_task --id 5
```

### Discovery Management
```bash
# Found something new while coding
mcp__taskmaster-ai__add_subtask --id 5 \
  --prompt "Need to handle offline state"

# Scope changed significantly
mcp__taskmaster-ai__update --from 10 \
  --prompt "Customer wants mobile app too"
```

### Sprint Planning
```bash
# See what's available
mcp__taskmaster-ai__get_tasks --status pending --priority high

# Understand complexity
mcp__taskmaster-ai__complexity_report

# Break down big tasks
mcp__taskmaster-ai__expand_task --id 10
```

## Best Practices

### 1. Start High-Level
Don't over-plan initially. Add detail as you learn.

### 2. Update Immediately
When you discover something, capture it right away.

### 3. Use Meaningful Statuses
- `in-progress`: Actively working
- `review`: Needs feedback
- `deferred`: Consciously postponed

### 4. Leverage AI Assistance
Use `--research true` for informed planning.

## Integration Tips

### With Agent Tool
1. Plan feature with TaskMaster
2. Implement complex operations with Agent Tool
3. Update TaskMaster with discoveries
4. Use Agent to explore codebase when needed

### With Multi-AI Collab
1. Get Gemini's opinion on approach
2. Create tasks based on insights
3. Track implementation progress

## Common Patterns

### Feature Development
```
Task: [Feature Name]
├── Research & Design
├── Core Implementation  
├── Testing
├── Documentation
└── Polish & Optimization
```

### Bug Investigation
```
Task: Fix [Issue]
├── Reproduce locally
├── Investigate root cause
├── Implement fix
├── Add regression test
└── Verify in production
```

### Technical Debt
```
Task: Refactor [System]
├── Audit current state
├── Design new approach
├── Implement incrementally
├── Migrate data/state
└── Remove old code
```

## Remember
TaskMaster is about **clarity and adaptability**, not rigid planning. Use it to:
- Think clearly about what needs doing
- Track what you're learning
- Celebrate progress
- Adapt confidently

Your best plan is one that evolves with your understanding!