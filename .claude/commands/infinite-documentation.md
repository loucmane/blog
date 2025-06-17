**INFINITE DOCUMENTATION IMPROVEMENT LOOP**

Think deeply about this documentation evolution task. You are about to orchestrate a sophisticated iterative improvement process for documentation quality.

**Variables:**

mode: $ARGUMENTS
spec_file: $ARGUMENTS
output_dir: $ARGUMENTS
count: $ARGUMENTS
scope: $ARGUMENTS
dry_run: $ARGUMENTS

**ARGUMENTS PARSING:**
Parse the following arguments from "$ARGUMENTS":
1. `mode` - Execution mode: 'all', 'bridge', 'convention', 'network', 'tasks', 'orchestrated', or 'single' (default: 'single')
2. `spec_file` - Path to the documentation specification file (required only if mode='single')
3. `output_dir` - Directory where documentation file sets will be saved
4. `count` - Number of iterations (1-N or "infinite")
5. `scope` - (Optional) Limit analysis to specific path(s), e.g., "packages/web/components" or "docs/guides"
6. `dry_run` - (Optional) If true, preview changes without writing files (default: false)

**PHASE 1: MODE DETECTION**
Determine execution mode and set up specifications:

If mode is "all":
  - Execute all four documentation improvement types concurrently
  - Use predefined spec paths:
    - Bridge: `/home/loucmane/dev/javascript/MomsBlog/blog/docs/ai/for-agentic-loops/specs/documentation/bridge_standards_to_implementation.md`
    - Convention: `/home/loucmane/dev/javascript/MomsBlog/blog/docs/ai/for-agentic-loops/specs/documentation/discover_missing_conventions.md`
    - Network: `/home/loucmane/dev/javascript/MomsBlog/blog/docs/ai/for-agentic-loops/specs/documentation/build_reference_network.md`
    - Tasks: `/home/loucmane/dev/javascript/MomsBlog/blog/docs/ai/for-agentic-loops/specs/documentation/create_task_based_guides.md`
  - Create subdirectories under output_dir:
    - `{output_dir}/bridges/performance/`
    - `{output_dir}/conventions/discovered/`
    - `{output_dir}/network/maps/`
    - `{output_dir}/guides/tasks/`
  - Prepare for quadruple parallel execution

If mode is "bridge":
  - Use bridge spec: `/home/loucmane/dev/javascript/MomsBlog/blog/docs/ai/for-agentic-loops/specs/documentation/bridge_standards_to_implementation.md`
  - Output to: `{output_dir}/bridges/`

If mode is "convention":
  - Use convention spec: `/home/loucmane/dev/javascript/MomsBlog/blog/docs/ai/for-agentic-loops/specs/documentation/discover_missing_conventions.md`
  - Output to: `{output_dir}/conventions/`

If mode is "network":
  - Use network spec: `/home/loucmane/dev/javascript/MomsBlog/blog/docs/ai/for-agentic-loops/specs/documentation/build_reference_network.md`
  - Output to: `{output_dir}/network/`

If mode is "tasks":
  - Use tasks spec: `/home/loucmane/dev/javascript/MomsBlog/blog/docs/ai/for-agentic-loops/specs/documentation/create_task_based_guides.md`
  - Output to: `{output_dir}/guides/`

If mode is "orchestrated":
  - Use orchestrator spec: `/home/loucmane/dev/javascript/MomsBlog/blog/docs/ai/for-agentic-loops/specs/documentation/meta_agent_orchestrator.md`
  - First: Run comprehensive analysis
  - Then: Create strategic execution plan
  - Then: Execute other specs in optimal order with context sharing
  - Output to: `{output_dir}/orchestration/` plus spec-specific directories

If mode is "single" (default):
  - Use provided spec_file (required)
  - Output to: `{output_dir}/`

**PHASE 2: SPECIFICATION ANALYSIS**
Read and deeply understand the specification file(s) based on mode. Documentation specs define:
- What type of documentation improvement to generate
- The file set structure (multiple interconnected files)
- Evolution stages and progression patterns
- Success metrics and quality indicators
- Blog-specific focus areas

Understand whether this is:
- Bridge Standards to Implementation (connecting standards to code)
- Convention Discovery (finding undocumented patterns)
- Documentation Network (building connections between docs)

**PHASE 2.5: SCOPE AND DRY-RUN CONFIGURATION**
Apply optional parameters:

**If `scope` is provided:**
- Limit all analysis to the specified path(s)
- Examples:
  - `scope=packages/web` - Only analyze web package
  - `scope=docs/guides,docs/standards` - Multiple paths
  - `scope=components/Blog*` - Glob pattern support
- Benefits:
  - Faster execution on large codebases
  - Focused improvements on problem areas
  - Reduced context consumption
  - Targeted documentation evolution

**If `dry_run=true`:**
- Execute full analysis and planning
- Generate complete file contents in memory
- Display summary of changes:
  ```
  DRY RUN SUMMARY:
  ================
  Mode: bridge
  Scope: packages/web/components
  Iterations: 3
  
  Files to be created:
  - /docs/bridges/performance/v1/bridge.md (2.3KB)
  - /docs/bridges/performance/v1/examples/BlogImage.tsx (1.2KB)
  - /docs/bridges/performance/v1/tests/performance.test.ts (890B)
  [... list all files ...]
  
  Key improvements:
  - Bridge performance standards to 12 components
  - Add 8 working examples with tests
  - Document 5 common anti-patterns
  
  Total files: 23
  Total size: ~45KB
  Estimated impact: 40% reduction in performance violations
  ```
- Do NOT write any files to disk
- Allow user to review before committing

**PHASE 3: DOCUMENTATION STATE ANALYSIS**
Analyze the current documentation landscape:
- Scan existing documentation structure (filtered by scope if provided)
- Identify gaps and improvement opportunities
- Review previous iterations in `output_dir`
- Understand codebase changes since last iteration
- Analyze developer feedback and usage metrics

For Documentation Networks specifically:
- Map all existing documentation files (within scope)
- Identify orphaned documents
- Analyze current connection patterns
- Review navigation success rates

**PHASE 3: ITERATION STRATEGY**
Based on spec type and current state:
- Determine starting iteration number (v1, v2, etc.)
- Plan file set contents for each iteration
- Consider evolution stage progression
- Define success criteria for this iteration
- Plan measurement and feedback collection

**PHASE 4: PARALLEL AGENT ORCHESTRATION**
Deploy specialized Sub Agents for different aspects of documentation improvement:

**For mode="orchestrated" - Strategic Sequential Execution:**
Deploy orchestrator first using Task tool, then execute specs based on strategic plan:
- **Phase 0**: Launch 5 orchestrator agents in parallel using Task tool
  - Each orchestrator agent analyzes different aspects simultaneously
  - Agents work independently then share findings
- **Phase 1-N**: Execute documentation specs using Task tool based on plan
  - Deploy spec agents in waves as determined by orchestrator
  - Context shared between phases
  - Adaptive execution based on discoveries
Total: Variable agents based on orchestrator decisions

**For mode="all" - Quadruple Parallel Execution:**
Deploy four complete agent teams simultaneously using Task tool:
- **Team Bridge**: 5 agents for bridge standards evolution (launched via Task tool)
- **Team Convention**: 5 agents for convention discovery (launched via Task tool)
- **Team Network**: 5 agents for documentation network (launched via Task tool)
- **Team Tasks**: 5 agents for task-based guides (launched via Task tool)
Total: 20 parallel agents working on different documentation aspects via Task tool

Each team operates independently in their designated output directory:
- Team Bridge → `{output_dir}/bridges/performance/v[N]/`
- Team Convention → `{output_dir}/conventions/discovered/v[N]/`
- Team Network → `{output_dir}/network/maps/v[N]/`
- Team Tasks → `{output_dir}/guides/tasks/v[N]/`

**Sub-Agent Specialization by Spec Type:**

For **Bridge Standards**:
- Agent 1: Code Example Generator - Creates working implementations
- Agent 2: Test Suite Builder - Develops validation tests
- Agent 3: Metrics Analyzer - Measures performance impacts
- Agent 4: Migration Guide Writer - Documents upgrade paths
- Agent 5: Feedback Integrator - Analyzes developer usage

For **Convention Discovery**:
- Agent 1: Pattern Scanner - Analyzes codebase for patterns
- Agent 2: Convention Documenter - Writes clear conventions
- Agent 3: Example Extractor - Creates before/after code
- Agent 4: Validation Builder - Generates lint rules
- Agent 5: Conflict Resolver - Handles competing patterns

For **Documentation Network**:
- Agent 1: Network Mapper - Visualizes connections
- Agent 2: Path Optimizer - Finds efficient journeys
- Agent 3: Orphan Detector - Identifies isolated docs
- Agent 4: Test Creator - Validates navigation paths
- Agent 5: Analytics Processor - Tracks usage patterns

For **Task-Based Guides**:
- Agent 1: Workflow Analyzer - Identifies common developer tasks
- Agent 2: Guide Writer - Creates step-by-step instructions
- Agent 3: TaskMaster Integrator - Links guides to TM templates
- Agent 4: Success Analyzer - Tracks completion patterns
- Agent 5: Interactive Builder - Creates dynamic components

For **Orchestrator** (Strategic Mode):
- Agent 1: Health Analyzer - Assesses documentation state
- Agent 2: Strategy Planner - Creates optimal execution plan
- Agent 3: Context Coordinator - Manages inter-spec communication
- Agent 4: Progress Monitor - Tracks and adapts execution
- Agent 5: Learning Extractor - Captures insights for improvement

**Agent Coordination Protocol:**
```
TASK: Generate [ASPECT] for documentation iteration v[NUMBER]

You are Sub Agent [ROLE] working on [SPEC_TYPE] iteration v[NUMBER].

CONTEXT:
- Specification: [Full spec analysis]
- Current documentation state: [Gap analysis]
- Your focus area: [Specific file types to generate]
- Quality standards: [Success metrics]
- Previous iterations: [Evolution context]
- Scope limitation: [If provided, only analyze within scope paths]
- Dry run mode: [If true, generate but don't write files]

DELIVERABLES:
Generate your assigned files in the file set:
- Follow exact directory structure from spec
- Ensure cross-references to other files
- Include evolution markers
- Add measurement hooks
- Consider blog-specific needs
- Respect scope boundaries if set
- Prepare for dry-run summary if enabled

COORDINATION:
- Your files will be combined with other agents' work
- Maintain consistent version numbering
- Use shared conventions and patterns
- Reference other files in the set appropriately
- Report file sizes and impact metrics for dry-run
```

**Parallel Execution Management:**
- Launch all assigned Sub Agents simultaneously using Task tool
- Monitor agent progress and completion in real-time
- Each agent works independently on their assigned documentation aspect
- Handle any agent failures by reassigning tasks
- Collect and validate all generated documentation files
- Ensure consistent version numbering across all outputs

**PHASE 4.5: DRY-RUN REPORTING**
If dry_run=true, generate comprehensive preview:

```
========================================
DOCUMENTATION EVOLUTION DRY-RUN PREVIEW
========================================

Configuration:
- Mode: convention
- Scope: packages/web/components
- Iterations: 3
- Output Directory: /docs/evolution/conventions/discovered/

Iteration 1 Analysis:
--------------------
Patterns Found: 23
Conventions Identified: 12
Conflicts Detected: 3

Files to Generate:
1. /docs/evolution/conventions/discovered/v1/report.md (3.2KB)
   - Executive summary of discoveries
   - 12 new conventions documented
   - 89% confidence average
   
2. /docs/evolution/conventions/discovered/v1/conventions/naming-conventions.md (2.1KB)
   - Component naming: [Domain][Type][Variant]
   - Hook naming: use[Feature][Action]
   - File structure: co-location pattern

[... detailed file listing ...]

Key Findings:
- Component co-location pattern used in 89% of components
- Inconsistent error handling in 31% of async functions
- Missing TypeScript types in 22% of exports

Estimated Impact:
- 50% reduction in naming conflicts
- 30% faster code reviews
- 40% improvement in discoverability

Would create 23 files totaling ~45KB
No files will be written in dry-run mode
========================================
```

**PHASE 5: FILE SET GENERATION**
Each iteration produces a complete file set:

**Bridge Standards File Set:**
```
/docs/bridges/[standard_name]/v[N]/
├── bridge.md                    # Main document (Agent 1)
├── examples/*.tsx               # Code examples (Agent 2)
├── tests/*.test.ts             # Validation tests (Agent 3)
├── metrics/*.json              # Performance data (Agent 4)
└── guides/*.md                 # Migration guides (Agent 5)
```

**Convention Discovery File Set:**
```
/docs/conventions/v[N]/
├── report.md                    # Discovery report (Coordinator)
├── conventions/*.md            # Pattern docs (Agent 2)
├── analysis/*.json             # Pattern data (Agent 1)
├── examples/*                  # Code samples (Agent 3)
├── validation/*                # Lint rules (Agent 4)
└── conflicts/*.md              # Resolutions (Agent 5)
```

**Documentation Network File Set:**
```
/docs/network/v[N]/
├── network-map.md              # Overview (Agent 1)
├── visualizations/*.svg        # Network graphs (Agent 1)
├── analysis/*.json             # Health metrics (Agent 5)
├── paths/*.md                  # Optimized journeys (Agent 2)
├── updates/*.md                # Change tracking (Coordinator)
└── tests/*.ts                  # Navigation tests (Agent 4)
```

**Task-Based Guides File Set:**
```
/docs/guides/tasks/v[N]/
├── guide-index.md              # Master listing (Coordinator)
├── tasks/*.md                  # Individual guides (Agent 2)
├── workflows/*.md              # Multi-task flows (Agent 1)
├── taskmaster/                 # TM integration (Agent 3)
│   ├── task-templates.json     # Reusable templates
│   ├── subtask-patterns.json   # Common breakdowns
│   └── time-estimates.json     # Historical data
├── analytics/*.json            # Usage metrics (Agent 4)
└── interactive/*.tsx           # Dynamic components (Agent 5)
```

**PHASE 6: QUALITY EVOLUTION**
Track improvement across iterations:

**Evolution Metrics:**
- Developer velocity impact
- Documentation findability score
- Convention adoption rate
- Network health improvement
- Bug reduction correlation

**Feedback Integration:**
- Collect usage analytics
- Process developer feedback
- Identify pain points
- Measure success rates
- Plan next iteration improvements

**PHASE 7: INFINITE MODE OPTIMIZATION**
For continuous improvement:

**Wave-Based Evolution:**
```
WHILE context_capacity > threshold:
    1. Analyze current documentation impact
    2. Identify highest-value improvements
    3. Plan next evolution stage
    4. Deploy specialized agent team
    5. Generate enhanced file set
    6. Measure improvement delta
    7. Collect feedback signals
    8. If significant improvement: Continue
    9. If approaching limits: Summarize impact
```

**Progressive Enhancement Strategy:**
- **Iterations 1-3**: Foundation building
- **Iterations 4-6**: Intelligence integration  
- **Iterations 7-9**: Predictive capabilities
- **Iterations 10+**: Self-maintaining systems

**EXECUTION PRINCIPLES:**

**Documentation Quality First:**
- Every iteration must measurably improve developer experience
- Focus on practical, actionable documentation
- Maintain consistency with existing docs
- Ensure blog-specific needs are met

**File Set Coherence:**
- All files in a set must work together
- Cross-references must be valid
- Version numbers must be consistent
- Evolution must be traceable

**Measurement & Validation:**
- Include metrics in every file set
- Add tests for critical paths
- Track adoption and usage
- Validate improvement claims

**Blog-Specific Focus:**
- 98+ Lighthouse score examples
- Content management patterns
- Performance optimization guides
- Accessibility implementations

**ULTRA-THINKING DIRECTIVE:**
Before beginning generation, think deeply about:

**Documentation Impact:**
- How will this iteration help developers build better?
- What specific problems will it solve?
- How does it connect to website quality?
- What makes this iteration valuable?

**File Set Design:**
- How do the files work together?
- What's the optimal granularity?
- How to ensure discoverability?
- What evolution path to follow?

**Agent Specialization:**
- Which agent skills are needed?
- How to divide work effectively?
- What coordination is required?
- How to maintain coherence?

**Success Measurement:**
- What metrics prove improvement?
- How to track developer success?
- What feedback to collect?
- How to validate impact?

Begin execution with deep consideration of documentation quality impact, then deploy Sub Agents using the Task tool to work in parallel. Each Sub Agent should independently generate their assigned documentation files according to their specialization. Monitor all agents' progress and ensure comprehensive file sets are created that measurably improve the developer experience.

**USAGE EXAMPLES:**

**Run all documentation improvements concurrently:**
```
/infinite-documentation mode=all output_dir=/home/loucmane/dev/javascript/MomsBlog/blog/docs/evolution count=3
```

**Run specific documentation type:**
```
/infinite-documentation mode=bridge output_dir=/home/loucmane/dev/javascript/MomsBlog/blog/docs/evolution count=5
/infinite-documentation mode=convention output_dir=/home/loucmane/dev/javascript/MomsBlog/blog/docs/evolution count=5
/infinite-documentation mode=network output_dir=/home/loucmane/dev/javascript/MomsBlog/blog/docs/evolution count=5
/infinite-documentation mode=tasks output_dir=/home/loucmane/dev/javascript/MomsBlog/blog/docs/evolution count=5
```

**Run with scope limitation:**
```
/infinite-documentation mode=all output_dir=/docs/evolution count=3 scope=packages/web
/infinite-documentation mode=convention output_dir=/docs/evolution count=3 scope=components/Blog*
/infinite-documentation mode=bridge output_dir=/docs/evolution count=3 scope=docs/standards,docs/guides
```

**Run in dry-run mode to preview:**
```
/infinite-documentation mode=all output_dir=/docs/evolution count=1 dry_run=true
/infinite-documentation mode=network output_dir=/docs/evolution count=3 scope=docs dry_run=true
```

**Run with custom spec (backward compatible):**
```
/infinite-documentation mode=single spec_file=/path/to/custom-spec.md output_dir=/docs/custom count=3
```

**Infinite evolution mode:**
```
/infinite-documentation mode=all output_dir=/home/loucmane/dev/javascript/MomsBlog/blog/docs/evolution count=infinite
```

**Complex example with all parameters:**
```
/infinite-documentation mode=convention output_dir=/docs/evolution count=5 scope=packages/web/components dry_run=true
```
This will:
- Run convention discovery only
- Analyze only the web components
- Generate 5 iterations
- Preview changes without writing files

**Orchestrated mode for intelligent execution:**
```
/infinite-documentation mode=orchestrated output_dir=/docs/evolution count=1
```
This will:
- Analyze entire documentation state
- Create strategic execution plan
- Run specs in optimal order
- Share context between phases
- Generate comprehensive impact report