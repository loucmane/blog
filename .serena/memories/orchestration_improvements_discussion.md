# Orchestration Improvements Discussion - Task 7 Preparation

## Overview
Extensive discussion with another Claude instance (via Claude Code Bridge) about improving the orchestrate-and-test.md command for TaskMaster Infinite system.

## Key Improvements Identified

### 1. Pre-Analysis Phase (PHASE 0.5)
Add before worktree creation to generate contracts and evaluation criteria:

```bash
# After PHASE 0: PRE-FLIGHT CHECKS
# Before PHASE 1: SMART WORKTREE CREATION

**PHASE 0.5: PRE-ANALYSIS AND CONTRACT GENERATION**

CURRENT_PHASE="pre-analysis"
echo "📋 Running Pre-Analysis for Task ${task_id}..."

# Create contract directories
mkdir -p "${ORCH_OUTPUT_DIR}/contracts"
mkdir -p "${ORCH_OUTPUT_DIR}/contracts/interfaces"
mkdir -p "${ORCH_OUTPUT_DIR}/contracts/evaluation"
mkdir -p "${ORCH_OUTPUT_DIR}/analysis/pre-analysis"
```

Pre-Analysis Agent creates:
- `component-contracts.yaml` - Interface definitions all implementations must follow
- `evaluation-criteria.yaml` - Scoring rubrics for judging implementations
- `dependency-graph.yaml` - How components relate
- `specialist-focus.yaml` - What each specialist should emphasize
- `README.md` - Contract documentation

### 2. Decision Log Structure
Lightweight markdown format for each agent:

```markdown
### Decision: Use Code Splitting
- **ID**: bundle-opt-001
- **Rationale**: Lighthouse shows 89/100, main bundle 450KB
- **Impact**: -150KB initial load
- **Risk**: Low - widely supported
```

### 3. Enhanced Agent Prompts
Add to each specialist prompt:
- 5-10 line contract summary
- Decision log template
- Reference to contracts: `${ORCH_OUTPUT_DIR}/contracts/`
- Clear output requirements

Example specialist prompt structure:
```
You are a [Specialist Type] implementing Task ${task_id}.

CONTRACT SUMMARY:
- Goal: [Primary objective]
- Metrics: [What to optimize]
- Constraints: [Must maintain/support]
- Output: [Where to write implementation]

DECISION LOG (Create as [name]-decisions.md):
| Decision | Rationale | Metrics | Risk |
|----------|-----------|---------|------|
| [What]   | [Why]     | [Data]  | L/M/H |

TASK: [Specific implementation requirements]
```

### 4. Progressive Summarization Strategy
To avoid cognitive overload on Synthesis agent:
- Each specialist creates 1-paragraph summary
- Evaluation agent creates rankings
- Synthesis works with summaries first
- Can drill down to full implementations

### 5. File Organization
```
${ORCH_OUTPUT_DIR}/
├── contracts/           # From pre-analysis
├── decisions/          # Decision logs from each agent
├── analysis/           # Analysis outputs
├── synthesis/          # Final combined implementation
└── state/             # Orchestration state
```

## Implementation Status

### ✅ Already Implemented (from Zen/Gemini feedback):
1. Security validation for task_id
2. Error handling with trap and phase tracking
3. Proper variable quoting
4. Output directory moved to `docs/ai/for-agentic-loops/orchestration-outputs/`
5. Analysis output paths added to all specialists

### 🔄 To Be Implemented:
1. Pre-Analysis Phase (PHASE 0.5)
2. Contract references in all agent prompts
3. Decision log requirements for agents
4. Progressive summarization approach
5. Optional skip_pre_analysis parameter

## Critical Insights

### From Zen/Gemini Analysis:
- Fire-and-forget model is limiting but workable
- State management with sed is brittle (consider yq/jq)
- Resource consumption will be high (6 worktrees + 6 servers)
- Sequential execution (not parallel) means ~10-15 min runtime

### From Claude Bridge Discussion:
- Contracts ensure interchangeable implementations
- Decision logs capture the "why" for synthesis
- Pre-analysis creates shared understanding upfront
- Progressive summarization prevents context overload

## Task 7 Specific Contracts
For "Build Core Layout Components":

### Component Interfaces:
- Header (logo, navigation, mobile menu)
- Footer (links, social, trust indicators)
- MainLayout (wrapper with semantic HTML)
- Sidebar (responsive navigation)

### Key Requirements:
- Four-theme system support
- < 100KB JS bundle impact
- 98+ Lighthouse score
- WCAG 2.1 AA compliance
- Mobile-first responsive

## Next Steps
1. Implement Pre-Analysis phase in orchestrate-and-test.md
2. Update all agent prompts with contracts and decision logs
3. Test with `depth=1` first (7 agents instead of 17)
4. Monitor resource usage and timing

## Testing Recommendation
```bash
/orchestrate-and-test task_id=7 depth=1
```

This reduces complexity while validating the full flow.