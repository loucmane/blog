# TaskMaster: Task Management Prompts

## Use Case
Managing ongoing development work, updating task status, and adapting plans based on discoveries.

## Core Management Prompts

### 1. Getting Current Status
```
What's the current state of my project?
- Show all in-progress tasks
- Highlight blocking dependencies
- List high-priority pending tasks
- Show recently completed work
```

### 2. Finding Next Task
```
What should I work on next?
- Consider dependencies
- Factor in priority
- Match my skills: [frontend/backend/design]
- Time available: [hours]
```

### 3. Updating Progress
```
Update task [ID] with progress:
- What I accomplished: [details]
- Challenges encountered: [issues]
- Next steps: [plan]
- New time estimate: [hours]
```

### 4. Adding Discovered Work
```
While working on [task], I discovered we need to:
- [New requirement 1]
- [New requirement 2]

Should these be:
- Subtasks of current task?
- New independent tasks?
- Added to backlog?
```

## Real-World Examples

### Example 1: Daily Standup Update
```
Update my tasks for daily standup:

Completed yesterday:
- Finished responsive layout for donation page (task 3.2)
- Fixed accessibility issues in navigation (task 1.5)

Working on today:
- Payment integration (task 3.3)
- Will need help with Stripe webhook setup

Blockers:
- Waiting for API credentials from payment provider
- Need design review on donation confirmation page
```

### Example 2: Scope Discovery
```
Working on task 5 (Animal Search), I discovered:

Additional requirements:
1. Need geolocation for "near me" searches
2. Requires filter state persistence
3. Should integrate with map view
4. Need to handle offline search

These feel substantial enough to be separate subtasks. Also, the geolocation feature might affect our privacy policy (task 8).

Please add appropriate subtasks and update dependencies.
```

### Example 3: Sprint Planning
```
Plan next sprint from available tasks:

Sprint capacity: 
- 2 developers × 5 days × 6 hours = 60 hours

Priorities:
1. Launch donation flow (must have)
2. Complete accessibility audit (compliance requirement)
3. Improve performance (if time allows)

Select tasks that:
- Fit within capacity
- Respect dependencies
- Balance frontend/backend work
- Include some quick wins
```

## Advanced Task Management

### Bulk Operations
```
Mark all UI component tasks as complete:
- Tasks 1.1 through 1.7
- Add note: "Completed with Storybook documentation"
- Update completion date
```

### Dependency Management
```
Task 7 (Analytics) is blocked because:
- We switched from Google Analytics to Plausible
- This affects task 7.2 and 7.3
- Need to add new subtask for Plausible integration
- Update test strategy for privacy-focused analytics
```

### Complexity Analysis
```
Analyze tasks 10-15 for hidden complexity:
- Which tasks might expand when we start?
- What dependencies aren't captured?
- Where might we hit performance issues?
- What needs early stakeholder review?
```

## Status Tracking Patterns

### Daily Check-in
```bash
# Start of day
mcp__taskmaster-ai__get_tasks --status in-progress
mcp__taskmaster-ai__next_task

# End of day
mcp__taskmaster-ai__update_task --id [ID] --prompt "Completed X, Y pending"
```

### Weekly Review
```bash
# See what was accomplished
mcp__taskmaster-ai__get_tasks --status done --since "7 days ago"

# Check upcoming work
mcp__taskmaster-ai__complexity_report

# Adjust priorities
mcp__taskmaster-ai__update --from [ID] --prompt "Reprioritize based on user feedback"
```

### Sprint Retrospective
```bash
# Generate metrics
mcp__taskmaster-ai__get_tasks --with-subtasks

# Identify patterns
- Which tasks expanded beyond estimates?
- What dependencies did we miss?
- Where did we excel?

# Update future tasks
mcp__taskmaster-ai__update --from [ID] --prompt "Apply learnings from sprint"
```

## Best Practices

### 1. Keep Tasks Atomic
- One clear deliverable per task
- If it feels too big, break it down
- Subtasks for implementation details

### 2. Update Regularly
- Progress isn't just "done" or "not done"
- Document learnings and blockers
- Update estimates as you learn

### 3. Use Dependencies Wisely
- Technical dependencies (can't start without)
- Logical dependencies (better to wait)
- Resource dependencies (same person/system)

### 4. Priority Means Something
- High: Blocks launch or other work
- Medium: Important but not blocking
- Low: Nice to have or technical debt

Remember: TaskMaster is your project memory. The more you update it, the more valuable it becomes!