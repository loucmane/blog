# TaskMaster: Project Planning Prompts

## Use Case
Creating comprehensive project plans with tasks, subtasks, and dependencies for complex development projects.

## Example Prompt Template

```
Create a TaskMaster project plan for [PROJECT_NAME]:

Project goals:
- [GOAL 1]
- [GOAL 2]

Key deliverables:
- [DELIVERABLE 1]
- [DELIVERABLE 2]

Constraints:
- Timeline: [DURATION]
- Team size: [NUMBER]
- Technology: [STACK]

Break down into:
- High-level tasks (5-10)
- Subtasks for each (3-7 per task)
- Identify dependencies
- Set priorities (high/medium/low)
- Estimate complexity
```

## Real Example: Animal Shelter Website Redesign

```
Create a TaskMaster project plan for modernizing our animal shelter website:

Project goals:
- Improve donation conversion by 25%
- Reduce page load time to <3s on 3G
- Achieve WCAG AA compliance
- Implement progressive web app features

Key deliverables:
- New responsive design with 4-theme system
- Donation flow optimization
- Animal adoption search and filters
- Volunteer portal
- Content management for staff

Constraints:
- Timeline: 3 months
- Team size: 2 developers, 1 designer
- Technology: Next.js 15, TypeScript, Tailwind CSS

Break down into:
- High-level tasks with clear dependencies
- Subtasks focusing on implementation details
- Consider our warm minimalism design philosophy
- Include performance and accessibility testing
```

## Expected Output Structure

```
Task 1: Design System Foundation
  Dependencies: None
  Priority: High
  Subtasks:
    1.1 Create color palette for 4 themes
    1.2 Define typography scale
    1.3 Build component library
    1.4 Document design tokens

Task 2: Performance Infrastructure
  Dependencies: [1]
  Priority: High
  Subtasks:
    2.1 Set up CDN and image optimization
    2.2 Implement service worker
    2.3 Configure lazy loading
    2.4 Add performance monitoring

Task 3: Donation Flow
  Dependencies: [1, 2]
  Priority: High
  Subtasks:
    3.1 Design donor journey
    3.2 Implement payment processing
    3.3 Create recurring donation options
    3.4 Build donor dashboard
    3.5 Add impact tracking

[Additional tasks...]
```

## Tips for Effective Planning

### 1. Start with User Value
- Order tasks by user impact
- Front-load critical features
- Plan MVP milestones

### 2. Consider Dependencies
- Technical dependencies (infrastructure first)
- Design dependencies (system before components)
- Data dependencies (schema before features)

### 3. Include Non-Functional Requirements
- Performance testing tasks
- Accessibility audits
- Security reviews
- Documentation

### 4. Plan for Iteration
- Include feedback cycles
- Buffer time for improvements
- Plan refinement tasks

## Integration with Development

### Using the Plan
```bash
# Initialize project with plan
mcp__taskmaster-ai__parse_prd --input project-plan.md

# Check next priority task
mcp__taskmaster-ai__next_task

# Update progress
mcp__taskmaster-ai__set_task_status --id 1 --status in-progress

# Add discovered subtasks
mcp__taskmaster-ai__add_subtask --id 1 --title "Additional requirement found"
```

### Tracking Progress
- Use `get_tasks` to see overall status
- Use `complexity_report` to identify risky areas
- Update tasks as you learn more
- Add subtasks for unexpected work

## Common Patterns

### Feature Development Pattern
```
Task: Implement [Feature]
  Subtasks:
    - Research and design
    - Build core functionality
    - Add tests
    - Create UI components
    - Integrate with backend
    - Document usage
    - Performance optimization
```

### Migration Pattern
```
Task: Migrate [System]
  Subtasks:
    - Audit current implementation
    - Design migration strategy
    - Create compatibility layer
    - Migrate in phases
    - Update dependencies
    - Test thoroughly
    - Remove old system
```

### Optimization Pattern
```
Task: Optimize [Metric]
  Subtasks:
    - Measure baseline
    - Identify bottlenecks
    - Implement improvements
    - Test impact
    - Document changes
    - Monitor results
```

Remember: Good project planning with TaskMaster sets the foundation for smooth development. Spend time getting the structure right!