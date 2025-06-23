**ORCHESTRATE AND TEST - Unified Workflow Command**

Think deeply about orchestrating a comprehensive multi-agent implementation workflow for the given task. This command creates worktrees, deploys specialized agents, manages state, and provides real-time monitoring.

**Variables:**
- task_id: $ARGUMENTS (required)
- specialists: $ARGUMENTS (optional, default: "all")
- depth: $ARGUMENTS (optional, default: 3)
- auto_start_servers: $ARGUMENTS (optional, default: true)
- reuse_worktrees: $ARGUMENTS (optional, default: false)

**ARGUMENTS PARSING:**
Parse the following arguments from "$ARGUMENTS":
1. `task_id` - The TaskMaster task ID to implement
2. `specialists` - Which specialist perspectives to include (comma-separated or "all")
3. `depth` - Number of sub-agents per specialist (affects total implementations)
4. `auto_start_servers` - Whether to start development servers after orchestration
5. `reuse_worktrees` - Whether to reuse existing worktrees from previous runs

**PHASE 0: TASK SPECIFICATION ANALYSIS**

Read the task specification file at `.taskmaster/tasks/task_${String(task_id).padStart(3, '0')}.txt`.

Extract and analyze:
- Task ID, title, status, and priority
- Task description and detailed implementation requirements
- Test strategy for validation
- All subtasks with their descriptions, dependencies, and status
- Store complete task specification for all agents to reference

This task specification will be the foundation for all agent implementations.

**PHASE 1: PRE-FLIGHT CHECKS**

Validate the environment before beginning orchestration:

1. **Git Status Check**: Verify if there are uncommitted changes and warn the user, offering to continue or abort
2. **Task ID Validation**: Ensure the task_id contains only alphanumeric characters, hyphens, and underscores
3. **Worktree Management**: 
   - Derive worktree prefix as `task-{task_id}-orch`
   - Check for existing worktrees with this prefix
   - If reuse_worktrees is false and worktrees exist, offer options to remove, reuse, or cancel
4. **Port Availability**: 
   - Calculate required ports based on specialists (6 for all, or specialist count + 1)
   - Verify ports 3001-3006 (or required range) are available
5. **Output Directory Setup**:
   - Create orchestration output directory at `docs/ai/for-agentic-loops/orchestration-outputs/task-{task_id}`
   - Create subdirectories: state, analysis, synthesis, logs, contracts, summaries
6. **Real-time Monitoring Setup**:
   - Initialize orchestration.log with timestamp, task ID, specialists, and depth
   - Set up logging mechanism to track all agent deployments with timestamps
7. **State Management**:
   - Check for existing state file to enable resumption
   - If previous state exists for same task, offer to resume
8. **Time Estimation**: Calculate and display estimated time based on agent count (depth × 5 + 2 agents)

**PHASE 2: PRE-ANALYSIS - CONTRACT GENERATION**

Before any implementation work begins, generate shared contracts that will ensure all implementations are compatible:

Create a contracts directory in the orchestration output path and deploy a Pre-Analysis Agent using the Task tool.

```
TASK: Generate implementation contracts for Task ${task_id}

You are the Pre-Analysis Agent responsible for creating implementation contracts that will guide all other agents.

CONTEXT:
- Task specification: [Full content from .taskmaster/tasks/task_${String(task_id).padStart(3, '0')}.txt]
- Task ID: ${task_id}
- Task title: ${task_title}
- Task subtasks: ${task_subtasks}
- Output Directory: ${CONTRACTS_DIR}
- Purpose: Ensure all 15+ implementations are coherent and compatible
- Current Branch: ${CURRENT_BRANCH}
- Project Root: ${PROJECT_ROOT}

REQUIREMENTS:
1. Analyze the provided task specification thoroughly
2. Study existing codebase patterns and conventions
3. Consider all 5 specialist perspectives (Performance, Architecture, UX/DX, Accessibility, Innovation)
4. Generate 4 critical contract files:

   a) ${CONTRACTS_DIR}/interface-contract.yaml
      - Component props/API interface specifications
      - Event handlers and callback signatures
      - TypeScript type definitions
      - Return value contracts

   b) ${CONTRACTS_DIR}/behavior-contract.yaml
      - Core functionality requirements
      - User interaction patterns
      - State management approach
      - Error handling behavior

   c) ${CONTRACTS_DIR}/integration-contract.yaml
      - File naming conventions
      - Import/export patterns
      - Theme integration approach
      - Testing requirements

   d) ${CONTRACTS_DIR}/constraints.yaml
      - Performance budgets
      - Accessibility requirements (WCAG 2.1 AA)
      - Browser support targets
      - Dependencies allowed/forbidden

5. Ensure contracts are specific enough for compatibility but flexible for creativity
6. Focus on interfaces and behaviors, not implementation details
7. Consider edge cases and error states

DELIVERABLES:
- Four YAML contract files in ${CONTRACTS_DIR}
- Each contract should enable coherent multi-agent implementation
- Contracts must be parseable and actionable by all subsequent agents
```

After the Pre-Analysis Agent completes:
- Verify that all four contract files were generated successfully
- Log the completion with timestamp to orchestration.log
- Update state to indicate contracts are ready
- All subsequent agents will reference these contracts

**PHASE 3: SMART WORKTREE CREATION**

Create dedicated worktrees for each specialist to enable parallel implementation:

1. **Initialize State Tracking**: Create orchestration state file with task metadata, timestamps, and configuration
2. **Create Named Worktrees**: 
   - Performance: `task-{id}-orch-1-performance`
   - Architecture: `task-{id}-orch-2-architecture`
   - UX/DX: `task-{id}-orch-3-ux_dx`
   - Accessibility: `task-{id}-orch-4-accessibility`
   - Innovation: `task-{id}-orch-5-innovation`
   - Synthesis: `task-{id}-orch-6-synthesis`
3. **Install Dependencies**: Run pnpm install in each worktree (can be done in parallel)
4. **Track Worktree State**: Record each worktree's path, assigned port, and specialist in the state file

**PHASE 4: ORCHESTRATION WITH PROGRESS TRACKING**

Begin the main orchestration phase with real-time monitoring:

1. **Update State**: Mark orchestration as active in the state file
2. **Log Phase Start**: Record orchestration phase start with timestamp in orchestration.log
3. **Deploy Orchestration Agents**: Launch the multi-tier agent system

```
TASK: Orchestrate multi-agent implementation system for Task ${task_id}

You are the Master Orchestrator for Task ${task_id}, coordinating a sophisticated multi-agent system.

CONTEXT:
- Task specification: [Full content from .taskmaster/tasks/task_${String(task_id).padStart(3, '0')}.txt]
- Task ID: ${task_id}
- Task title: ${task_title}
- Task subtasks: ${task_subtasks}
- Specialists: ${specialists}
- Depth: ${depth} sub-agents per specialist
- Deployment Mode: worktree-all
- Worktree Prefix: ${worktree_prefix}
- Target Path: packages/web/src/components
- Analysis Output: ${ORCH_OUTPUT_DIR}/analysis/
- Contracts Directory: ${CONTRACTS_DIR}

REQUIREMENTS:
1. Read and understand all implementation contracts:
   - ${CONTRACTS_DIR}/interface-contract.yaml - Component interfaces
   - ${CONTRACTS_DIR}/behavior-contract.yaml - Required behaviors
   - ${CONTRACTS_DIR}/integration-contract.yaml - Code patterns
   - ${CONTRACTS_DIR}/constraints.yaml - Implementation limits

2. Deploy and coordinate 5 Specialist Orchestrators:
   - Performance Specialist → .worktrees/${worktree_prefix}-1-performance/
   - Architecture Specialist → .worktrees/${worktree_prefix}-2-architecture/
   - UX/DX Specialist → .worktrees/${worktree_prefix}-3-ux_dx/
   - Accessibility Specialist → .worktrees/${worktree_prefix}-4-accessibility/
   - Innovation Specialist → .worktrees/${worktree_prefix}-5-innovation/

3. Ensure each specialist:
   - Receives and understands the contracts
   - Deploys ${depth} sub-agents for implementation
   - Works within their assigned worktree
   - Follows project standards and conventions

4. Monitor and coordinate:
   - Track implementation progress across all worktrees
   - Ensure consistent quality and integration
   - Resolve conflicts between specialist approaches
   - Prepare synthesis strategy

5. Document orchestration decisions:
   - Write analysis to ${ORCH_OUTPUT_DIR}/analysis/master-coordination.md
   - Track specialist deployment status
   - Log key decisions and trade-offs

DELIVERABLES:
- Deployed specialist orchestrators following contracts
- Coordination documentation in analysis directory
- Prepared synthesis strategy for final implementation
```

**Parallel Execution Management:**
- Deploy Master Orchestrator using Task tool
- Wait for master coordination strategy before deploying specialists
- Log completion with timestamp to orchestration.log

**Deploy Specialist Orchestrators using Task tool (5 agents in parallel):**

Deploy five specialist orchestrators simultaneously, each focusing on their domain of expertise:

```
TASK: Performance Specialist Orchestrator for Task ${task_id}

You are the Performance Specialist Orchestrator.

CONTEXT:
- Task specification: [Full content from .taskmaster/tasks/task_${String(task_id).padStart(3, '0')}.txt]
- Task ID: ${task_id}
- Task title: ${task_title}
- Worktree: .worktrees/${worktree_prefix}-1-performance/
- Focus: Bundle size, runtime performance, memory efficiency
- Analysis output: ${ORCH_OUTPUT_DIR}/analysis/performance/
- Sub-agent count: ${depth}
- Contracts: ${CONTRACTS_DIR}

REQUIREMENTS:
1. Read and understand all implementation contracts:
   - ${CONTRACTS_DIR}/interface-contract.yaml - Component interfaces
   - ${CONTRACTS_DIR}/behavior-contract.yaml - Required behaviors
   - ${CONTRACTS_DIR}/integration-contract.yaml - Code patterns
   - ${CONTRACTS_DIR}/constraints.yaml - Performance budgets

2. Deploy ${depth} sub-agents to create implementations:
   - Bundle Optimizer → _implementations/bundle-optimizer/
   - Runtime Optimizer → _implementations/runtime-optimizer/
   - Memory Optimizer → _implementations/memory-optimizer/

3. Ensure each implementation:
   - Is complete and functional
   - Strictly adheres to ALL contracts
   - Optimizes for performance metrics
   - Can be tested independently

4. Document your orchestration decisions:
   - Write decision log to ${ORCH_OUTPUT_DIR}/analysis/performance/decisions.md
   - Explain trade-offs between implementations
   - Note performance metrics and benchmarks

DELIVERABLES:
- ${depth} complete implementations in designated folders
- Decision log documenting approach and trade-offs
- All implementations compliant with contracts
```

```
TASK: Architecture Specialist Orchestrator for Task ${task_id}

You are the Architecture Specialist Orchestrator.

CONTEXT:
- Task specification: [Full content from .taskmaster/tasks/task_${String(task_id).padStart(3, '0')}.txt]
- Task ID: ${task_id}
- Task title: ${task_title}
- Worktree: .worktrees/${worktree_prefix}-2-architecture/
- Focus: Code organization, maintainability, scalability
- Analysis output: ${ORCH_OUTPUT_DIR}/analysis/architecture/
- Sub-agent count: ${depth}
- Contracts: ${CONTRACTS_DIR}

REQUIREMENTS:
1. Read and understand all implementation contracts:
   - ${CONTRACTS_DIR}/interface-contract.yaml - Component interfaces
   - ${CONTRACTS_DIR}/behavior-contract.yaml - Required behaviors
   - ${CONTRACTS_DIR}/integration-contract.yaml - Code patterns
   - ${CONTRACTS_DIR}/constraints.yaml - Architectural patterns

2. Deploy ${depth} sub-agents to create implementations:
   - Modular Design → _implementations/modular-design/
   - Maintainability Focused → _implementations/maintainability-focused/
   - Scalability Optimized → _implementations/scalability-optimized/

3. Ensure each implementation:
   - Is complete and functional
   - Strictly adheres to ALL contracts
   - Demonstrates architectural best practices
   - Supports future extensibility

4. Document your orchestration decisions:
   - Write decision log to ${ORCH_OUTPUT_DIR}/analysis/architecture/decisions.md
   - Explain architectural choices
   - Note patterns and structures used

DELIVERABLES:
- ${depth} complete implementations in designated folders
- Decision log documenting architectural approach
- All implementations compliant with contracts
```

```
TASK: UX/DX Specialist Orchestrator for Task ${task_id}

You are the UX/DX Specialist Orchestrator.

CONTEXT:
- Task specification: [Full content from .taskmaster/tasks/task_${String(task_id).padStart(3, '0')}.txt]
- Task ID: ${task_id}
- Task title: ${task_title}
- Worktree: .worktrees/${worktree_prefix}-3-ux_dx/
- Focus: User experience, developer experience, API design
- Analysis output: ${ORCH_OUTPUT_DIR}/analysis/ux_dx/
- Sub-agent count: ${depth}
- Contracts: ${CONTRACTS_DIR}

REQUIREMENTS:
1. Read and understand all implementation contracts:
   - ${CONTRACTS_DIR}/interface-contract.yaml - Component interfaces
   - ${CONTRACTS_DIR}/behavior-contract.yaml - Required behaviors
   - ${CONTRACTS_DIR}/integration-contract.yaml - Code patterns
   - ${CONTRACTS_DIR}/constraints.yaml - UX/DX standards

2. Deploy ${depth} sub-agents to create implementations:
   - Intuitive API → _implementations/intuitive-api/
   - Enhanced UX → _implementations/enhanced-ux/
   - Developer Friendly → _implementations/developer-friendly/

3. Ensure each implementation:
   - Is complete and functional
   - Strictly adheres to ALL contracts
   - Optimizes for user and developer experience
   - Can be tested independently

4. Document your orchestration decisions:
   - Write decision log to ${ORCH_OUTPUT_DIR}/analysis/ux_dx/decisions.md
   - Explain UX/DX trade-offs
   - Note usability metrics and API design choices

DELIVERABLES:
- ${depth} complete implementations in designated folders
- Decision log documenting UX/DX approach
- All implementations compliant with contracts
```

```
TASK: Accessibility Specialist Orchestrator for Task ${task_id}

You are the Accessibility Specialist Orchestrator.

CONTEXT:
- Task specification: [Full content from .taskmaster/tasks/task_${String(task_id).padStart(3, '0')}.txt]
- Task ID: ${task_id}
- Task title: ${task_title}
- Worktree: .worktrees/${worktree_prefix}-4-accessibility/
- Focus: WCAG compliance, screen reader support, keyboard navigation
- Analysis output: ${ORCH_OUTPUT_DIR}/analysis/accessibility/
- Sub-agent count: ${depth}
- Contracts: ${CONTRACTS_DIR}

REQUIREMENTS:
1. Read and understand all implementation contracts:
   - ${CONTRACTS_DIR}/interface-contract.yaml - Component interfaces
   - ${CONTRACTS_DIR}/behavior-contract.yaml - Required behaviors
   - ${CONTRACTS_DIR}/integration-contract.yaml - Code patterns
   - ${CONTRACTS_DIR}/constraints.yaml - Accessibility requirements

2. Deploy ${depth} sub-agents to create implementations:
   - WCAG Compliant → _implementations/wcag-compliant/
   - Screen Reader Optimized → _implementations/screen-reader-optimized/
   - Keyboard First → _implementations/keyboard-first/

3. Ensure each implementation:
   - Is complete and functional
   - Strictly adheres to ALL contracts
   - Meets WCAG 2.1 AA standards
   - Can be tested independently

4. Document your orchestration decisions:
   - Write decision log to ${ORCH_OUTPUT_DIR}/analysis/accessibility/decisions.md
   - Explain accessibility trade-offs
   - Note ARIA usage and semantic HTML choices

DELIVERABLES:
- ${depth} complete implementations in designated folders
- Decision log documenting accessibility approach
- All implementations compliant with contracts
```

```
TASK: Innovation Specialist Orchestrator for Task ${task_id}

You are the Innovation Specialist Orchestrator.

CONTEXT:
- Task specification: [Full content from .taskmaster/tasks/task_${String(task_id).padStart(3, '0')}.txt]
- Task ID: ${task_id}
- Task title: ${task_title}
- Worktree: .worktrees/${worktree_prefix}-5-innovation/
- Focus: Cutting-edge features, creative solutions, future-proofing
- Analysis output: ${ORCH_OUTPUT_DIR}/analysis/innovation/
- Sub-agent count: ${depth}
- Contracts: ${CONTRACTS_DIR}

REQUIREMENTS:
1. Read and understand all implementation contracts:
   - ${CONTRACTS_DIR}/interface-contract.yaml - Component interfaces
   - ${CONTRACTS_DIR}/behavior-contract.yaml - Required behaviors
   - ${CONTRACTS_DIR}/integration-contract.yaml - Code patterns
   - ${CONTRACTS_DIR}/constraints.yaml - Innovation boundaries

2. Deploy ${depth} sub-agents to create implementations:
   - AI Enhanced → _implementations/ai-enhanced/
   - Experimental Features → _implementations/experimental-features/
   - Future Proof → _implementations/future-proof/

3. Ensure each implementation:
   - Is complete and functional
   - Strictly adheres to ALL contracts
   - Pushes boundaries while maintaining stability
   - Can be tested independently

4. Document your orchestration decisions:
   - Write decision log to ${ORCH_OUTPUT_DIR}/analysis/innovation/decisions.md
   - Explain innovative approaches
   - Note future-proofing strategies

DELIVERABLES:
- ${depth} complete implementations in designated folders
- Decision log documenting innovation approach
- All implementations compliant with contracts
```

**Parallel Execution Management:**
- Deploy all 5 Specialist Orchestrators using Task tool in parallel
- Each specialist will deploy their own 3 sub-agents
- Monitor orchestration.log for deployment progress
- Wait for all specialists to complete before evaluation phase

**Deploy Sub-Agents (15 total, 3 per specialist) using Task tool:**

Each specialist orchestrator deploys 3 sub-agents to create different implementations. Log all deployments with timestamps to orchestration.log.

Each specialist orchestrator should deploy their 3 sub-agents to create diverse implementations:

**Performance Sub-Agents (3 agents):**
- Bundle Optimizer: Focus on minimal bundle size, tree-shaking, and code splitting
- Runtime Optimizer: Optimize execution speed and rendering performance
- Memory Optimizer: Reduce memory footprint and prevent leaks

**Architecture Sub-Agents (3 agents):**
- Modular Design: Create highly decomposed, reusable components
- Maintainability Focused: Emphasize clean code and clear patterns
- Scalability Optimized: Design for future growth and extension

**UX/DX Sub-Agents (3 agents):**
- Intuitive API: Design developer-friendly component interfaces
- Enhanced UX: Focus on end-user experience and interactions
- Developer Friendly: Prioritize debugging and development workflow

**Accessibility Sub-Agents (3 agents):**
- WCAG Compliant: Ensure full compliance with accessibility standards
- Screen Reader Optimized: Perfect experience for assistive technologies
- Keyboard First: Complete keyboard navigation support

**Innovation Sub-Agents (3 agents):**
- AI Enhanced: Integrate cutting-edge AI features
- Experimental Features: Push boundaries with new technologies
- Future Proof: Design for tomorrow's requirements

All sub-agents must:
- Write implementations to their designated _implementations subdirectory
- Strictly follow the contracts from the Pre-Analysis phase
- Document their design decisions in README files
- Log their deployment and completion to orchestration.log

```
TASK: Evaluation Orchestrator for Task ${task_id}

You are the Evaluation Orchestrator responsible for analyzing all implementations.

CONTEXT:
- Task specification: [Full content from .taskmaster/tasks/task_${String(task_id).padStart(3, '0')}.txt]
- Task ID: ${task_id}
- Task title: ${task_title}
- Total implementations: 15 (3 per specialist across 5 worktrees)
- Contracts: ${CONTRACTS_DIR}
- Evaluation output: ${ORCH_OUTPUT_DIR}/analysis/evaluation/
- Worktree prefix: ${worktree_prefix}

REQUIREMENTS:
1. Analyze all 15 implementations across the 5 specialist worktrees:
   - Performance worktree: 3 implementations
   - Architecture worktree: 3 implementations
   - UX/DX worktree: 3 implementations
   - Accessibility worktree: 3 implementations
   - Innovation worktree: 3 implementations

2. Use the Pre-Analysis contracts as evaluation rubric:
   - ${CONTRACTS_DIR}/interface-contract.yaml - Verify API compliance
   - ${CONTRACTS_DIR}/behavior-contract.yaml - Check behavior correctness
   - ${CONTRACTS_DIR}/integration-contract.yaml - Validate patterns
   - ${CONTRACTS_DIR}/constraints.yaml - Ensure constraint adherence

3. Create comprehensive evaluation:
   - Score each implementation on contract compliance
   - Update manifest.json files with metrics and rankings
   - Identify any non-compliant implementations
   - Note strengths and weaknesses of each approach

4. Write evaluation summary to:
   - ${ORCH_OUTPUT_DIR}/analysis/evaluation/summary.md
   - Include rankings, compliance scores, and recommendations
   - Log evaluation progress with timestamps to orchestration.log

DELIVERABLES:
- Evaluation report for all 15 implementations
- Updated manifest.json files with scores
- Comprehensive summary for synthesis guidance
```

**Parallel Execution Management:**
- Deploy Evaluation Orchestrator using Task tool
- Wait for all specialist implementations to complete first
- Log evaluation progress to orchestration.log

**Deploy Progressive Summarization Agents using Task tool (5 agents in parallel):**

To prevent context window overload during the synthesis phase, deploy 5 summarization agents in parallel - one for each specialist. Log the summarization phase start with timestamp to orchestration.log.

```
TASK: Performance Summarization Agent for Task ${task_id}

You are the Performance Summarization Agent.

CONTEXT:
- Task specification: [Full content from .taskmaster/tasks/task_${String(task_id).padStart(3, '0')}.txt]
- Task ID: ${task_id}
- Task title: ${task_title}
- Worktree: .worktrees/${worktree_prefix}-1-performance/
- Implementations to analyze:
  - _implementations/bundle-optimizer/
  - _implementations/runtime-optimizer/
  - _implementations/memory-optimizer/
- Summary output: ${ORCH_OUTPUT_DIR}/summaries/performance-summary.md

REQUIREMENTS:
1. Read and analyze all 3 performance implementations
2. Create a concise summary (maximum 500 words) covering:
   - Key features of each implementation
   - Performance trade-offs and metrics
   - Unique optimizations and innovations
   - Best use cases for each approach
   - Synthesis recommendations

3. Use standardized structure:
   - Overview (50 words)
   - Implementation Analysis (300 words)
   - Synthesis Guidance (150 words)

4. Focus on performance-specific aspects:
   - Bundle size impacts
   - Runtime performance metrics
   - Memory usage patterns
   - Optimization techniques used

DELIVERABLE: Structured summary in ${ORCH_OUTPUT_DIR}/summaries/performance-summary.md
```

```
TASK: Architecture Summarization Agent for Task ${task_id}

You are the Architecture Summarization Agent.

CONTEXT:
- Task specification: [Full content from .taskmaster/tasks/task_${String(task_id).padStart(3, '0')}.txt]
- Task ID: ${task_id}
- Task title: ${task_title}
- Worktree: .worktrees/${worktree_prefix}-2-architecture/
- Implementations to analyze:
  - _implementations/modular-design/
  - _implementations/maintainability-focused/
  - _implementations/scalability-optimized/
- Summary output: ${ORCH_OUTPUT_DIR}/summaries/architecture-summary.md

REQUIREMENTS:
1. Read and analyze all 3 architecture implementations
2. Create a concise summary (maximum 500 words) covering:
   - Key architectural patterns used
   - Code organization approaches
   - Maintainability strategies
   - Scalability considerations
   - Synthesis recommendations

3. Use standardized structure:
   - Overview (50 words)
   - Implementation Analysis (300 words)
   - Synthesis Guidance (150 words)

4. Focus on architecture-specific aspects:
   - Component structure
   - Separation of concerns
   - Design patterns employed
   - Future extensibility

DELIVERABLE: Structured summary in ${ORCH_OUTPUT_DIR}/summaries/architecture-summary.md
```

```
TASK: UX/DX Summarization Agent for Task ${task_id}

You are the UX/DX Summarization Agent.

CONTEXT:
- Task specification: [Full content from .taskmaster/tasks/task_${String(task_id).padStart(3, '0')}.txt]
- Task ID: ${task_id}
- Task title: ${task_title}
- Worktree: .worktrees/${worktree_prefix}-3-ux_dx/
- Implementations to analyze:
  - _implementations/intuitive-api/
  - _implementations/enhanced-ux/
  - _implementations/developer-friendly/
- Summary output: ${ORCH_OUTPUT_DIR}/summaries/ux-dx-summary.md

REQUIREMENTS:
1. Read and analyze all 3 UX/DX implementations
2. Create a concise summary (maximum 500 words) covering:
   - API design choices
   - User experience enhancements
   - Developer ergonomics
   - Documentation approaches
   - Synthesis recommendations

3. Use standardized structure:
   - Overview (50 words)
   - Implementation Analysis (300 words)
   - Synthesis Guidance (150 words)

4. Focus on UX/DX-specific aspects:
   - API intuitiveness
   - Error handling
   - Developer tooling
   - User interaction patterns

DELIVERABLE: Structured summary in ${ORCH_OUTPUT_DIR}/summaries/ux-dx-summary.md
```

```
TASK: Accessibility Summarization Agent for Task ${task_id}

You are the Accessibility Summarization Agent.

CONTEXT:
- Task specification: [Full content from .taskmaster/tasks/task_${String(task_id).padStart(3, '0')}.txt]
- Task ID: ${task_id}
- Task title: ${task_title}
- Worktree: .worktrees/${worktree_prefix}-4-accessibility/
- Implementations to analyze:
  - _implementations/wcag-compliant/
  - _implementations/screen-reader-optimized/
  - _implementations/keyboard-first/
- Summary output: ${ORCH_OUTPUT_DIR}/summaries/accessibility-summary.md

REQUIREMENTS:
1. Read and analyze all 3 accessibility implementations
2. Create a concise summary (maximum 500 words) covering:
   - WCAG compliance levels
   - Screen reader optimizations
   - Keyboard navigation patterns
   - ARIA usage strategies
   - Synthesis recommendations

3. Use standardized structure:
   - Overview (50 words)
   - Implementation Analysis (300 words)
   - Synthesis Guidance (150 words)

4. Focus on accessibility-specific aspects:
   - Semantic HTML usage
   - Focus management
   - Color contrast approaches
   - Assistive technology support

DELIVERABLE: Structured summary in ${ORCH_OUTPUT_DIR}/summaries/accessibility-summary.md
```

```
TASK: Innovation Summarization Agent for Task ${task_id}

You are the Innovation Summarization Agent.

CONTEXT:
- Task specification: [Full content from .taskmaster/tasks/task_${String(task_id).padStart(3, '0')}.txt]
- Task ID: ${task_id}
- Task title: ${task_title}
- Worktree: .worktrees/${worktree_prefix}-5-innovation/
- Implementations to analyze:
  - _implementations/ai-enhanced/
  - _implementations/experimental-features/
  - _implementations/future-proof/
- Summary output: ${ORCH_OUTPUT_DIR}/summaries/innovation-summary.md

REQUIREMENTS:
1. Read and analyze all 3 innovation implementations
2. Create a concise summary (maximum 500 words) covering:
   - Innovative features introduced
   - AI/ML integrations
   - Experimental technologies used
   - Future-proofing strategies
   - Synthesis recommendations

3. Use standardized structure:
   - Overview (50 words)
   - Implementation Analysis (300 words)
   - Synthesis Guidance (150 words)

4. Focus on innovation-specific aspects:
   - Cutting-edge technologies
   - Novel interaction patterns
   - Progressive enhancement
   - Technology adoption risks

DELIVERABLE: Structured summary in ${ORCH_OUTPUT_DIR}/summaries/innovation-summary.md
```

**Parallel Execution Management:**
- Deploy all 5 Summarization Agents using Task tool in parallel
- Each reads from their respective specialist worktree
- Creates standardized 500-word summaries
- Log all deployments and completions to orchestration.log

```
TASK: Synthesis Orchestrator for Task ${task_id}

You are the Synthesis Orchestrator, creating the ultimate implementation.

CONTEXT:
- Task specification: [Full content from .taskmaster/tasks/task_${String(task_id).padStart(3, '0')}.txt]
- Task ID: ${task_id}
- Task title: ${task_title}
- Worktree: .worktrees/${worktree_prefix}-6-synthesis/
- Contracts: ${CONTRACTS_DIR}
- Summaries: ${ORCH_OUTPUT_DIR}/summaries/
- Evaluation: ${ORCH_OUTPUT_DIR}/analysis/evaluation/summary.md
- Decision logs: ${ORCH_OUTPUT_DIR}/analysis/*/decisions.md
- Target: packages/web/src/components/

REQUIREMENTS:
1. Read ALL synthesis inputs to prevent context overload:
   - ${ORCH_OUTPUT_DIR}/summaries/performance-summary.md (500 words)
   - ${ORCH_OUTPUT_DIR}/summaries/architecture-summary.md (500 words)
   - ${ORCH_OUTPUT_DIR}/summaries/ux-dx-summary.md (500 words)
   - ${ORCH_OUTPUT_DIR}/summaries/accessibility-summary.md (500 words)
   - ${ORCH_OUTPUT_DIR}/summaries/innovation-summary.md (500 words)
   - ${ORCH_OUTPUT_DIR}/analysis/evaluation/summary.md

2. Create the ultimate synthesis by:
   - Cherry-picking best features from each summary
   - Following synthesis recommendations
   - Balancing all 5 specialist perspectives
   - Selectively reading specific implementations only when needed

3. Ensure complete contract compliance:
   - ${CONTRACTS_DIR}/interface-contract.yaml - Exact API match
   - ${CONTRACTS_DIR}/behavior-contract.yaml - All behaviors included
   - ${CONTRACTS_DIR}/integration-contract.yaml - Proper patterns
   - ${CONTRACTS_DIR}/constraints.yaml - All constraints met

4. Document synthesis approach:
   - Write to ${ORCH_OUTPUT_DIR}/analysis/synthesis/decisions.md
   - Explain feature selection rationale
   - Note trade-off resolutions
   - Log progress to orchestration.log

DELIVERABLES:
- Complete, production-ready implementation in worktree
- Synthesis decision documentation
- Implementation that represents best of all 15 approaches
```

**Parallel Execution Management:**
- Deploy Synthesis Orchestrator using Task tool
- Wait for all summarization agents to complete first
- Log synthesis progress to orchestration.log
- Final implementation represents culmination of multi-agent process

**Enhanced Coordination Through Decision Logs:**

Each specialist writes decisions to help other agents understand their approach:
- Performance: ${ORCH_OUTPUT_DIR}/analysis/performance/decisions.md
- Architecture: ${ORCH_OUTPUT_DIR}/analysis/architecture/decisions.md
- UX/DX: ${ORCH_OUTPUT_DIR}/analysis/ux_dx/decisions.md
- Accessibility: ${ORCH_OUTPUT_DIR}/analysis/accessibility/decisions.md
- Innovation: ${ORCH_OUTPUT_DIR}/analysis/innovation/decisions.md

These logs help the Synthesis agent understand trade-offs and make informed decisions.

**Implementation Structure:**

Each worktree will have this structure after orchestration:
```
packages/web/src/components/
├── _implementations/
│   ├── [impl-name-1]/
│   │   └── [complete implementation]
│   ├── [impl-name-2]/
│   │   └── [complete implementation]
│   ├── [impl-name-3]/
│   │   └── [complete implementation]
│   ├── manifest.json
│   ├── ACTIVE
│   └── switch.sh
└── [active implementation files]
```

The orchestration will take approximately ${EST_TIME} seconds to complete.

Log the Synthesis Orchestrator completion and final orchestration summary with timestamps. Record the total number of agents deployed (28 total: 1 pre-analysis + 5 specialists + 15 sub-agents + 1 evaluation + 5 summarization + 1 synthesis) and provide the command to monitor real-time progress.

**PHASE 5: AUTO-START DEV SERVERS**

If auto_start_servers is true, automatically start development servers for all worktrees:

1. **Create Server Management Script**: Generate an executable script in the orchestration output directory that manages all development servers

2. **Server Configuration**:
   - Performance worktree on port 3001
   - Architecture worktree on port 3002
   - UX/DX worktree on port 3003
   - Accessibility worktree on port 3004
   - Innovation worktree on port 3005
   - Synthesis worktree on port 3006

3. **Tmux Session Management**: Create a tmux session named 'orchestration' with separate windows for each server, allowing easy monitoring and management of all running implementations

4. **Provide Access Information**: Display URLs for each implementation and instructions for viewing server logs

**PHASE 6: CREATE COMPARISON DASHBOARD**

Generate an HTML comparison dashboard in the orchestration output directory that allows side-by-side comparison of all implementations. The dashboard should:

- Display all 6 implementations in a responsive grid layout
- Use iframes to show each implementation running on its respective port
- Include auto-refresh functionality for when servers are starting up
- Provide a clean, professional interface for evaluating different approaches
- Save the dashboard as comparison-dashboard.html in the orchestration output directory

**PHASE 7: FINAL SUMMARY**

Display a comprehensive summary of the orchestration results:

**Summary Statistics:**
- Task ID and configuration used
- Number of contracts generated (4)
- Total implementations created (15 + 1 synthesis)
- Worktrees created (6)
- Decision logs and progressive summaries generated
- Location of the real-time orchestration log
- Total execution time

**Quick Access Links:**
- Direct URLs to each implementation (ports 3001-3006)
- Path to the comparison dashboard

**Next Steps Guide:**
- Command to monitor real-time orchestration progress
- How to review contracts, implementations, summaries, and decision logs
- Instructions for switching between implementations
- How to view server logs via tmux
- Cleanup command for when testing is complete

**State Management:**
Update the orchestration state file to mark the process as completed with timestamp.

**ERROR RECOVERY**

If orchestration fails at any point, implement graceful error handling:

1. **Save Recovery State**: Append error information to the state file including the phase where failure occurred, error message, and recovery options

2. **Provide Recovery Options**:
   - Resume from failure point using the resume parameter
   - Start fresh by cleaning up and re-running
   - Check logs to diagnose the issue

3. **Maintain State Consistency**: Ensure the state file accurately reflects what was completed before failure to enable proper resumption

4. **User-Friendly Feedback**: Display clear error messages and actionable recovery commands

**USAGE:**

Simple usage:
- `/orchestrate-and-test task_id=7`

With options:
- `/orchestrate-and-test task_id=7 specialists=performance,architecture depth=2 auto_start_servers=false`

Resume a failed run:
- `/orchestrate-and-test task_id=7 resume=true`