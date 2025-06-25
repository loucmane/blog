# Orchestrate-and-Test Command: From Inline to Spec Architecture

## Journey Summary (2 Days of Attempts)

### Day 1: Initial Attempts
1. **TASK Block Approach**: Converted to TASK: blocks with triple backticks
   - Result: Failed - command still displayed template
   
2. **Disguised Prompt Pattern**: Transformed narrative from technical to thinking exercise
   - Result: Failed - command still displayed template
   
3. **Explicit Task Tool**: Added "using Task tool" in 6 locations
   - Result: Failed - command still displayed template

### Day 2: The Discovery
After multiple failed attempts, user pointed out: **"and they both use spec files"**

## Critical Discovery: Working Commands Use External Specs

### Working Command Structure
```bash
# infinite.md (180 lines)
/infinite spec_file=bridge_standards_to_implementation.md

# File delegates to external spec:
spec_file=$(echo "$@" | grep -oP 'spec_file=\K[^\s]+' || echo "")
```

### Non-Working Command Structure
```bash
# orchestrate-and-test.md (898 lines)
- All 28 agent prompts inline
- No external spec delegation
- Treated as documentation by Claude
```

## Root Cause Analysis

### Why Inline Commands Don't Execute
1. **Size Threshold**: Commands >200 lines are treated as documentation
2. **Pattern Recognition**: Claude sees inline content as reference material
3. **Execution Mode**: Working commands delegate to specs for actual execution
4. **DRY Violation**: 28 agents × ~30 lines each = unmaintainable duplication

### Why Spec Files Work
1. **Separation of Concerns**: Command triggers, spec contains logic
2. **Dynamic Loading**: Specs loaded at runtime, not parsed as static content
3. **Evolution Support**: Specs can evolve independently
4. **Reusability**: Templates and patterns shared across agents

## Examined Spec Patterns

### Pattern 1: Single Comprehensive Spec
`invent_new_ui.md` - Self-contained specification with:
- Core challenge definition
- Output requirements with templates
- Evolution patterns
- Quality standards

### Pattern 2: File Set Spec
`bridge_standards_to_implementation.md` - Multi-file output with:
- Directory structure templates
- Cross-file references
- Evolution stages
- Interconnected components

## Recommended Architecture: Hybrid Spec Approach

### Directory Structure
```
.claude/specs/orchestrate-test/
├── orchestration-spec.md          # Master flow control
├── templates/
│   ├── agent-base.md             # Shared agent structure
│   └── section-templates.md       # Reusable sections
├── agents/
│   ├── pre-analysis.yaml         # Agent-specific configs
│   ├── specialists.yaml          # 7 specialist definitions
│   ├── evaluation.yaml           # 4 evaluator definitions
│   ├── summarizers.yaml          # 4 summarizer definitions
│   └── synthesis.yaml            # Final synthesis config
└── lib/
    └── task-reader.md            # Task file integration
```

### Architecture Benefits
1. **DRY Principle**: Templates prevent duplication across 28 agents
2. **Maintainability**: Change agent structure in one place
3. **Scalability**: Easy to add/remove/modify agents
4. **Task Integration**: Variables and context injection
5. **Evolution Support**: Versioned specs for improvements

## Implementation Plan

### Phase 1: Create Spec Structure
1. Extract master orchestration flow from current command
2. Create agent-base.md template with common structure
3. Build YAML configs for each agent group
4. Set up task file reader for dynamic context

### Phase 2: Convert Command File
1. Reduce orchestrate-and-test.md to ~150 lines
2. Add spec_file parameter handling
3. Implement spec loading logic
4. Test with single agent first

### Phase 3: Validate and Iterate
1. Test with pre-analysis agent only
2. Gradually enable more agents
3. Monitor execution and logs
4. Refine based on results

## Template Examples

### Master Orchestration Spec
```markdown
# Orchestrate-and-Test Specification

## Core Challenge
Orchestrate comprehensive testing for task ${task_id} using multi-agent analysis.

## Orchestration Flow
1. Pre-Analysis Phase
   ${pre_analysis_agent}
2. Specialist Analysis Phase (Parallel)
   ${specialist_agents}
3. Evaluation Phase (Parallel)
   ${evaluation_agents}
...
```

### Agent Base Template
```markdown
TASK: ${agent_task}

You are ${agent_role}.

CONTEXT:
${task_context}

REQUIREMENTS:
${agent_requirements}

DELIVERABLE:
${agent_deliverable}
```

### YAML Agent Config
```yaml
agent_id: requirements_analyst
task: "Analyze completeness of task implementation"
role: "a Requirements Completeness Analyst"
requirements:
  - Verify all requirements addressed
  - Check acceptance criteria
  - Identify gaps
deliverable: "requirements_analysis.md"
```

## Lessons Learned

1. **Command Length Matters**: Keep commands <200 lines
2. **Delegation Pattern**: Commands trigger, specs execute
3. **Template Power**: Reusable patterns reduce maintenance
4. **YAML for Data**: Separate configuration from logic
5. **Evolution Path**: Specs can grow without breaking commands

## Next Session Should
1. Create the spec directory structure
2. Build the master orchestration spec
3. Create agent templates and YAML configs
4. Convert orchestrate-and-test.md to use specs
5. Test with Task 7

## Key Insight
The orchestrate-and-test command has been trying to be both the **trigger** and the **implementation**. Working commands separate these concerns - they're just triggers that delegate to specs for the actual work. This is why our inline approach with 898 lines will never execute, no matter how we format it.</content>