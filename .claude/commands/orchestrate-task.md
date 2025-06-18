**ORCHESTRATE TASK COMMAND**

Deploy a sophisticated multi-agent orchestration system to explore and synthesize optimal implementations for TaskMaster tasks.

**CRITICAL: This command uses the Task tool extensively to deploy multiple agents**
- Master Orchestrator deploys 5 Specialist Orchestrators using Task tool
- Each Specialist deploys 3-4 Sub-Agents using Task tool
- Evaluation Orchestrator deployed using Task tool
- Synthesis Orchestrator deploys 3 agents using Task tool
- Total: ~25 agents working in a coordinated hierarchy

**Variables:**
- task_id: $ARGUMENTS
- specialists: $ARGUMENTS  
- depth: $ARGUMENTS
- synthesis_strategy: $ARGUMENTS
- output_mode: $ARGUMENTS (optional: "exploration" | "project-ready", default: "exploration")
- target_dir: $ARGUMENTS (optional: where to place final implementation)
- integration_plan: $ARGUMENTS (optional: "manual" | "auto", default: "manual")

**PHASE 1: MASTER ORCHESTRATOR INITIALIZATION**

You are the Master Orchestrator for TaskMaster Infinite Orchestrated System. Your role is strategic planning and coordination of specialist orchestrators.

**1.1 Parse Arguments**
Extract from "$ARGUMENTS":
- `task_id` - TaskMaster task ID to implement
- `specialists` - Comma-separated list of specialist types to activate
- `depth` - Number of sub-agents per specialist (default: 3)
- `synthesis_strategy` - How to combine results: "best-of-breed" | "hybrid" | "consensus"
- `output_mode` - "exploration" (study approaches) or "project-ready" (integrate into project)
- `target_dir` - For project-ready mode: where to place implementation (e.g., "packages/web/src/lib/mdx")
- `integration_plan` - "manual" | "staging" | "worktree" (default: "staging")
  - "manual": Just provide instructions and scripts
  - "staging": Test in staging directory, prepare for manual git
  - "worktree": Use git worktree for isolated testing

**1.2 Task Analysis**
1. Read TaskMaster task details for task_id
2. Analyze task complexity and requirements
3. Load interface contract if it exists
4. Determine resource allocation per specialist
5. Load TWES context - MANDATORY:
   - /CLAUDE.md (project configuration)
   - /docs/ai/shared-context/standards/performance.md
   - /docs/ai/shared-context/standards/accessibility.md
   - /docs/ai/shared-context/standards/coding-conventions.md
   - /docs/ai/shared-context/patterns/common-patterns.md
   - /docs/ai/shared-context/themes/four-themes.md
6. Determine project integration points based on task type:
   - For MDX tasks → packages/web/src/lib/mdx/
   - For component tasks → packages/web/src/components/
   - For API tasks → packages/web/src/app/api/
   - For styling tasks → packages/ui/src/
   - For shared utilities → packages/shared/src/

**1.3 Create Orchestration Plan**
```yaml
orchestration_plan:
  task_id: [ID]
  complexity: [low|medium|high|extreme]
  output_mode: [exploration|project-ready]
  
  project_integration:
    target_directory: [from arguments or auto-detected]
    existing_files: [scan target directory]
    import_patterns: [analyze current import style]
    test_location: [determine test file location]
    dependencies_to_add: [based on task requirements]
  
  specialists_activation:
    performance: 
      priority: [high|medium|low]
      sub_agents: [number]
      focus_areas: ["bundle size", "runtime", "memory"]
    
    architecture:
      priority: [high|medium|low]
      sub_agents: [number]
      focus_areas: ["patterns", "scalability", "maintainability"]
    
    ux_dx:
      priority: [high|medium|low]
      sub_agents: [number]
      focus_areas: ["api design", "documentation", "error handling"]
    
    accessibility:
      priority: [high|medium|low]
      sub_agents: [number]
      focus_areas: ["screen readers", "keyboard", "aria"]
    
    innovation:
      priority: [high|medium|low]
      sub_agents: [number]
      focus_areas: ["modern features", "future proofing", "creative solutions"]

  success_criteria:
    [Define specific, measurable criteria based on task]
    - "Integrates with existing codebase"
    - "Follows project conventions"
    - "Passes existing test suite"

  timeline:
    total_execution: "estimated time"
    specialist_phase: "time per specialist"
    evaluation_phase: "time for evaluation"
    synthesis_phase: "time for synthesis"
    integration_phase: "time for project integration"
```

**CRITICAL: IMPLEMENTATION REQUIREMENTS**

**1. File System Structure**
All agents MUST follow this exact directory structure:
```
.taskmaster/infinite/orchestrated/task-{ID}/
├── state.yaml                    # Master orchestrator state tracking
├── orchestration-plan.yaml       # Initial plan
├── specialists/
│   ├── performance/
│   │   ├── bundle-optimizer/
│   │   │   ├── implementation.ts # Main implementation
│   │   │   ├── rationale.md     # Design decisions
│   │   │   ├── metrics.json     # Performance metrics
│   │   │   └── result.json      # Completion status
│   │   ├── runtime-optimizer/   # Same structure
│   │   └── memory-optimizer/    # Same structure
│   └── [other specialists...]   # Same pattern
├── evaluation/
│   ├── evaluation-report.md
│   ├── scores.json
│   └── compatibility-matrix.yaml
└── final/
    ├── implementation/
    ├── tests/
    └── integration-guide.md
```

**2. Result Tracking Protocol**
Every sub-agent MUST create result.json upon completion:
```json
{
  "agent_id": "perf-bundle-optimizer",
  "specialist": "performance",
  "task_id": 5,
  "completed_at": "2024-01-15T10:30:00Z",
  "status": "success",
  "outputs": {
    "implementation": "implementation.ts",
    "rationale": "rationale.md",
    "metrics": "metrics.json"
  },
  "summary": "Created minimal bundle implementation using...",
  "ready_for_evaluation": true
}
```

**3. State Management**
Master Orchestrator continuously updates state.yaml:
```yaml
orchestration_state:
  task_id: 5
  phase: "specialist_deployment"  # or "evaluation", "synthesis", etc.
  started_at: "2024-01-15T10:00:00Z"
  
  specialists_deployed:
    performance:
      status: "running"
      sub_agents_total: 3
      sub_agents_completed: 1
      started_at: "2024-01-15T10:05:00Z"
    architecture:
      status: "pending"
      sub_agents_total: 3
      sub_agents_completed: 0
  
  agents_registry:
    - id: "perf-bundle-optimizer"
      specialist: "performance"
      status: "completed"
      directory: "specialists/performance/bundle-optimizer"
      result_file: "specialists/performance/bundle-optimizer/result.json"
  
  phase_history:
    - phase: "initialization"
      started: "2024-01-15T10:00:00Z"
      completed: "2024-01-15T10:05:00Z"
      status: "success"
```

**PHASE 2: SPECIALIST ORCHESTRATOR DEPLOYMENT**

Deploy specialist orchestrators in parallel using the Task tool. Each specialist orchestrator will independently manage their own sub-agents.

**2.1 Deploy Performance Specialist Orchestrator using Task tool**

Use the Task tool to create the Performance Specialist Orchestrator:

```
TASK: Performance Specialist Orchestrator for Task [ID]

You are the Performance Specialist Orchestrator. Your responsibility is optimizing for speed, size, and efficiency.

Your mission:
1. Analyze the task requirements for performance implications
2. Deploy 3 specialized sub-agents using the Task tool
3. Coordinate their work and collect implementations
4. Report back with optimized solutions

Sub-Agents to Deploy (use Task tool for each):

Agent 1 - Bundle Optimizer:
- Focus: Minimal bundle size through code splitting, tree shaking, dependency optimization
- Deliverable: Ultra-light implementation with aggressive optimizations

Agent 2 - Runtime Optimizer:
- Focus: Maximum runtime performance, minimal re-renders, optimized algorithms
- Deliverable: Performance-focused implementation with benchmarks

Agent 3 - Memory Optimizer:
- Focus: Minimal memory footprint, leak prevention, efficient data structures
- Deliverable: Memory-conscious implementation with profiling data

Context provided:
- Task specification: [provide full details]
- Interface contract: [provide contract]
- Performance budget: [from success criteria]
- TWES documentation: [ALL loaded context from Phase 1.2]
- Project standards: [coding conventions, patterns, themes]
- Project integration plan: [target directories, import patterns, existing code]
- Output directory structure: [exact paths where each agent should write]

CRITICAL: All sub-agents MUST follow TWES standards:
- Use established patterns from /docs/ai/shared-context/patterns/
- Follow coding conventions exactly
- Ensure 98+ Lighthouse scores
- Support all 4 themes
- Use only pnpm (not npm)
- Consider existing code in target directory
- Match current import/export patterns

For project-ready mode:
- Create implementations that slot directly into the project
- Use relative imports matching project structure
- Include necessary type definitions
- Add appropriate tests

You must use the Task tool to deploy each of your sub-agents. Example invocation:

<function_calls>
<invoke name="Task">
<parameter name="description">Bundle Optimizer Sub-Agent</parameter>
<parameter name="prompt">TASK: Create bundle-optimized implementation for Task [ID]

You are the Bundle Optimizer sub-agent. Your specific directory:
.taskmaster/infinite/orchestrated/task-[ID]/specialists/performance/bundle-optimizer/

Create these files:
1. implementation.ts - Your optimized code
2. rationale.md - Explain your decisions
3. metrics.json - Bundle size data
4. result.json - Mark completion

Focus: Minimal bundle size through tree-shaking, code splitting, and zero dependencies.</parameter>
</invoke>
</function_calls>
```

**2.2 Deploy Architecture Specialist Orchestrator using Task tool**

Use the Task tool to create the Architecture Specialist Orchestrator:

```
TASK: Architecture Specialist Orchestrator for Task [ID]

You are the Architecture Specialist Orchestrator. Your responsibility is creating scalable, maintainable structures.

Your mission:
1. Analyze the task for architectural implications
2. Deploy 3 specialized sub-agents using the Task tool
3. Ensure architectural coherence across implementations
4. Report back with well-structured solutions

Sub-Agents to Deploy (use Task tool for each):

Agent 1 - Pattern Architect:
- Focus: Apply best-fit architectural patterns (composition, HOCs, hooks, state machines)
- Deliverable: Pattern-based implementation with clear architecture

Agent 2 - Scalability Engineer:
- Focus: Design for growth, extension, and evolving requirements
- Deliverable: Highly scalable implementation with extension points

Agent 3 - Maintainability Expert:
- Focus: Long-term maintenance, debugging ease, self-documenting code
- Deliverable: Clean, maintainable implementation with excellent structure

Context provided:
- Task specification: [provide full details]
- Interface contract: [provide contract]
- Architectural constraints: [from project]
- Existing patterns: [from codebase]

You must use the Task tool to deploy each of your sub-agents with their specific directives.
```

**2.3 Deploy UX/DX Specialist Orchestrator using Task tool**

Use the Task tool to create the UX/DX Specialist Orchestrator:

```
TASK: UX/DX Specialist Orchestrator for Task [ID]

You are the UX/DX Specialist Orchestrator. Your responsibility is developer and user experience excellence.

Your mission:
1. Analyze the task for developer experience opportunities
2. Deploy 4 specialized sub-agents using the Task tool
3. Create implementations that developers love to use
4. Report back with intuitive, well-documented solutions

Sub-Agents to Deploy (use Task tool for each):

Agent 1 - API Designer:
- Focus: Create intuitive, self-explanatory APIs that feel natural
- Deliverable: Implementation with delightful developer interface

Agent 2 - Documentation Writer:
- Focus: Comprehensive, example-rich documentation and inline comments
- Deliverable: Fully documented implementation with usage examples

Agent 3 - Error Experience Designer:
- Focus: Helpful error handling, validation, and recovery paths
- Deliverable: Implementation with excellent error management

Agent 4 - TypeScript Expert:
- Focus: Perfect type safety, IDE support, and type inference
- Deliverable: Fully typed implementation with great autocomplete

Context provided:
- Task specification: [provide full details]
- Interface contract: [provide contract]
- Target developers: [junior, senior, full-stack, etc.]
- DX best practices: [from project standards]

You must use the Task tool to deploy each of your sub-agents with their specific directives.
```

**2.4 Deploy Accessibility Specialist Orchestrator using Task tool**

Use the Task tool to create the Accessibility Specialist Orchestrator:

```
TASK: Accessibility Specialist Orchestrator for Task [ID]

You are the Accessibility Specialist Orchestrator. Your responsibility is universal access and WCAG compliance.

Your mission:
1. Analyze the task for accessibility requirements
2. Deploy 3 specialized sub-agents using the Task tool
3. Ensure all implementations are fully accessible
4. Report back with inclusive solutions

Sub-Agents to Deploy (use Task tool for each):

Agent 1 - Screen Reader Expert:
- Focus: Optimize for NVDA, JAWS, VoiceOver experience
- Deliverable: Implementation with perfect screen reader support

Agent 2 - Keyboard Navigator:
- Focus: Complete keyboard-only interaction patterns
- Deliverable: Implementation with comprehensive keyboard navigation

Agent 3 - ARIA Specialist:
- Focus: Comprehensive ARIA support and semantic HTML
- Deliverable: Implementation with proper ARIA attributes and roles

Context provided:
- Task specification: [provide full details]
- Interface contract: [provide contract]
- Accessibility requirements: WCAG 2.1 AA minimum
- User personas: [including users with disabilities]

You must use the Task tool to deploy each of your sub-agents with their specific directives.
```

**2.5 Deploy Innovation Specialist Orchestrator using Task tool**

Use the Task tool to create the Innovation Specialist Orchestrator:

```
TASK: Innovation Specialist Orchestrator for Task [ID]

You are the Innovation Specialist Orchestrator. Your responsibility is exploring cutting-edge possibilities.

Your mission:
1. Analyze the task for innovation opportunities
2. Deploy 3 specialized sub-agents using the Task tool
3. Push boundaries while maintaining practicality
4. Report back with forward-thinking solutions

Sub-Agents to Deploy (use Task tool for each):

Agent 1 - Modern Features Explorer:
- Focus: Leverage latest web platform capabilities and APIs
- Deliverable: Implementation using cutting-edge features

Agent 2 - Future Proofer:
- Focus: Anticipate future needs and platform evolution
- Deliverable: Forward-compatible implementation

Agent 3 - Creative Solver:
- Focus: Find unconventional solutions to requirements
- Deliverable: Innovative implementation with novel approaches

Context provided:
- Task specification: [provide full details]
- Interface contract: [provide contract]
- Innovation boundaries: [progressive enhancement required]
- Browser support matrix: [from project requirements]

You must use the Task tool to deploy each of your sub-agents with their specific directives.
```

**PHASE 3: SUB-AGENT EXECUTION**

Each Specialist Orchestrator MUST deploy their sub-agents using the Task tool. Here's how each orchestrator deploys their agents:

**Example: Performance Specialist deploys Bundle Optimizer**

```
TASK: Bundle Optimizer Sub-Agent for Task [ID]

You are a Bundle Optimizer sub-agent working under the Performance Specialist Orchestrator.

Your focused mission:
1. Create an implementation optimized for minimal bundle size
2. Apply aggressive tree shaking and code splitting
3. Eliminate all unnecessary dependencies
4. Document your optimization decisions

Deliverables:
- Complete implementation in: /specialists/performance/bundle-optimizer/
- Size metrics and analysis
- Rationale document explaining all optimizations
- Bundle size comparison data

Context:
- Task specification: [full details]
- Interface contract: [requirements]
- Performance budget: [size limits]

Focus exclusively on bundle size optimization while maintaining functionality.
```

**Parallel Execution Protocol:**
1. Each Specialist Orchestrator launches ALL their sub-agents simultaneously using Task tool
2. Sub-agents work independently in parallel
3. Each sub-agent creates their implementation in their designated directory
4. All sub-agents must complete before moving to evaluation phase

**Sub-Agent Output Requirements:**
Each sub-agent MUST produce:
- Complete, working implementation
- `rationale.md` explaining their approach and decisions
- Metrics relevant to their specialization
- Compatibility notes for synthesis phase

**PHASE 4: DEPLOY EVALUATION ORCHESTRATOR**

Once all sub-agents complete, deploy the Evaluation Orchestrator using the Task tool:

```
TASK: Evaluation Orchestrator for Task [ID]

You are the Evaluation Orchestrator. You will receive all implementations from the specialist orchestrators.

Your mission:
1. Collect all [N] implementations from [M] specialist teams
2. Perform comprehensive evaluation of each implementation
3. Identify conflicts and synergies between approaches
4. Create detailed evaluation report for synthesis phase

Evaluation Process:
1. Score each implementation:
   - Performance metrics (bundle size, runtime, memory)
   - Code quality metrics (complexity, maintainability)
   - API design scores (intuitiveness, flexibility)
   - Accessibility compliance (WCAG standards)
   - Innovation value (novelty vs practicality)

2. Analyze relationships:
   - Identify conflicting approaches
   - Find complementary solutions
   - Create compatibility matrix

3. Generate recommendations:
   - Rank implementations by category
   - Suggest synthesis strategy
   - Document resolution approaches

Deliverables:
- evaluation-report.md with comprehensive analysis
- compatibility-matrix.yaml showing relationships
- scores.json with all metrics
- synthesis-recommendations.md

You will work independently to evaluate all implementations objectively.
```

**PHASE 5: DEPLOY SYNTHESIS ORCHESTRATOR**

Based on evaluation results, deploy the Synthesis Orchestrator using the Task tool:

```
TASK: Synthesis Orchestrator for Task [ID]

You are the Synthesis Orchestrator. You have the evaluation report and must create the final implementation.

Your mission:
1. Analyze the evaluation report and recommendations
2. Deploy 3 synthesis sub-agents using the Task tool
3. Coordinate their work to create the optimal final solution
4. Deliver production-ready implementation

Synthesis Sub-Agents to Deploy (use Task tool for each):

Agent 1 - Code Merger:
TASK: Merge selected implementations into cohesive solution
- Combine best code from recommended implementations
- Maintain architectural coherence
- Resolve naming conflicts
- Preserve best patterns from each approach

Agent 2 - Conflict Resolver:
TASK: Harmonize incompatible approaches identified in evaluation
- Resolve conflicts between different implementations
- Find middle ground solutions
- Document all trade-offs made
- Ensure interface contract compliance

Agent 3 - Final Optimizer:
TASK: Polish and optimize the merged implementation
- Remove redundancy and dead code
- Optimize performance hotspots
- Enhance documentation and comments
- Add final tests and examples

Context provided:
- Evaluation report with scores and recommendations
- All implementation files from sub-agents
- Interface contract requirements
- Synthesis strategy: [best-of-breed|hybrid|consensus]

You must use the Task tool to deploy each synthesis sub-agent with their specific tasks.

Final deliverables:
- Production-ready implementation in /final/implementation/
- Comprehensive documentation in /final/documentation/
- Tests in /final/tests/
- Integration guide
```

**PHASE 6: FINAL ASSEMBLY**

Master Orchestrator performs final assembly:

1. Collect synthesis output
2. Validate against original requirements
3. Run final quality checks
4. Generate implementation report
5. Create decision documentation
6. Package for integration

**PHASE 7: PROJECT INTEGRATION**

Once synthesis is complete, handle project integration based on output_mode:

**7.1 Exploration Mode (Default)**
If output_mode = "exploration":
```
1. Keep all outputs in .taskmaster/infinite/orchestrated/
2. Generate comprehensive report with:
   - All implementation variations
   - Evaluation scores and rationale
   - Synthesis decisions
   - Learning insights
3. Create integration guide:
   - Manual steps to integrate chosen solution
   - File mapping (generated → project location)
   - Dependency installation commands
   - Test integration steps
```

**7.2 Project-Ready Mode**
If output_mode = "project-ready":
```
1. Prepare for direct integration:
   - Clean synthesized code (remove exploration artifacts)
   - Add proper file headers and comments
   - Ensure TWES compliance
   - Generate accompanying tests

2. Based on integration_plan:
   
   If "manual":
   - Create integration script at: .taskmaster/infinite/integration.sh
   - Generate detailed instructions
   - List all files to copy/create
   - Show exact commands to run (except git)
   - Provide commit message template
   
   If "staging":
   - Create staging directory with merged code
   - Run full test suite in staging
   - Generate integration helper script
   - Backup current project state
   - Prepare for manual git operations
   
   If "worktree":
   - Create git worktree for isolated testing
   - Apply changes in worktree
   - Run full validation
   - Provide migration instructions
   - Keep main branch untouched

3. Validation:
   - Run project test suite
   - Check TypeScript compilation
   - Verify bundle size constraints
   - Test in development environment
```

**7.3 Integration Validation**

Before any integration, validate environment:
```bash
# Check prerequisites
if [ ! -d "${target_dir}" ]; then
  echo "ERROR: Target directory ${target_dir} does not exist"
  echo "Please create it or specify a valid directory"
  exit 1
fi

if ! git rev-parse --git-dir > /dev/null 2>&1; then
  echo "ERROR: Not in a git repository"
  exit 1
fi

if ! command -v pnpm &> /dev/null; then
  echo "ERROR: pnpm is not installed"
  exit 1
fi

# Check for uncommitted changes
if ! git diff-index --quiet HEAD --; then
  echo "WARNING: You have uncommitted changes"
  echo "Creating stash for safety..."
  git stash push -m "orchestrate-task: pre-integration backup"
fi
```

**7.4 Integration Execution**

For automatic integration (non-git approach):
```bash
# Create a staging directory for safe integration
STAGING_DIR=".taskmaster/infinite/orchestrated/task-${task_id}/staging"
BACKUP_DIR=".taskmaster/infinite/orchestrated/task-${task_id}/backup"

# Validate source files exist
if [ ! -d ".taskmaster/infinite/orchestrated/task-${task_id}/final/implementation" ]; then
  echo "ERROR: Final implementation not found"
  exit 1
fi

# Create staging area
echo "Creating staging area..."
mkdir -p ${STAGING_DIR}
cp -r ${target_dir}/* ${STAGING_DIR}/ 2>/dev/null || true

# Apply implementation to staging
echo "Applying implementation to staging..."
cp -r .taskmaster/infinite/orchestrated/task-${task_id}/final/implementation/* ${STAGING_DIR}/

# Test in staging
echo "Testing staged implementation..."
cd ${STAGING_DIR}
if [ -f "package.json" ]; then
  # Install any new dependencies in staging
  if [ -f "../final/dependencies.json" ]; then
    echo "Installing dependencies in staging..."
    pnpm add $(cat ../final/dependencies.json | jq -r '.[]')
  fi
  
  # Run tests in staging
  if ! pnpm test; then
    echo "ERROR: Tests failed in staging. Integration aborted."
    exit 1
  fi
fi
cd -

# If tests pass, prepare for manual integration
echo "✅ Staging successful! Ready for integration."
echo ""
echo "To complete integration manually:"
echo "1. Review staged files: ${STAGING_DIR}"
echo "2. Copy to project: cp -r ${STAGING_DIR}/* ${target_dir}/"
echo "3. Run your git commands with your aliases"
echo ""
echo "Or use the generated integration script:"
echo "   .taskmaster/infinite/orchestrated/task-${task_id}/integrate.sh"

# Generate integration script
cat > .taskmaster/infinite/orchestrated/task-${task_id}/integrate.sh << 'EOF'
#!/bin/bash
# Integration script for Task ${task_id}
# This script prepares files but does NOT run git commands

echo "🚀 Starting integration for Task ${task_id}"

# Backup current state
echo "Creating backup..."
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR=".taskmaster/infinite/orchestrated/task-${task_id}/backup/${TIMESTAMP}"
mkdir -p "${BACKUP_DIR}"
cp -r "${target_dir}"/* "${BACKUP_DIR}/" 2>/dev/null || true

# Copy implementation
echo "Copying implementation files..."
cp -r "${STAGING_DIR}"/* "${target_dir}/"

# Install dependencies
if [ -f ".taskmaster/infinite/orchestrated/task-${task_id}/final/dependencies.json" ]; then
  echo "Dependencies to install:"
  cat .taskmaster/infinite/orchestrated/task-${task_id}/final/dependencies.json
  echo ""
  echo "Run: pnpm add [dependencies listed above]"
fi

# Run formatting
echo "Running formatters..."
pnpm format || true
pnpm lint --fix || true

# Final test
echo "Running final tests..."
pnpm test

echo ""
echo "✅ Integration complete!"
echo ""
echo "Suggested commit message:"
echo "------------------------"
cat .taskmaster/infinite/orchestrated/task-${task_id}/commit-message.txt
echo "------------------------"
echo ""
echo "Next steps:"
echo "1. Review the changes"
echo "2. Use your git aliases to create branch and commit"
echo "3. If issues occur, restore from: ${BACKUP_DIR}"
EOF

chmod +x .taskmaster/infinite/orchestrated/task-${task_id}/integrate.sh

# Generate commit message template
cat > .taskmaster/infinite/orchestrated/task-${task_id}/commit-message.txt << EOF
feat: add orchestrated implementation for task ${task_id}

- Performance optimized: ${perf_score}/100
- Accessibility score: ${a11y_score}/100
- Bundle size: ${bundle_size}
- Synthesis strategy: ${synthesis_strategy}

Generated by TaskMaster Infinite Orchestrated System
EOF
```

**Alternative: Worktree-based approach**
If integration_plan="worktree", create isolated test environment:
```bash
# Create a worktree for testing
WORKTREE_PATH=".taskmaster/infinite/orchestrated/task-${task_id}/worktree"
echo "Creating worktree for safe testing..."

# Check if we have uncommitted changes (worktree requires clean state)
if ! git diff-index --quiet HEAD --; then
  echo "WARNING: You have uncommitted changes. Stashing them for worktree creation..."
  git stash push -m "orchestrate-task: temporary stash for worktree"
  NEED_UNSTASH=true
fi

# Create worktree with new branch
if ! git worktree add "${WORKTREE_PATH}" -b "orchestrate-task-${task_id}-test"; then
  echo "ERROR: Failed to create worktree"
  [ "$NEED_UNSTASH" = true ] && git stash pop
  exit 1
fi

# Restore stash if we had one
[ "$NEED_UNSTASH" = true ] && git stash pop

# Apply implementation in worktree
echo "Applying implementation to worktree..."
cp -r .taskmaster/infinite/orchestrated/task-${task_id}/final/implementation/* \
     "${WORKTREE_PATH}/${target_dir}/"

# Install dependencies in worktree
cd "${WORKTREE_PATH}"
if [ -f "../final/dependencies.json" ]; then
  echo "Installing new dependencies in worktree..."
  pnpm add $(cat ../final/dependencies.json | jq -r '.[]')
fi

# Run full test suite in worktree
echo "Running tests in worktree..."
pnpm install
pnpm test
TEST_RESULT=$?

cd -

# Report results
if [ $TEST_RESULT -eq 0 ]; then
  echo "✅ Worktree tests passed!"
  echo ""
  echo "The implementation is ready in an isolated environment."
  echo ""
  echo "To explore the implementation:"
  echo "  cd ${WORKTREE_PATH}"
  echo "  pnpm dev  # Run the full app with changes"
  echo ""
  echo "To integrate changes:"
  echo "  Option 1 - Copy specific files:"
  echo "    cp ${WORKTREE_PATH}/${target_dir}/[file] ${target_dir}/"
  echo ""
  echo "  Option 2 - Copy everything:"
  echo "    cp -r ${WORKTREE_PATH}/${target_dir}/* ${target_dir}/"
  echo ""
  echo "  Option 3 - Use git cherry-pick after committing in worktree"
  echo ""
  echo "To clean up when done:"
  echo "  git worktree remove ${WORKTREE_PATH}"
  echo ""
  echo "Suggested commit message saved to:"
  echo "  .taskmaster/infinite/orchestrated/task-${task_id}/commit-message.txt"
else
  echo "❌ Tests failed in worktree"
  echo "Review failures at: ${WORKTREE_PATH}"
  echo "Remove with: git worktree remove --force ${WORKTREE_PATH}"
fi
```

**Worktree Benefits:**
- Complete isolation - your main directory stays untouched
- Full app testing - run dev server with all changes
- Side-by-side comparison - open both directories in your editor
- Git tracking - all changes are tracked in the worktree branch
- Easy rollback - just remove the worktree if needed

**7.5 Post-Integration Report**

Generate final report showing:
```yaml
integration_report:
  mode: "project-ready"
  status: "success"
  
  files_created:
    - path: "packages/web/src/lib/mdx/processor.ts"
      size: "3.2KB"
      from: "synthesis/final/processor.ts"
    
    - path: "packages/web/src/lib/mdx/transformers/index.ts"
      size: "1.8KB"
      from: "synthesis/final/transformers.ts"
  
  files_modified:
    - path: "packages/web/src/lib/mdx/index.ts"
      changes: "Added processor export"
  
  dependencies_added:
    - "unified": "^11.0.0"
    - "remark-gfm": "^4.0.0"
  
  test_results:
    - suite: "mdx-processor"
      status: "passed"
      tests: 24
    
  metrics:
    bundle_size_impact: "+2.1KB"
    performance_score: 98
    type_coverage: 100%
  
  next_steps:
    - "Review the implementation in your IDE"
    - "Run 'pnpm dev' to test locally"
    - "Consider adding more test cases"
    - "Update documentation if needed"
```

**EXECUTION COORDINATION**

The Master Orchestrator maintains a state machine:

```
States:
  - INITIALIZING: Setting up orchestration plan
  - SPECIALIST_DEPLOYMENT: Specialists working in parallel
  - SUB_AGENT_EXECUTION: Sub-agents generating implementations
  - EVALUATION: Analyzing all outputs
  - SYNTHESIS: Creating final implementation
  - FINALIZATION: Packaging and documentation
  - COMPLETE: Ready for integration

Transitions triggered by:
  - All specialists report ready
  - All sub-agents complete
  - Evaluation report generated
  - Synthesis complete
  - Quality checks pass
```

**COMMUNICATION PROTOCOL**

All orchestrators communicate through structured messages:

```typescript
interface OrchestratorMessage {
  messageId: string;
  timestamp: Date;
  from: {
    role: 'master' | 'specialist' | 'evaluator' | 'synthesizer';
    specialization?: string;
  };
  to: {
    role: string;
    specialization?: string;
  };
  type: 'directive' | 'status' | 'result' | 'query';
  payload: {
    content: any;
    attachments?: string[];
  };
  priority: 'urgent' | 'high' | 'normal' | 'low';
}
```

**OUTPUT STRUCTURE**

```
.taskmaster/infinite/orchestrated/task-[ID]/
├── orchestration-plan.yaml
├── specialists/
│   ├── performance/
│   │   ├── bundle-optimizer/
│   │   ├── runtime-optimizer/
│   │   └── memory-optimizer/
│   ├── architecture/
│   │   ├── pattern-architect/
│   │   ├── scalability-engineer/
│   │   └── maintainability-expert/
│   ├── ux-dx/
│   │   ├── api-designer/
│   │   ├── documentation-writer/
│   │   └── error-experience/
│   ├── accessibility/
│   │   ├── screen-reader-expert/
│   │   ├── keyboard-navigator/
│   │   └── aria-specialist/
│   └── innovation/
│       ├── modern-features/
│       ├── future-proofer/
│       └── creative-solver/
├── evaluation/
│   ├── evaluation-report.md
│   ├── compatibility-matrix.yaml
│   └── scores.json
├── synthesis/
│   ├── merger-output/
│   ├── resolver-decisions.md
│   └── final-optimized/
└── final/
    ├── implementation/
    ├── documentation/
    ├── tests/
    └── integration-guide.md
```

**QUALITY GATES**

Each phase must pass quality gates before proceeding:

1. **Specialist Gate**: All sub-agents deployed successfully
2. **Implementation Gate**: All implementations meet interface contract
3. **Evaluation Gate**: Comprehensive scoring completed
4. **Synthesis Gate**: No critical conflicts remain
5. **Final Gate**: All tests pass, documentation complete

**ERROR HANDLING**

If any orchestrator or sub-agent fails:
1. Master Orchestrator receives error notification
2. Attempts retry with adjusted parameters
3. If critical specialist fails, can proceed with degraded mode
4. Document all failures and adaptations
5. Include risk assessment in final report

**LEARNING MECHANISM**

After each orchestration:
1. Analyze which approaches were selected
2. Document patterns that emerged
3. Update specialist priorities for similar tasks
4. Refine sub-agent directives based on success
5. Contribute to pattern library

**USAGE EXAMPLES WITH PROJECT INTEGRATION:**

**Exploration mode (default) - study different approaches:**
```bash
/orchestrate-task task_id=5 specialists=all depth=3 synthesis_strategy=best-of-breed
```

**Project-ready with staging (recommended) - safe testing:**
```bash
/orchestrate-task task_id=5 specialists=all depth=3 synthesis_strategy=hybrid \
  output_mode=project-ready target_dir=packages/web/src/lib/mdx integration_plan=staging
```

**Project-ready with worktree - isolated testing:**
```bash
/orchestrate-task task_id=5 specialists=performance,architecture,ux_dx depth=4 \
  synthesis_strategy=consensus output_mode=project-ready \
  target_dir=packages/web/src/lib/mdx integration_plan=worktree
```

**Manual integration - just get the code and instructions:**
```bash
/orchestrate-task task_id=5 specialists=all depth=3 synthesis_strategy=best-of-breed \
  output_mode=project-ready target_dir=packages/web/src/lib/mdx integration_plan=manual
```

**Example with Task 5 (MDX Processing Pipeline):**
```bash
# First, explore different approaches
/orchestrate-task task_id=5 specialists=all depth=3 synthesis_strategy=best-of-breed

# Review the outputs in .taskmaster/infinite/orchestrated/task-5/
# Then integrate the best solution with staging
/orchestrate-task task_id=5 specialists=all depth=3 synthesis_strategy=best-of-breed \
  output_mode=project-ready target_dir=packages/web/src/lib/mdx integration_plan=staging

# After staging tests pass, use the generated script or manually:
# 1. cd .taskmaster/infinite/orchestrated/task-5/staging
# 2. Review all changes
# 3. cp -r * /path/to/packages/web/src/lib/mdx/
# 4. Use your git aliases to commit
```

This will:
1. Deploy Master Orchestrator to analyze MDX processing requirements
2. Activate all 5 Specialist Orchestrators
3. Each specialist deploys 3 sub-agents (15 total implementations)
4. Evaluation Orchestrator analyzes all outputs
5. Synthesis Orchestrator combines best elements
6. Create staging directory with full implementation
7. Run tests in isolation to verify everything works
8. Generate integration script and commit message template
9. You maintain full control over git operations

**ORCHESTRATION COMPLETE**

The orchestrated system is now ready to:
- Explore tasks with unprecedented depth
- Generate production-ready implementations
- Integrate directly into your project
- Learn from each execution

Begin orchestration with the Master Orchestrator initialization phase.