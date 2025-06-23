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

**PHASE 0: PRE-FLIGHT CHECKS**

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

**PHASE 0.5: PRE-ANALYSIS - CONTRACT GENERATION**

Before any implementation work begins, generate shared contracts that will ensure all implementations are compatible:

Create a contracts directory in the orchestration output path and deploy a Pre-Analysis Agent using the Task tool.

**Deploy Pre-Analysis Agent using Task tool:**

The Pre-Analysis Agent analyzes Task {task_id} and generates contracts that guide all other agents:

You are the Pre-Analysis Agent responsible for creating implementation contracts that will guide all other agents.

**Your Critical Mission**: Analyze Task ${task_id} and generate contracts that will ensure all 15+ implementations are coherent and compatible.

**Contract Files to Generate**:

1. **${CONTRACTS_DIR}/interface-contract.yaml**
   - Component props/API interface
   - Event handlers and callbacks
   - Type definitions
   - Return value contracts

2. **${CONTRACTS_DIR}/behavior-contract.yaml**
   - Core functionality requirements
   - User interaction patterns
   - State management approach
   - Error handling behavior

3. **${CONTRACTS_DIR}/integration-contract.yaml**
   - File naming conventions
   - Import/export patterns
   - Theme integration approach
   - Testing requirements

4. **${CONTRACTS_DIR}/constraints.yaml**
   - Performance budgets
   - Accessibility requirements
   - Browser support targets
   - Dependencies allowed/forbidden

**Analysis Approach**:
1. Read the task description from TaskMaster
2. Analyze existing codebase patterns
3. Consider all 5 specialist perspectives
4. Generate contracts that allow creativity while ensuring compatibility

**Key Principles**:
- Contracts should be specific enough to ensure compatibility
- But flexible enough to allow specialist creativity
- Focus on interfaces, not implementations
- Think about edge cases and error states

Begin by analyzing Task ${task_id} and the current codebase patterns.

After the Pre-Analysis Agent completes:
- Verify that all four contract files were generated successfully
- Log the completion with timestamp to orchestration.log
- Update state to indicate contracts are ready
- All subsequent agents will reference these contracts

**PHASE 1: SMART WORKTREE CREATION**

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

**PHASE 2: ORCHESTRATION WITH PROGRESS TRACKING**

Begin the main orchestration phase with real-time monitoring:

1. **Update State**: Mark orchestration as active in the state file
2. **Log Phase Start**: Record orchestration phase start with timestamp in orchestration.log
3. **Deploy Orchestration Agents**: Launch the multi-tier agent system

**Deploy Master Orchestrator using Task tool:**

The Master Orchestrator coordinates the entire multi-agent system for Task {task_id}:

You are the Master Orchestrator for a sophisticated multi-agent system implementing Task ${task_id}.

Your deployment configuration:
- Task ID: ${task_id}
- Specialists: ${specialists}
- Depth: ${depth} sub-agents per specialist
- Deployment Mode: worktree-all
- Worktree Prefix: ${worktree_prefix}
- Target Path: packages/web/src/components
- Analysis Output: ${ORCH_OUTPUT_DIR}/analysis/

Your responsibilities:
1. Coordinate deployment of 5 Specialist Orchestrators
2. Each specialist will deploy ${depth} sub-agents for implementation
3. Monitor implementation progress across all worktrees
4. Ensure consistent quality and integration
5. Prepare for synthesis phase
6. Write analysis and coordination docs to ${ORCH_OUTPUT_DIR}/analysis/

**CRITICAL**: Read and enforce the implementation contracts:
- ${CONTRACTS_DIR}/interface-contract.yaml - All components MUST follow this interface
- ${CONTRACTS_DIR}/behavior-contract.yaml - All implementations MUST exhibit these behaviors
- ${CONTRACTS_DIR}/integration-contract.yaml - All code MUST follow these patterns
- ${CONTRACTS_DIR}/constraints.yaml - All implementations MUST respect these limits

Ensure ALL specialist orchestrators receive and understand these contracts.

Specialist worktree assignments:
- Performance: .worktrees/${worktree_prefix}-1-performance/
- Architecture: .worktrees/${worktree_prefix}-2-architecture/
- UX/DX: .worktrees/${worktree_prefix}-3-ux_dx/
- Accessibility: .worktrees/${worktree_prefix}-4-accessibility/
- Innovation: .worktrees/${worktree_prefix}-5-innovation/
- Synthesis: .worktrees/${worktree_prefix}-6-synthesis/

Begin by analyzing Task ${task_id} requirements and preparing deployment strategy.

After Master Orchestrator deployment, log completion with timestamp.

**Deploy Specialist Orchestrators using Task tool (5 agents in parallel):**

Deploy five specialist orchestrators simultaneously, each focusing on their domain of expertise:

**SPECIALIST 1 - PERFORMANCE**:
TASK: Performance Specialist Orchestrator for Task ${task_id}

You are the Performance Specialist Orchestrator.
Your worktree: .worktrees/${worktree_prefix}-1-performance/
Your focus: Bundle size, runtime performance, memory efficiency
Analysis output: ${ORCH_OUTPUT_DIR}/analysis/performance/

Deploy ${depth} sub-agents to create implementations in:
- _implementations/bundle-optimizer/
- _implementations/runtime-optimizer/
- _implementations/memory-optimizer/

Each implementation should be complete and functional.

**MANDATORY**: All implementations MUST adhere to:
- ${CONTRACTS_DIR}/interface-contract.yaml - Use exact props/API defined here
- ${CONTRACTS_DIR}/behavior-contract.yaml - Implement all required behaviors
- ${CONTRACTS_DIR}/integration-contract.yaml - Follow naming/import patterns
- ${CONTRACTS_DIR}/constraints.yaml - Stay within performance budgets

Write a decision log to: ${ORCH_OUTPUT_DIR}/analysis/performance/decisions.md

**SPECIALIST 2 - ARCHITECTURE**:
TASK: Architecture Specialist Orchestrator for Task ${task_id}

You are the Architecture Specialist Orchestrator.
Your worktree: .worktrees/${worktree_prefix}-2-architecture/
Your focus: Code organization, maintainability, scalability
Analysis output: ${ORCH_OUTPUT_DIR}/analysis/architecture/

Deploy ${depth} sub-agents to create implementations in:
- _implementations/modular-design/
- _implementations/maintainability-focused/
- _implementations/scalability-optimized/

Each implementation should be complete and functional.

**MANDATORY**: All implementations MUST adhere to:
- ${CONTRACTS_DIR}/interface-contract.yaml - Use exact props/API defined here
- ${CONTRACTS_DIR}/behavior-contract.yaml - Implement all required behaviors
- ${CONTRACTS_DIR}/integration-contract.yaml - Follow naming/import patterns
- ${CONTRACTS_DIR}/constraints.yaml - Respect architectural patterns

Write a decision log to: ${ORCH_OUTPUT_DIR}/analysis/architecture/decisions.md

**SPECIALIST 3 - UX/DX**:
TASK: UX/DX Specialist Orchestrator for Task ${task_id}

You are the UX/DX Specialist Orchestrator.
Your worktree: .worktrees/${worktree_prefix}-3-ux_dx/
Your focus: User experience, developer experience, API design
Analysis output: ${ORCH_OUTPUT_DIR}/analysis/ux_dx/

Deploy ${depth} sub-agents to create implementations in:
- _implementations/intuitive-api/
- _implementations/enhanced-ux/
- _implementations/developer-friendly/

Each implementation should be complete and functional.

**MANDATORY**: All implementations MUST adhere to:
- ${CONTRACTS_DIR}/interface-contract.yaml - Use exact props/API defined here
- ${CONTRACTS_DIR}/behavior-contract.yaml - Implement all required behaviors
- ${CONTRACTS_DIR}/integration-contract.yaml - Follow naming/import patterns
- ${CONTRACTS_DIR}/constraints.yaml - Maintain UX/DX standards

Write a decision log to: ${ORCH_OUTPUT_DIR}/analysis/ux_dx/decisions.md

**SPECIALIST 4 - ACCESSIBILITY**:
TASK: Accessibility Specialist Orchestrator for Task ${task_id}

You are the Accessibility Specialist Orchestrator.
Your worktree: .worktrees/${worktree_prefix}-4-accessibility/
Your focus: WCAG compliance, screen reader support, keyboard navigation
Analysis output: ${ORCH_OUTPUT_DIR}/analysis/accessibility/

Deploy ${depth} sub-agents to create implementations in:
- _implementations/wcag-compliant/
- _implementations/screen-reader-optimized/
- _implementations/keyboard-first/

Each implementation should be complete and functional.

**MANDATORY**: All implementations MUST adhere to:
- ${CONTRACTS_DIR}/interface-contract.yaml - Use exact props/API defined here
- ${CONTRACTS_DIR}/behavior-contract.yaml - Implement all required behaviors
- ${CONTRACTS_DIR}/integration-contract.yaml - Follow naming/import patterns
- ${CONTRACTS_DIR}/constraints.yaml - Meet all accessibility requirements

Write a decision log to: ${ORCH_OUTPUT_DIR}/analysis/accessibility/decisions.md

**SPECIALIST 5 - INNOVATION**:
TASK: Innovation Specialist Orchestrator for Task ${task_id}

You are the Innovation Specialist Orchestrator.
Your worktree: .worktrees/${worktree_prefix}-5-innovation/
Your focus: Cutting-edge features, creative solutions, future-proofing
Analysis output: ${ORCH_OUTPUT_DIR}/analysis/innovation/

Deploy ${depth} sub-agents to create implementations in:
- _implementations/ai-enhanced/
- _implementations/experimental-features/
- _implementations/future-proof/

Each implementation should be complete and functional.

**MANDATORY**: All implementations MUST adhere to:
- ${CONTRACTS_DIR}/interface-contract.yaml - Use exact props/API defined here
- ${CONTRACTS_DIR}/behavior-contract.yaml - Implement all required behaviors
- ${CONTRACTS_DIR}/integration-contract.yaml - Follow naming/import patterns
- ${CONTRACTS_DIR}/constraints.yaml - Stay within innovation boundaries

Write a decision log to: ${ORCH_OUTPUT_DIR}/analysis/innovation/decisions.md

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

**Deploy Evaluation Orchestrator using Task tool:**

Deploy an Evaluation Orchestrator to analyze all 15 implementations across the worktrees. The evaluator should:

- Analyze all 3 implementations from each of the 5 specialist worktrees
- Use the Pre-Analysis contracts as the evaluation rubric
- Verify interface compliance, behavior correctness, integration patterns, and constraint adherence
- Create evaluation reports and score each implementation
- Update manifest.json files with metrics and rankings
- Identify any non-compliant implementations
- Write comprehensive evaluation summary to the analysis directory
- Log evaluation progress with timestamps to orchestration.log

**Deploy Progressive Summarization Agents using Task tool (5 agents in parallel):**

To prevent context window overload during the synthesis phase, deploy 5 summarization agents in parallel - one for each specialist. Log the summarization phase start with timestamp to orchestration.log.

Each summarization agent should:
- Read and analyze the 3 implementations from their specialist worktree
- Create a concise summary (maximum 500 words) in a standardized format
- Include key features, trade-offs, unique innovations, recommendations, and synthesis guidance
- Write the summary to the summaries directory in the orchestration output

**Summarization Focus by Specialist:**

- **Performance Summarizer**: Analyze bundle-optimizer, runtime-optimizer, and memory-optimizer implementations
- **Architecture Summarizer**: Review modular-design, maintainability-focused, and scalability-optimized implementations  
- **UX/DX Summarizer**: Examine intuitive-api, enhanced-ux, and developer-friendly implementations
- **Accessibility Summarizer**: Assess wcag-compliant, screen-reader-optimized, and keyboard-first implementations
- **Innovation Summarizer**: Evaluate ai-enhanced, experimental-features, and future-proof implementations

Each summary should follow a consistent structure documenting the focus, key features, trade-offs, best use cases, and synthesis recommendations for each implementation. This allows the Synthesis Orchestrator to make informed decisions without reading all 15 full implementations.
Log all summarization agent deployments and completions with timestamps to orchestration.log.

**Deploy Synthesis Orchestrator using Task tool:**

Log the synthesis phase start with timestamp to orchestration.log, then deploy the Synthesis Orchestrator.

The Synthesis Orchestrator works in the dedicated synthesis worktree and creates the ultimate implementation by:

**Reading Summaries Instead of Full Implementations:**
- Read all 5 specialist summaries (500 words each) to prevent context overload
- Review the evaluation report to understand implementation quality
- Access decision logs to understand specialist trade-offs

**Creating the Ultimate Synthesis:**
- Cherry-pick the best features identified in each summary
- Follow synthesis recommendations from specialists
- Ensure all 5 perspectives are represented in the final solution
- Selectively read specific implementations mentioned in summaries when needed

**Maintaining Contract Compliance:**
- Strictly adhere to all 4 contracts from Pre-Analysis phase
- Ensure the synthesis meets ALL constraints simultaneously
- Document synthesis decisions and rationale

The Synthesis Orchestrator represents the culmination of the multi-agent process, combining the best aspects of all 15 implementations into one cohesive solution.

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

**PHASE 3: AUTO-START DEV SERVERS**

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

**PHASE 4: CREATE COMPARISON DASHBOARD**

Generate an HTML comparison dashboard in the orchestration output directory that allows side-by-side comparison of all implementations. The dashboard should:

- Display all 6 implementations in a responsive grid layout
- Use iframes to show each implementation running on its respective port
- Include auto-refresh functionality for when servers are starting up
- Provide a clean, professional interface for evaluating different approaches
- Save the dashboard as comparison-dashboard.html in the orchestration output directory

**PHASE 5: FINAL SUMMARY**

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