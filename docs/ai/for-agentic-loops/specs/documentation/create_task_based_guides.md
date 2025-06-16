# Task-Based Developer Guides Specification

## Core Challenge
Generate step-by-step guides for common developer tasks by analyzing actual workflows, integrating with TaskMaster-AI for real-time progress tracking, and learning from successful task completions to continuously improve guidance quality.

## TaskMaster-AI Integration
This specification deeply integrates with TaskMaster-AI to create **living documentation** that:
- Tracks with actual development tasks
- Updates based on task completion patterns
- Learns from developer success/failure
- Provides real-time progress indicators
- Suggests next steps based on current task state

## Output Requirements

**Output Type**: File Set (multiple interconnected files)

**Directory Structure**:
```
/docs/guides/tasks/v[iteration_number]/
├── guide-index.md               # Master guide listing
├── tasks/                       # Individual task guides
│   ├── add-blog-feature.md     # Feature addition guide
│   ├── fix-performance-issue.md # Performance debugging
│   ├── implement-component.md   # Component creation
│   └── deploy-to-production.md  # Deployment guide
├── workflows/                   # Multi-task workflows
│   ├── new-developer-onboard.md # Complete onboarding
│   ├── feature-lifecycle.md     # Idea to production
│   └── bug-fix-process.md       # Bug investigation flow
├── taskmaster/                  # TaskMaster integration
│   ├── task-templates.json      # Templates for common tasks
│   ├── subtask-patterns.json    # Common subtask breakdowns
│   ├── time-estimates.json      # Historical time data
│   └── success-metrics.json     # Task completion analytics
├── analytics/                   # Usage and success data
│   ├── guide-usage.json         # Which guides are used
│   ├── completion-rates.json    # Success statistics
│   ├── pain-points.json         # Where developers struggle
│   └── improvement-log.md       # Guide evolution history
└── interactive/                 # Dynamic elements
    ├── checklist-generator.ts   # Creates custom checklists
    ├── progress-tracker.tsx     # Live progress component
    └── next-step-advisor.ts     # AI-powered suggestions
```

## File Set Templates

### 1. Master Guide Index (`guide-index.md`)
```markdown
# Developer Task Guide Index v[iteration]

## 🤖 TaskMaster Integration Active
- **Connected Tasks**: [count] active tasks using these guides
- **Success Rate**: [%] of tasks completed successfully
- **Avg Time Saved**: [hours] per developer per week
- **Most Used Guide**: [guide name] ([usage count])

## 📚 Available Guides

### Feature Development
| Guide | Est. Time | Complexity | Active Tasks | Success Rate |
|-------|-----------|------------|--------------|--------------|
| [Add Blog Feature](./tasks/add-blog-feature.md) | 2-4h | Medium | 3 | 89% |
| [Create Component](./tasks/implement-component.md) | 30-90m | Low | 7 | 94% |
| [Add API Endpoint](./tasks/add-api-endpoint.md) | 1-2h | Medium | 2 | 82% |

### Debugging & Fixes
| Guide | Avg Resolution | Common Issues | Active Tasks |
|-------|----------------|---------------|--------------|
| [Fix Performance](./tasks/fix-performance-issue.md) | 3h | LCP, Bundle | 1 | 
| [Debug Routing](./tasks/debug-routing-issue.md) | 1h | 404s, SSR | 0 |
| [Fix TypeScript](./tasks/fix-typescript-errors.md) | 45m | Types, Generics | 2 |

### Deployment & Ops
| Guide | Critical Steps | Rollback Time | Last Used |
|-------|----------------|---------------|-----------|
| [Deploy Production](./tasks/deploy-to-production.md) | 12 | 5 min | 2 days ago |
| [Emergency Hotfix](./tasks/emergency-hotfix.md) | 8 | 2 min | 2 weeks ago |

## 🔄 Active Workflows
- [New Developer Onboarding](./workflows/new-developer-onboard.md) - 2 in progress
- [Feature Lifecycle](./workflows/feature-lifecycle.md) - 5 in progress

## 📊 Recent Improvements
- Added TaskMaster auto-tracking to all guides
- Improved "Add Blog Feature" based on 12 completions
- Added common pitfalls to "Fix Performance"
```

### 2. Individual Task Guide (`tasks/add-blog-feature.md`)
```markdown
# How to Add a New Blog Feature

## TaskMaster Integration 🤖
```taskmaster
{
  "template_id": "blog-feature",
  "estimated_time": "2-4 hours",
  "complexity": "medium",
  "auto_track": true,
  "subtask_template": "blog-feature-standard"
}
```

### Your Current Progress
<!-- This section auto-updates if linked to a TaskMaster task -->
| TaskMaster ID | Status | Progress | Time Spent | Next Step |
|---------------|--------|----------|------------|-----------|
| TM-045 | In Progress | 3/8 subtasks | 1h 15m | Update router |

## Prerequisites
- [ ] Access to codebase
- [ ] Understanding of React components
- [ ] TaskMaster task created (or auto-create below)

## Quick Start
```bash
# Auto-create TaskMaster task for this guide
tm add "Add video post feature" --template blog-feature --guide tasks/add-blog-feature
```

## Steps

### 1. Plan Your Feature (15 min)
**TaskMaster Subtask**: `Design feature requirements`

Define what your feature will do:
- [ ] Write feature description
- [ ] List user interactions
- [ ] Identify affected components
- [ ] Create simple mockup

<details>
<summary>💡 Examples from completed tasks</summary>

From TM-032 (Gallery Feature):
- Description: "Grid view of blog images with lightbox"
- Affected: BlogPost, ImageComponent, Layout
- Completed in: 2h 45m
</details>

### 2. Create Component Structure (30 min)
**TaskMaster Subtask**: `Implement base component`

```typescript
// components/YourFeature/YourFeature.tsx
export const YourFeature = () => {
  return (
    <div>
      {/* Your implementation */}
    </div>
  );
};

// components/YourFeature/index.ts
export { YourFeature } from './YourFeature';
```

**Common patterns from 23 similar tasks:**
- 89% use component co-location
- 76% implement loading states
- 92% include error boundaries

### 3. Add to Route System (20 min)
**TaskMaster Subtask**: `Configure routing`

<details>
<summary>⚠️ Common Issues (from 12 tasks)</summary>

- **Issue**: Route not found
  - **Solution**: Check `next.config.js` rewrites
  - **Affected Tasks**: TM-019, TM-027, TM-041

- **Issue**: SSR hydration mismatch  
  - **Solution**: Use `dynamic()` with `ssr: false`
  - **Affected Tasks**: TM-023, TM-038
</details>

### 4. Implement Business Logic (45 min)
**TaskMaster Subtask**: `Add feature logic`

Based on successful implementations:
- Use React Query for data fetching (18/20 tasks)
- Implement optimistic updates (increases satisfaction 40%)
- Add proper TypeScript types (prevents 60% of bugs)

### 5. Add Tests (30 min)
**TaskMaster Subtask**: `Write test coverage`

```typescript
// Required test coverage (from quality standards)
describe('YourFeature', () => {
  it('renders without crashing', () => {});
  it('handles user interactions', () => {});
  it('manages error states', () => {});
  it('meets performance budget', () => {});
});
```

**Success Metric**: 80% coverage minimum

### 6. Update Documentation (15 min)
**TaskMaster Subtask**: `Document feature`

- [ ] Add to component registry
- [ ] Update API documentation
- [ ] Create usage examples
- [ ] Add to changelog

### 7. Performance Validation (20 min)
**TaskMaster Subtask**: `Validate performance`

```bash
# Run performance check
npm run lighthouse:feature YourFeature

# Expected metrics (from standards):
# - LCP: <1.2s
# - FID: <100ms
# - CLS: <0.1
```

### 8. Submit for Review (10 min)
**TaskMaster Subtask**: `Create pull request`

```bash
# Auto-generate PR with TaskMaster context
tm pr create --link-task TM-045
```

## Time Tracking & Analytics
<!-- Auto-populated from TaskMaster data -->
- **Average completion**: 3h 15m (from 23 tasks)
- **Fastest completion**: 1h 45m (TM-038)
- **Common blockers**: TypeScript types (adds ~30m)

## Success Patterns
Based on TaskMaster analytics:
1. **Break into smaller PRs**: 70% higher merge rate
2. **Test early**: Reduces debugging time by 45%
3. **Use existing patterns**: 2x faster implementation

## Next Steps
After completing this task:
- [ ] Monitor performance metrics
- [ ] Gather user feedback
- [ ] Plan iterations (link to TM task)

## Related Guides
- [Optimize Component Performance](./optimize-component.md)
- [Add Feature Tests](./add-feature-tests.md)
- [Deploy Feature Flag](./deploy-feature-flag.md)
```

### 3. TaskMaster Integration Files (`taskmaster/`)

#### Task Templates (`task-templates.json`)
```json
{
  "blog-feature": {
    "id": "blog-feature",
    "name": "Add Blog Feature",
    "description": "Standard template for adding new blog features",
    "estimated_hours": 3,
    "subtasks": [
      {
        "title": "Design feature requirements",
        "description": "Define what the feature will do",
        "estimated_minutes": 15,
        "required": true
      },
      {
        "title": "Implement base component",
        "description": "Create component structure",
        "estimated_minutes": 30,
        "required": true,
        "dependencies": [1]
      },
      {
        "title": "Configure routing",
        "description": "Add to route system",
        "estimated_minutes": 20,
        "required": true,
        "dependencies": [2]
      },
      {
        "title": "Add feature logic",
        "description": "Implement business logic",
        "estimated_minutes": 45,
        "required": true,
        "dependencies": [2]
      },
      {
        "title": "Write test coverage",
        "description": "Add comprehensive tests",
        "estimated_minutes": 30,
        "required": true,
        "dependencies": [4]
      },
      {
        "title": "Document feature",
        "description": "Update all documentation",
        "estimated_minutes": 15,
        "required": true,
        "dependencies": [4]
      },
      {
        "title": "Validate performance",
        "description": "Ensure meets standards",
        "estimated_minutes": 20,
        "required": true,
        "dependencies": [5]
      },
      {
        "title": "Create pull request",
        "description": "Submit for review",
        "estimated_minutes": 10,
        "required": true,
        "dependencies": [6, 7]
      }
    ],
    "success_criteria": {
      "test_coverage": 80,
      "lighthouse_score": 98,
      "documentation_complete": true,
      "pr_approved": true
    }
  }
}
```

### 4. Analytics Files (`analytics/`)

#### Guide Usage Analytics (`guide-usage.json`)
```json
{
  "period": "2024-01",
  "guides": {
    "add-blog-feature": {
      "views": 234,
      "task_links": 23,
      "completion_rate": 0.89,
      "avg_time_minutes": 195,
      "helpful_votes": 201,
      "confusion_points": [
        {
          "step": 3,
          "issue": "routing_config",
          "frequency": 8,
          "resolution": "Added SSR warning"
        }
      ],
      "success_patterns": [
        {
          "pattern": "component_colocation",
          "correlation": 0.92,
          "time_saved_minutes": 25
        }
      ]
    }
  },
  "taskmaster_integration": {
    "auto_created_tasks": 45,
    "subtask_adoption_rate": 0.87,
    "template_usage": 0.76,
    "time_tracking_accuracy": 0.91
  }
}
```

### 5. Interactive Components (`interactive/`)

#### Progress Tracker (`progress-tracker.tsx`)
```typescript
/**
 * Live progress tracker that connects to TaskMaster
 * Shows real-time progress for active tasks following guides
 */
export const GuideProgressTracker = ({ taskId, guideId }) => {
  const { task, subtasks } = useTaskMasterTask(taskId);
  const guide = useGuide(guideId);
  
  return (
    <div className="guide-progress">
      <h3>Your Progress: {task.title}</h3>
      <ProgressBar 
        current={subtasks.completed.length}
        total={subtasks.total.length}
      />
      
      <CurrentStep>
        <h4>Current: {subtasks.inProgress[0]?.title}</h4>
        <StepGuide content={guide.steps[subtasks.inProgress[0]?.index]} />
        <TimeEstimate minutes={subtasks.inProgress[0]?.estimated} />
      </CurrentStep>
      
      <NextSteps>
        {subtasks.pending.slice(0, 3).map(step => (
          <NextStep key={step.id} {...step} />
        ))}
      </NextSteps>
      
      <QuickActions>
        <button onClick={() => markComplete(subtasks.inProgress[0])}>
          Mark Current Complete
        </button>
        <button onClick={() => showBlocker()}>
          I'm Stuck
        </button>
      </QuickActions>
    </div>
  );
};
```

## Evolution Stages

### Stage 1: Basic Task Guides
- Static step-by-step guides
- Manual TaskMaster task creation
- Basic time estimates
- Simple success metrics

### Stage 2: TaskMaster Integration
- Auto-link guides to tasks
- Real-time progress tracking
- Template-based task creation
- Success pattern detection

### Stage 3: Intelligent Guidance
- Personalized step recommendations
- Dynamic time estimates
- Contextual help based on current code
- Proactive blocker prevention

### Stage 4: Predictive Assistance
- Predict next developer need
- Auto-generate guides for new patterns
- Suggest guide creation from task failures
- Cross-team learning

### Stage 5: Autonomous Guide Evolution
- Self-updating based on completions
- Automatic obsolescence detection
- Dynamic guide generation
- Continuous optimization

## TaskMaster Integration Points

### 1. Task Creation
```bash
# From guide page
tm add --from-guide tasks/add-blog-feature

# Auto-populates:
# - Task title and description
# - Subtasks from guide template
# - Time estimates
# - Dependencies
```

### 2. Progress Tracking
```typescript
// Embedded in guide
<TaskMasterProgress 
  taskId={currentTask.id}
  onStepComplete={(step) => updateGuide(step)}
/>
```

### 3. Analytics Feedback
```typescript
// After task completion
taskmaster.onComplete((task) => {
  guideAnalytics.record({
    taskId: task.id,
    guideId: task.metadata.guideId,
    actualTime: task.timeSpent,
    stepsModified: task.customSteps,
    blockers: task.blockers,
    success: task.status === 'done'
  });
});
```

### 4. Guide Improvement
```typescript
// Weekly analysis
analyzeTaskCompletions({
  guide: 'add-blog-feature',
  period: 'last-week'
}) => {
  // Identifies:
  // - Steps that take longer than estimated
  // - Common blockers
  // - Skipped steps
  // - Additional steps added by developers
  
  // Auto-generates:
  // - Guide updates
  // - New warning sections
  // - Better examples
  // - Time estimate adjustments
}
```

## Success Metrics

### Guide Quality
- Task completion rate using guide
- Time saved vs. no guide
- Developer satisfaction rating
- Reduction in help requests

### TaskMaster Integration
- % of tasks using guides
- Template adoption rate
- Subtask modification rate
- Time estimate accuracy

### Learning Effectiveness
- Pattern detection accuracy
- Guide improvement velocity
- Cross-team knowledge transfer
- Obsolescence detection rate

## Blog-Specific Guides

### Content Management
- Add new content type
- Implement content filter
- Create custom MDX component
- Add content analytics

### Performance
- Debug slow page load
- Optimize image delivery
- Implement lazy loading
- Add caching strategy

### Features
- Add comment system
- Implement search
- Create tag system
- Add newsletter signup

## Human-AI Collaboration

### Developer Feedback
- In-guide feedback widgets
- Step-specific comments
- Time tracking validation
- Success/failure reporting

### AI Analysis
- Pattern recognition from completions
- Bottleneck identification
- Success correlation analysis
- Guide optimization suggestions

### Continuous Improvement
- Weekly guide updates
- Quarterly major revisions
- A/B testing guide variations
- Community contributions

Generate task-based guides that seamlessly integrate with TaskMaster-AI, creating living documentation that evolves with your development patterns and helps developers succeed faster.