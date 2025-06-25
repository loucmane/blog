# Orchestrate-Test Specification

## Core Challenge

Implement a TaskMaster task through multi-perspective exploration, where 5 specialist orchestrators guide sub-agents to create diverse implementations. Each perspective brings unique expertise, resulting in 15+ implementation variations that are synthesized into an optimal solution.

## Orchestration Flow

1. **Pre-Analysis**: Generate shared contracts for coherent implementations
2. **Specialist Orchestration**: 5 perspectives deploy sub-agents in parallel
3. **Evaluation**: Review all implementations for insights
4. **Summarization**: Extract key learnings from each perspective
5. **Synthesis**: Combine best elements into unified solution

## Key Variables

- **task_id**: The TaskMaster task ID to implement
- **specialists**: Which specialist perspectives to include (comma-separated or "all")
- **depth**: Number of sub-agents per specialist (affects total implementations)
- **auto_start_servers**: Whether to start development servers after orchestration
- **reuse_worktrees**: Whether to reuse existing worktrees from previous runs
- **worktree_cleanup**: Whether to clean up worktrees after synthesis (default: false)
- **skip_git_operations**: Skip git add/commit operations that require authentication (default: true)

## TWES Compliance Requirements

ALL agents MUST load and follow the Total Workflow Excellence System (TWES):

### Required Reading for Every Agent
1. **Standards** (`/docs/ai/shared-context/standards/`)
   - `coding-conventions.md` - Import order, naming, patterns
   - `performance.md` - 98+ Lighthouse, bundle limits
   - `accessibility.md` - WCAG 2.1 AA, 44px touch targets
   - `file-structure.md` - Project organization

2. **Themes** (`/docs/ai/shared-context/themes/`)
   - `four-themes.md` - Light/Dark/Warm/Cool implementation
   - `warm-minimalism.md` - Design philosophy

3. **Patterns** (`/docs/ai/shared-context/patterns/`)
   - `common-patterns.md` - React patterns, compound components
   - `monorepo-structure.md` - Package boundaries
   - Discovered patterns from documentation evolution

4. **Project Rules** (`CLAUDE.md`)
   - ALWAYS use pnpm
   - UI package = design tokens only
   - Web package = all shadcn/ui components
   - Four themes required

### Contract Generation Must Include
- TWES compliance requirements
- Performance budgets from standards
- Accessibility requirements
- Theme integration approach
- Import order conventions

## Agent Specifications

### 1. Pre-Analysis Agent

**Purpose**: Generate implementation contracts that will guide all other agents.

**Context Variables**:
- Task specification from `.taskmaster/tasks/task_${String(task_id).padStart(3, '0')}.txt`
- Task ID: ${task_id}
- Task title: ${task_title}
- Task subtasks: ${task_subtasks}
- Output Directory: ${CONTRACTS_DIR}
- Current Branch: ${CURRENT_BRANCH}
- Project Root: ${PROJECT_ROOT}

**Requirements**:
1. Analyze the provided task specification thoroughly
2. Study existing codebase patterns and conventions
3. Load and follow TWES documentation:
   - `/docs/ai/shared-context/standards/` - All coding and performance standards
   - `/docs/ai/shared-context/themes/` - Four theme system requirements
   - `/docs/ai/shared-context/patterns/` - Common patterns and discovered patterns
   - `/docs/ai/shared-context/philosophies/` - Development principles
   - `CLAUDE.md` - Project-specific conventions and rules
4. Consider all 5 specialist perspectives (Performance, Architecture, UX/DX, Accessibility, Innovation)
5. Generate 4 critical contract files that enforce TWES compliance:

   a) `${CONTRACTS_DIR}/interface-contract.yaml`
      - Component props/API interface specifications
      - Event handlers and callback signatures
      - TypeScript type definitions
      - Return value contracts

   b) `${CONTRACTS_DIR}/behavior-contract.yaml`
      - Core functionality requirements
      - User interaction patterns
      - State management approach
      - Error handling behavior

   c) `${CONTRACTS_DIR}/integration-contract.yaml`
      - File naming conventions
      - Import/export patterns
      - Theme integration approach
      - Testing requirements

   d) `${CONTRACTS_DIR}/constraints-contract.yaml`
      - Performance budgets
      - Browser compatibility requirements
      - Accessibility standards
      - Code style constraints

**Critical Instructions**:
- Read the ENTIRE task specification first before generating contracts
- Make contracts specific to ${task_title}, not generic
- Consider how different specialists will interpret requirements
- Ensure contracts enable diversity while maintaining compatibility
- Include concrete examples in each contract file

**Output Requirements**:
- Generate all 4 YAML contract files
- Each file must be syntactically valid YAML
- Include comments explaining reasoning
- Provide specific values, not just categories
- Save all files to ${CONTRACTS_DIR}/

### 2. Master Orchestrator

**Purpose**: Deploy and coordinate specialist orchestrators based on task requirements.

**Context Variables**:
- Task specification: [Full content from task file]
- Requested specialists: ${specialists}
- Depth per specialist: ${depth}
- Contracts directory: ${CONTRACTS_DIR}
- Orchestration output: ${ORCHESTRATION_DIR}
- Monitoring enabled: true

**Deployment Strategy**:
1. Read and validate the implementation contracts
2. Determine which specialists to deploy (based on ${specialists} parameter)
3. Deploy each specialist orchestrator with:
   - Their specific focus area
   - Access to contracts
   - Depth parameter for sub-agent count
   - Output directory for their implementations
4. Monitor deployment progress via orchestration.log
5. Coordinate parallel execution
6. Track completion status

**Specialist Deployment Order** (if all selected):
1. Performance Specialist Orchestrator
2. Architecture Specialist Orchestrator  
3. UX/DX Specialist Orchestrator
4. Accessibility Specialist Orchestrator
5. Innovation Specialist Orchestrator

### 3. Performance Specialist Orchestrator

**Purpose**: Create high-performance implementations focusing on speed and efficiency.

**Focus Areas**:
- Load time optimization
- Runtime performance
- Memory efficiency
- Bundle size reduction
- Network optimization

**Sub-Agent Deployment**:
Deploy ${depth} Performance Sub-Agents, each exploring different optimization strategies:
- Agent 1: Aggressive code splitting and lazy loading
- Agent 2: SSG/ISR optimization with minimal client JS
- Agent 3: Web Worker offloading for heavy computations
- Additional agents explore combinations and advanced techniques

**Implementation Requirements**:
- Each sub-agent creates in worktree: `.worktrees/task-${task_id}-orch-perf-{number}`
- Follow contracts from ${CONTRACTS_DIR}
- **MUST follow TWES standards**:
  - Performance standards from `/docs/ai/shared-context/standards/performance.md`
  - 98+ Lighthouse scores per requirements
  - Bundle size limits per TWES
  - Code splitting patterns from discovered patterns
- Implement performance monitoring
- Document optimization decisions

### 4. Architecture Specialist Orchestrator

**Purpose**: Create well-structured, maintainable implementations with excellent patterns.

**Focus Areas**:
- Component composition patterns
- State management architecture
- Separation of concerns
- Scalability patterns
- Type safety

**Sub-Agent Deployment**:
Deploy ${depth} Architecture Sub-Agents exploring different patterns:
- Agent 1: Compound component pattern with maximum flexibility
- Agent 2: Atomic design with strict hierarchy
- Agent 3: Feature-sliced design for modularity
- Additional agents explore hybrid approaches

**Implementation Requirements**:
- Each sub-agent creates in worktree: `.worktrees/task-${task_id}-orch-arch-{number}`
- Emphasize clean code principles
- Strong TypeScript usage
- Clear module boundaries
- Comprehensive documentation

### 5. UX/DX Specialist Orchestrator

**Purpose**: Create implementations optimizing both user and developer experience.

**Focus Areas**:
- Intuitive user interactions
- Developer ergonomics
- API design
- Error messaging
- Documentation quality

**Sub-Agent Deployment**:
Deploy ${depth} UX/DX Sub-Agents focusing on experience:
- Agent 1: Maximum user delight with micro-interactions
- Agent 2: Developer-first with excellent APIs
- Agent 3: Balanced approach with great defaults
- Additional agents explore specific use cases

**Implementation Requirements**:
- Each sub-agent creates in worktree: `.worktrees/task-${task_id}-orch-ux-{number}`
- Include usage examples
- Storybook stories if applicable
- Clear error messages
- Intuitive prop names

### 6. Accessibility Specialist Orchestrator

**Purpose**: Create implementations exceeding WCAG standards with inclusive design.

**Focus Areas**:
- Screen reader optimization
- Keyboard navigation
- Color contrast
- Focus management
- ARIA implementation

**Sub-Agent Deployment**:
Deploy ${depth} Accessibility Sub-Agents with different approaches:
- Agent 1: ARIA-first with comprehensive announcements
- Agent 2: Semantic HTML maximalist approach
- Agent 3: Progressive enhancement focus
- Additional agents explore assistive technology optimizations

**Implementation Requirements**:
- Each sub-agent creates in worktree: `.worktrees/task-${task_id}-orch-a11y-{number}`
- WCAG 2.1 AAA compliance where possible
- Keyboard navigation documentation
- Screen reader testing notes
- Focus flow diagrams

### 7. Innovation Specialist Orchestrator

**Purpose**: Create boundary-pushing implementations with creative solutions.

**Focus Areas**:
- Novel interaction patterns
- Creative visual solutions
- Emerging web APIs
- Experimental features
- Future-facing patterns

**Sub-Agent Deployment**:
Deploy ${depth} Innovation Sub-Agents exploring possibilities:
- Agent 1: Cutting-edge CSS and animations
- Agent 2: AI-enhanced interactions
- Agent 3: Novel state management approaches
- Additional agents combine innovations

**Implementation Requirements**:
- Each sub-agent creates in worktree: `.worktrees/task-${task_id}-orch-innov-{number}`
- Document browser compatibility
- Provide fallbacks
- Explain innovative aspects
- Include demos

### 8. Evaluation Orchestrator

**Purpose**: Review all implementations and extract insights for synthesis.

**Evaluation Process**:
1. Scan all worktrees for implementations
2. Analyze each implementation against:
   - Contract compliance
   - Unique strengths
   - Potential issues
   - Innovation value
   - Integration complexity
3. Create evaluation matrix
4. Identify best practices from each
5. Note patterns across perspectives
6. Prepare insights for synthesis

**Output Requirements**:
- Evaluation report in ${ORCHESTRATION_DIR}/evaluation/
- Comparison matrix
- Strengths/weaknesses analysis
- Recommendations for synthesis
- Pattern identification

### 9-13. Summarizer Agents (Performance, Architecture, UX/DX, Accessibility, Innovation)

**Purpose**: Extract key learnings from each specialist perspective.

**Summarization Focus**:
- Successful patterns discovered
- Common challenges faced
- Unique insights gained
- Reusable solutions
- Perspective-specific best practices

**Output Requirements**:
- Summary report per perspective
- Code snippets of best solutions
- Decision rationale
- Performance metrics (if applicable)
- Future recommendations

### 14. Synthesis Orchestrator

**Purpose**: Combine the best elements from all implementations into an optimal solution.

**Synthesis Strategy**:
1. Read all evaluation reports and summaries
2. Identify non-conflicting best practices
3. Resolve conflicts through priority ranking
4. Create unified implementation plan
5. Generate final synthesized code
6. Document decision rationale
7. Create integration guide

**Output Requirements**:
- Final implementation in main branch
- Synthesis decision document
- Integration guide
- Performance validation
- Migration notes from any perspective

## Output Structure

```
docs/ai/for-agentic-loops/orchestration-outputs/task-{task_id}/
├── contracts/
│   ├── interface-contract.yaml
│   ├── behavior-contract.yaml
│   ├── integration-contract.yaml
│   └── constraints-contract.yaml
├── analysis/
│   └── pre-analysis-report.md
├── implementations/
│   ├── performance/
│   ├── architecture/
│   ├── ux-dx/
│   ├── accessibility/
│   └── innovation/
├── evaluation/
│   └── evaluation-matrix.md
├── summaries/
│   ├── performance-summary.md
│   ├── architecture-summary.md
│   ├── ux-dx-summary.md
│   ├── accessibility-summary.md
│   └── innovation-summary.md
├── synthesis/
│   ├── synthesis-plan.md
│   └── final-implementation/
├── logs/
│   └── orchestration.log
└── state/
    └── orchestration-state.json
```

## Success Criteria

1. All requested specialists deploy successfully
2. Each specialist creates ${depth} implementations
3. All implementations follow contracts
4. Evaluation identifies clear patterns
5. Synthesis produces optimal solution
6. Task implementation is complete and tested
7. All outputs are properly documented

## Parallel Execution Notes

- Specialists run in parallel after Pre-Analysis
- Each specialist manages its own sub-agents
- Real-time monitoring via orchestration.log
- State management enables resumption
- Resource allocation prevents conflicts

## Worktree Management

### Worktree Locations
All worktrees MUST be created as subdirectories within the project:
- Base path: `${PROJECT_ROOT}/.worktrees/`
- Pattern: `.worktrees/task-${task_id}-orch-${specialist}-${number}`
- Example: `.worktrees/task-7-orch-perf-1`

### Worktree Creation
1. Create `.worktrees/` directory if it doesn't exist
2. Use git worktree add with unique branch names
3. Each worktree gets its own branch: `orch/${task_id}/${specialist}-${number}`
4. Example: `git worktree add .worktrees/task-7-orch-perf-1 -b orch/7/perf-1`

### Worktree Cleanup
If `worktree_cleanup` is true:
1. After synthesis, remove all worktrees for this task
2. Delete associated branches
3. Clean up `.worktrees/task-${task_id}-*` directories
4. Log cleanup actions in orchestration.log

### Error Handling
- If worktree creation fails, log error and continue with remaining agents
- Track failed worktrees in state for manual cleanup
- Provide recovery instructions in final summary

## Agent Deployment Instructions

### CRITICAL: Use Task Tool Only
All agents MUST be deployed using the Task tool. Do NOT use any MCP tools for agent deployment.

**Correct Pattern**:
```
TASK: Deploy Performance Specialist using Task tool

You are a Performance Specialist Orchestrator. Your role is to deploy ${depth} sub-agents...
```

**NEVER Use**:
- zen:chat, zen:thinkdeep, zen:codereview
- claude-code-bridge:claude_code
- multi-ai-collab tools
- Any other MCP tools

### Sub-Agent Deployment
When specialist orchestrators deploy sub-agents, they should:
1. Use Task tool to create new agent instances
2. Provide each sub-agent with specific worktree location
3. Pass contracts and focus area to each sub-agent
4. Monitor sub-agent completion via file outputs

### Git Operations Handling
If `skip_git_operations` is true (default):
1. Skip all git add/commit operations
2. Leave implementations in worktrees for manual review
3. Generate integration script for user to run manually
4. Document which files should be committed where

If `skip_git_operations` is false:
1. Attempt git operations with clear error handling
2. If authentication fails, fall back to skip mode
3. Log all git operation attempts and results

## Progress Tracking

### Orchestration Log Format
All log entries must follow this format:
```
[TIMESTAMP] [PHASE] [AGENT] [STATUS] Message
```

Example entries:
```
[2025-06-25 14:30:15] [PHASE-4] [Pre-Analysis] [STARTED] Deploying Pre-Analysis Agent
[2025-06-25 14:30:45] [PHASE-4] [Pre-Analysis] [COMPLETED] Generated 4 contract files
[2025-06-25 14:31:00] [PHASE-5] [Master] [STARTED] Deploying Master Orchestrator
[2025-06-25 14:31:30] [PHASE-6] [Performance-1] [STARTED] Creating worktree .worktrees/task-7-orch-perf-1
[2025-06-25 14:31:35] [PHASE-6] [Performance-1] [WORKING] Implementing Header component
[2025-06-25 14:32:00] [PHASE-6] [Performance-1] [COMPLETED] Implementation saved to worktree
```

### Progress Indicators
- Track total agents: deployed/planned (e.g., "15/28 agents deployed")
- Track phases: completed/total (e.g., "Phase 4/10 complete")
- Estimate remaining time based on average agent completion
- Show current active agents in parallel execution

### State Persistence
Save progress to `${ORCHESTRATION_DIR}/state/orchestration-state.json`:
```json
{
  "task_id": 7,
  "started_at": "2025-06-25T14:30:00Z",
  "current_phase": 6,
  "agents_deployed": 15,
  "agents_total": 28,
  "completed_agents": ["pre-analysis", "master", "perf-1", "perf-2"],
  "failed_agents": [],
  "worktrees_created": ["task-7-orch-perf-1", "task-7-orch-perf-2"],
  "last_checkpoint": "2025-06-25T14:35:00Z"
}
```

## Error Recovery

### Resumption Capability
If orchestration is interrupted:
1. Check for existing `orchestration-state.json`
2. Identify last successful checkpoint
3. Skip already completed agents
4. Resume from next pending agent
5. Log resumption details

### Recovery Command
Add `resume` parameter to command:
```
/orchestrate-and-test task_id=7 resume=true
```

### Failure Handling
For each failed agent:
1. Log detailed error information
2. Continue with remaining agents
3. Track failures in state file
4. Provide recovery instructions in final summary
5. Generate partial synthesis from successful agents

### Cleanup on Failure
If orchestration fails completely:
1. Save current state for debugging
2. List all created worktrees
3. Provide manual cleanup commands
4. Suggest retry strategy