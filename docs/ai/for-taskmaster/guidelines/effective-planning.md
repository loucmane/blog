# TaskMaster: Effective Project Planning Guidelines

## Philosophy: Plans Are Living Documents

TaskMaster isn't about creating perfect plans—it's about creating **useful plans that evolve**. The best project plan is one that adapts as you learn.

## Core Principles

### 1. Start with Why (Mission Alignment)
Every task should trace back to user value:
- How does this help our users?
- What problem does it solve?
- Can we measure its impact?

Bad: "Refactor database layer"  
Good: "Optimize database to reduce page load time by 50% for field workers on 2G"

### 2. Progressive Elaboration
Start high-level, add detail as you learn:

#### Initial Planning
```
Task: Implement donation system
Subtasks:
  - Design user flow
  - Build payment processing
  - Create donor dashboard
```

#### After Discovery
```
Task: Implement donation system
Subtasks:
  - Design user flow
    - Research payment providers
    - Map international requirements
    - Design for recurring donations
  - Build payment processing
    - Integrate Stripe for cards
    - Add PayPal for international
    - Implement webhook handlers
    - Add retry logic
  - Create donor dashboard
    - Show donation history
    - Generate tax receipts
    - Track impact metrics
```

### 3. Dependencies: Hard vs. Soft

#### Hard Dependencies (Can't Start Without)
```
Task 5: Deploy to production
Dependencies: [4] # Must pass all tests first
```

#### Soft Dependencies (Better to Wait)
```
Task 8: Polish animations
Dependencies: [7] # Core functionality should work first
```

#### Resource Dependencies (Same Person/System)
```
Task 10: Database migration
Task 11: API updates
# Both need DBA time - consider scheduling
```

## Task Sizing Guidelines

### 🎯 Right-Sized Tasks
- **Clear deliverable**: "Navigation works on mobile"
- **Testable**: Can verify completion
- **1-3 days of work**: Bigger = break down
- **Single owner**: One person responsible

### 🚫 Too Big (Break Down)
- "Implement entire admin panel"
- "Make site accessible"
- "Improve performance"

### 🚫 Too Small (Combine)
- "Change button color"
- "Fix typo in comment"
- "Update one import"

## Effective Subtask Patterns

### Feature Implementation Pattern
```yaml
Task: Add content warning system
Subtasks:
  1. Design warning levels and UI:
     - Research trauma-informed design
     - Create mockups for each level
     - Get stakeholder approval
  
  2. Build backend support:
     - Add warning field to content model
     - Create API endpoints
     - Add admin interface
  
  3. Implement frontend display:
     - Create warning component
     - Add progressive disclosure
     - Implement user preferences
  
  4. Test with real content:
     - Audit existing content
     - Apply appropriate warnings
     - Gather user feedback
```

### Research → Implementation Pattern
```yaml
Task: Optimize for 2G networks
Subtasks:
  1. Research phase:
     - Audit current performance
     - Research optimization techniques
     - Create improvement plan
  
  2. Quick wins:
     - Implement lazy loading
     - Optimize images
     - Enable compression
  
  3. Architecture changes:
     - Implement service worker
     - Add offline support
     - Create lite version
  
  4. Validation:
     - Test on real 2G
     - Measure improvements
     - Document results
```

## Priority Framework

### High Priority
- Blocks other work
- Core user journey
- Compliance/legal requirement
- Security/data issue

### Medium Priority  
- Important features
- Performance improvements
- Developer experience
- Technical debt with user impact

### Low Priority
- Nice-to-have features
- Cosmetic improvements
- Technical debt (no user impact)
- Future considerations

## Managing Discoveries

### When You Find New Work

#### 1. Assess Impact
```
Discovery: Need GDPR compliance for EU donors

Questions:
- Blocks launch? → High priority
- Affects architecture? → Add early
- Independent feature? → Add to backlog
```

#### 2. Update Appropriately
```bash
# Small addition to current task
mcp__taskmaster-ai__add_subtask --id 5 \
  --title "Add GDPR consent checkbox"

# Significant new work
mcp__taskmaster-ai__add_task \
  --title "Implement GDPR compliance" \
  --priority high \
  --dependencies "5"
```

#### 3. Communicate Changes
```bash
# Update parent task with discovery
mcp__taskmaster-ai__update_task --id 5 \
  --prompt "Discovered GDPR requirement. Added subtask 5.8. 
  This adds ~2 days to timeline."
```

## Sprint Planning with TaskMaster

### 1. Capacity Planning
```bash
# See available work
mcp__taskmaster-ai__get_tasks --status pending --priority high

# Check complexity
mcp__taskmaster-ai__complexity_report

# Consider dependencies
mcp__taskmaster-ai__validate_dependencies
```

### 2. Sprint Selection Criteria
- **Must have**: Core features for release
- **Should have**: Important but not blocking
- **Could have**: If time permits
- **Won't have**: Explicitly excluded

### 3. Balance Considerations
- Frontend vs. backend work
- Feature work vs. technical debt
- Complex tasks vs. quick wins
- Learning opportunities

## Anti-Patterns to Avoid

### ❌ The Waterfall Trap
Creating detailed plans for everything upfront
```
50 tasks, 200 subtasks, all dependencies mapped
Reality: Plans obsolete by week 2
```

### ❌ The Vague Task
```
Task: "Make site better"
Task: "Fix bugs"
Task: "Improve code"
```

### ❌ The Never-Ending Task
```
Task: "Ongoing maintenance" (status: in-progress for 6 months)
Better: Specific, time-boxed maintenance tasks
```

### ❌ The Dependency Web
Every task depends on every other task
```
Task 5: deps [1,2,3,4,6,7,8]
Result: Paralysis
```

## Success Patterns

### ✅ The Learning Loop
```
1. Plan with what you know
2. Start implementation
3. Discover new requirements
4. Update plan
5. Continue with better understanding
```

### ✅ The Milestone Approach
```
Milestone 1: Core features work locally
Milestone 2: Deployed to staging
Milestone 3: Limited beta release
Milestone 4: Public launch
```

### ✅ The Risk-First Method
```
1. Identify highest risk tasks
2. Tackle them early
3. Learn and adjust
4. Build confidence
```

## Remember

The best plan is one that:
- Gets you started quickly
- Adapts as you learn
- Focuses on user value
- Enables parallel work
- Celebrates progress

TaskMaster is your planning partner, not your planning prison. Use it to think clearly, track progress, and adapt confidently!