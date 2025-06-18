# Using the Orchestrate-Task Command

The orchestrate-task command deploys a sophisticated multi-agent system to explore and synthesize optimal implementations for TaskMaster tasks. It can work in exploration mode (study approaches) or project-ready mode (integrate directly).

## Quick Start

### Basic exploration (default):
```bash
/orchestrate-task task_id=5 specialists=all depth=3 synthesis_strategy=best-of-breed
```

### Ready for integration:
```bash
/orchestrate-task task_id=5 specialists=all depth=3 synthesis_strategy=best-of-breed \
  output_mode=project-ready target_dir=packages/web/src/lib/mdx integration_plan=auto
```

## Command Parameters

### Required:
- `task_id` - TaskMaster task ID to implement

### Optional:
- `specialists` - Which specialists to activate (default: "all")
  - Options: "performance,architecture,ux_dx,accessibility,innovation" or "all"
- `depth` - Number of sub-agents per specialist (default: 3)
- `synthesis_strategy` - How to combine results (default: "best-of-breed")
  - Options: "best-of-breed", "hybrid", "consensus"
- `output_mode` - Where to put results (default: "exploration")
  - "exploration" - Keep in .taskmaster/infinite/orchestrated/
  - "project-ready" - Prepare for project integration
- `target_dir` - Where to place implementation (required for project-ready mode)
  - Example: "packages/web/src/lib/mdx"
- `integration_plan` - How to integrate (default: "staging")
  - "manual" - Generate integration instructions only
  - "staging" - Test in staging directory (recommended)
  - "worktree" - Use git worktree for isolated testing

## How It Works

### 1. Master Orchestrator
- Analyzes task complexity
- Loads TWES documentation
- Plans specialist allocation
- Determines integration points

### 2. Specialist Orchestrators (5 total)
Each manages 3-5 sub-agents:
- **Performance**: Bundle size, runtime, memory
- **Architecture**: Patterns, scalability, maintainability
- **UX/DX**: API design, documentation, TypeScript
- **Accessibility**: Screen readers, keyboard, ARIA
- **Innovation**: Modern features, future-proofing

### 3. Sub-Agents (15-25 total)
Each creates a complete implementation from their perspective

### 4. Evaluation Orchestrator
- Scores all implementations
- Identifies conflicts and synergies
- Recommends synthesis approach

### 5. Synthesis Orchestrator
- Combines best elements
- Resolves conflicts
- Produces final implementation

### 6. Project Integration (if project-ready)
- Creates feature branch
- Copies files to target
- Updates imports
- Runs tests
- Creates commit

## Example: Task 5 (MDX Processing)

### Step 1: Explore approaches
```bash
/orchestrate-task task_id=5 specialists=all depth=3 synthesis_strategy=best-of-breed
```

This generates ~15 different implementations in:
`.taskmaster/infinite/orchestrated/task-5/`

### Step 2: Review outputs
Check the evaluation report to understand:
- Which approaches scored highest
- What trade-offs exist
- How implementations differ

### Step 3: Integrate with staging
```bash
/orchestrate-task task_id=5 specialists=all depth=3 synthesis_strategy=best-of-breed \
  output_mode=project-ready target_dir=packages/web/src/lib/mdx integration_plan=staging
```

This will:
1. Create staging directory with merged implementation
2. Run full test suite in staging
3. Generate `integrate.sh` helper script
4. Provide commit message template
5. You use your git aliases to commit when ready

### Step 4: Complete integration
```bash
# Review staged implementation
cd .taskmaster/infinite/orchestrated/task-5/staging

# If happy, run the integration script
../integrate.sh

# Or manually copy files
cp -r * /home/loucmane/dev/javascript/MomsBlog/blog/packages/web/src/lib/mdx/

# Use your git workflow
gac "feat: add orchestrated MDX implementation"
```

## Output Structure

### Exploration Mode:
```
.taskmaster/infinite/orchestrated/task-5/
├── orchestration-plan.yaml
├── specialists/
│   ├── performance/
│   ├── architecture/
│   ├── ux-dx/
│   ├── accessibility/
│   └── innovation/
├── evaluation/
│   └── evaluation-report.md
├── synthesis/
└── final/
    ├── implementation/
    ├── documentation/
    └── integration-guide.md
```

### Project-Ready Mode:
Same as above, plus:
```
.taskmaster/infinite/orchestrated/task-5/
├── staging/              # Fully merged implementation
├── backup/              # Backup of current project state
├── integrate.sh         # Helper script for integration
├── commit-message.txt   # Suggested commit message
└── final/
    ├── implementation/  # Clean, ready-to-use code
    └── dependencies.json # Dependencies to install
```

## Advanced Usage

### Focus on specific aspects:
```bash
/orchestrate-task task_id=7 specialists=performance,architecture depth=5 \
  synthesis_strategy=hybrid output_mode=project-ready \
  target_dir=packages/web/src/components/layout integration_plan=manual
```

### Maximum exploration:
```bash
/orchestrate-task task_id=10 specialists=all depth=5 synthesis_strategy=consensus
```

## Benefits

1. **Depth**: 15-25 different implementations explored
2. **Quality**: Best elements combined intelligently
3. **Speed**: Parallel execution of all agents
4. **Integration**: Direct to your project
5. **Learning**: Patterns captured for future use

## Tips

- Start with exploration mode to understand options
- Use project-ready mode once you're confident
- Specify target_dir based on task type
- Review synthesis decisions before auto-integration
- Check the evaluation report for insights

The orchestrate-task command represents the pinnacle of AI-assisted development, combining breadth of exploration with depth of analysis to produce superior implementations.