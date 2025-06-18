# Orchestrate-Task Implementation Notes

## Critical Success Factors

### 1. Explicit Task Tool Usage
Each specialist orchestrator MUST use this exact format:

```markdown
I'll now deploy my sub-agents using the Task tool. Here are the 3 agents I'm creating:

<function_calls>
<invoke name="Task">
<parameter name="description">Bundle Optimizer for Task 5</parameter>
<parameter name="prompt">TASK: Bundle Optimizer Sub-Agent for Task 5 MDX Processing

You are the Bundle Optimizer sub-agent working under the Performance Specialist.

Your mission:
1. Create an MDX processing implementation optimized for minimal bundle size
2. Write your implementation to: .taskmaster/infinite/orchestrated/task-5/specialists/performance/bundle-optimizer/implementation.ts
3. Create a rationale.md explaining your optimization decisions
4. Include bundle size metrics in metrics.json

Context:
[Full task specification]
[Interface contract if available]
[TWES standards]

Focus exclusively on bundle size while maintaining functionality.</parameter>
</invoke>
</function_calls>
```

### 2. File System Coordination
Each sub-agent MUST write to a specific directory to avoid conflicts:

```
.taskmaster/infinite/orchestrated/task-{ID}/
├── specialists/
│   ├── performance/
│   │   ├── bundle-optimizer/
│   │   │   ├── implementation.ts
│   │   │   ├── rationale.md
│   │   │   └── metrics.json
│   │   ├── runtime-optimizer/
│   │   └── memory-optimizer/
```

### 3. State Management
The Master Orchestrator should maintain a state file:

```yaml
# .taskmaster/infinite/orchestrated/task-5/state.yaml
orchestration_state:
  phase: "specialist_deployment"
  specialists_deployed:
    - name: "performance"
      status: "running"
      sub_agents: 3
      started_at: "2024-01-15T10:00:00Z"
  
  agents_status:
    - id: "perf-bundle-optimizer"
      status: "completed"
      output_dir: "specialists/performance/bundle-optimizer"
    - id: "perf-runtime-optimizer" 
      status: "running"
      output_dir: "specialists/performance/runtime-optimizer"
```

### 4. Result Collection Pattern
Each agent should create a standardized result.json:

```json
{
  "agent_id": "perf-bundle-optimizer",
  "specialist": "performance",
  "timestamp": "2024-01-15T10:30:00Z",
  "implementation_path": "implementation.ts",
  "metrics": {
    "bundle_size": "2.1KB",
    "tree_shakeable": true,
    "dependencies": []
  },
  "ready_for_evaluation": true
}
```

### 5. Context Optimization
To manage 25+ agents with limited context:
- Each agent receives only essential context
- Master Orchestrator maintains lightweight state
- Agents write results to disk, not back to orchestrator
- Evaluation reads from disk, not from messages

### 6. Project Integration Validation
Before integration, validate:
```bash
# Check target directory exists
if [ ! -d "${target_dir}" ]; then
  echo "Error: Target directory ${target_dir} does not exist"
  exit 1
fi

# Check we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
  echo "Error: Not in a git repository"
  exit 1
fi

# Check pnpm is available
if ! command -v pnpm &> /dev/null; then
  echo "Error: pnpm is not installed"
  exit 1
fi
```

## Potential Failure Points

### 1. Agent Communication
- **Risk**: Agents can't find each other's outputs
- **Solution**: Strict directory structure + result.json files

### 2. Parallel Execution
- **Risk**: File conflicts when agents write simultaneously
- **Solution**: Each agent has unique directory

### 3. Context Exhaustion
- **Risk**: Too much context used in orchestration
- **Solution**: Agents work independently, write to disk

### 4. Integration Failures
- **Risk**: Auto-integration breaks the project
- **Solution**: Run tests before committing, create feature branch

## Testing Strategy

### 1. Dry Run Mode
Add a dry_run parameter that:
- Deploys only 1 agent per specialist
- Uses smaller context
- Doesn't actually integrate

### 2. Validation Steps
- Verify all expected directories exist
- Check all result.json files are valid
- Ensure evaluation report is generated
- Test integration commands manually first

## Recommended Improvements

### 1. Add Progress Monitoring
```yaml
# In orchestration plan
monitoring:
  check_interval: "30s"
  timeout_per_agent: "5m"
  failure_threshold: 2  # Allow 2 agent failures
```

### 2. Add Rollback Capability
```bash
# Before integration
git stash
STASH_REF=$(git stash list | head -1 | cut -d: -f1)

# If integration fails
git reset --hard
git stash pop $STASH_REF
```

### 3. Add Result Validation
Each specialist should validate their sub-agents' outputs before reporting completion.

## Confidence Assessment

With current implementation: **60% confidence**
- Task tool invocation needs testing
- File coordination needs enforcement
- Integration automation is risky

With recommended improvements: **85% confidence**
- Clear file structure prevents conflicts
- State management enables recovery
- Validation catches issues early

## Next Steps

1. Test with a simple task first (like Task 7)
2. Start with exploration mode only
3. Manually verify outputs before trying integration
4. Add more explicit error handling
5. Consider adding a --dry-run flag