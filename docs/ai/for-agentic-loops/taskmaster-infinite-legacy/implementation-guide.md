# TaskMaster Infinite System - Implementation Guide

This guide walks through the practical implementation of the TaskMaster Infinite System, from setup to execution.

## Phase 1: System Setup (One-Time)

### 1.1 Create Directory Structure

```bash
# In your project root
mkdir -p .taskmaster/infinite/{specs,outputs,decisions,contracts}
mkdir -p .taskmaster/infinite/templates
```

### 1.2 Install Templates

Copy the templates we created to your project:
- `interface-contract-template.yaml`
- `decision-record-template.md`
- `task-spec-template.md`
- `rationale-template.md`

### 1.3 Create Helper Scripts

Create `.taskmaster/infinite/run-infinite.sh`:

```bash
#!/bin/bash
# Helper script to run infinite command with proper setup

SPEC_FILE=$1
OUTPUT_DIR=$2
COUNT=$3
INNOVATION_LEVEL=${4:-standard}

# Validate inputs
if [ -z "$SPEC_FILE" ] || [ -z "$OUTPUT_DIR" ] || [ -z "$COUNT" ]; then
    echo "Usage: ./run-infinite.sh <spec-file> <output-dir> <count> [innovation-level]"
    exit 1
fi

# Create output directory
mkdir -p "$OUTPUT_DIR"

# Run infinite command
echo "Running TaskMaster Infinite System..."
echo "Spec: $SPEC_FILE"
echo "Output: $OUTPUT_DIR"
echo "Iterations: $COUNT"
echo "Innovation Level: $INNOVATION_LEVEL"

# Execute (adjust path to your infinite command)
infinite "$SPEC_FILE" "$OUTPUT_DIR" "$COUNT" --innovation="$INNOVATION_LEVEL"
```

### 1.4 Create Scoring Script

Create `.taskmaster/infinite/score-implementations.js`:

```javascript
// Automated scoring system for implementations
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

class ImplementationScorer {
  constructor(contractPath, outputDir) {
    this.contract = yaml.load(fs.readFileSync(contractPath, 'utf8'));
    this.outputDir = outputDir;
    this.scores = [];
  }

  async scoreAll() {
    const implementations = fs.readdirSync(this.outputDir)
      .filter(f => f.startsWith('agent-'));
    
    for (const impl of implementations) {
      const score = await this.scoreImplementation(impl);
      this.scores.push({ implementation: impl, ...score });
    }
    
    return this.scores.sort((a, b) => b.total - a.total);
  }

  async scoreImplementation(implDir) {
    const implPath = path.join(this.outputDir, implDir);
    
    // Run various scoring checks
    const scores = {
      performance: await this.scorePerformance(implPath),
      accessibility: await this.scoreAccessibility(implPath),
      codeQuality: await this.scoreCodeQuality(implPath),
      compliance: await this.scoreCompliance(implPath),
      innovation: await this.scoreInnovation(implPath)
    };
    
    // Calculate weighted total
    scores.total = (
      scores.performance * 0.25 +
      scores.accessibility * 0.25 +
      scores.codeQuality * 0.20 +
      scores.compliance * 0.20 +
      scores.innovation * 0.10
    );
    
    return scores;
  }

  // Implement specific scoring methods...
  async scorePerformance(implPath) {
    // Run lighthouse, check bundle size, etc.
    // Return score 0-100
  }

  async scoreAccessibility(implPath) {
    // Run axe-core, check ARIA, etc.
    // Return score 0-100
  }

  // ... other scoring methods
}

// Usage
const scorer = new ImplementationScorer(
  process.argv[2], // contract path
  process.argv[3]  // output directory
);

scorer.scoreAll().then(scores => {
  console.log(JSON.stringify(scores, null, 2));
  fs.writeFileSync(
    path.join(process.argv[3], 'scores.json'),
    JSON.stringify(scores, null, 2)
  );
});
```

## Phase 2: Task Preparation

### 2.1 Triage Decision

Use the decision tree to determine if this task is suitable:

```typescript
function shouldUseInfiniteSystem(task: Task): boolean {
  // Is the problem well-defined?
  if (!task.hasCleanInterface || !task.hasSuccessCriteria) {
    return false; // Needs human R&D first
  }
  
  // Would benefit from multiple approaches?
  if (!task.hasMultipleValidApproaches) {
    if (task.isSimpleRepetitive) {
      return false; // Use single agent
    }
    return false; // Traditional development
  }
  
  // Is it high-risk or critical?
  if (task.isBusinessCritical || task.involvesLegacyCode) {
    return false; // Human-led with AI assist
  }
  
  return true; // Good fit for Infinite System!
}
```

### 2.2 Create Task Specification

Using the template, create a spec file:

```bash
# Copy template
cp .taskmaster/infinite/templates/task-spec-template.md \
   .taskmaster/infinite/specs/task-07-layout-components.md

# Edit with your task details
$EDITOR .taskmaster/infinite/specs/task-07-layout-components.md
```

Key sections to fill:
1. Task context from TaskMaster
2. Select 3-5 implementation dimensions
3. Add TWES required docs
4. Write user-centric innovation directives

### 2.3 Create Interface Contract

```bash
# Copy template
cp .taskmaster/infinite/templates/interface-contract-template.yaml \
   .taskmaster/infinite/contracts/task-07-contract.yaml

# Define the exact interface
$EDITOR .taskmaster/infinite/contracts/task-07-contract.yaml
```

Focus on:
- Exact prop types and names
- Behavioral requirements (test cases)
- Visual constraints (theme compliance)
- Accessibility requirements

## Phase 3: Generation Execution

### 3.1 Run the Infinite Command

```bash
# Execute with our helper script
./.taskmaster/infinite/run-infinite.sh \
  .taskmaster/infinite/specs/task-07-layout-components.md \
  .taskmaster/infinite/outputs/task-07 \
  5 \
  standard
```

### 3.2 Monitor Progress

The infinite command will:
1. Analyze the spec
2. Deploy 5 parallel Sub Agents
3. Each agent creates their implementation + rationale.md
4. Save outputs to the specified directory

Expected output structure:
```
.taskmaster/infinite/outputs/task-07/
├── agent-01-pragmatist/
│   ├── src/
│   ├── tests/
│   ├── package.json
│   └── rationale.md
├── agent-02-api-designer/
│   ├── src/
│   ├── tests/
│   ├── package.json
│   └── rationale.md
└── ... (3 more agents)
```

## Phase 4: Automated Scoring

### 4.1 Run Scoring Script

```bash
node .taskmaster/infinite/score-implementations.js \
  .taskmaster/infinite/contracts/task-07-contract.yaml \
  .taskmaster/infinite/outputs/task-07
```

This generates `scores.json`:
```json
[
  {
    "implementation": "agent-03-a11y",
    "performance": 85,
    "accessibility": 100,
    "codeQuality": 90,
    "compliance": 100,
    "innovation": 40,
    "total": 88.0
  },
  // ... other implementations
]
```

### 4.2 Filter Top Candidates

```bash
# Create filtered view with top 3
jq '[.[] | select(.total > 80)] | .[0:3]' \
  .taskmaster/infinite/outputs/task-07/scores.json > \
  .taskmaster/infinite/outputs/task-07/top-candidates.json
```

## Phase 5: Human Review & Decision

### 5.1 Review Top Implementations

```bash
# Open top 3 implementations for review
code .taskmaster/infinite/outputs/task-07/agent-03-a11y
code .taskmaster/infinite/outputs/task-07/agent-02-api-designer
code .taskmaster/infinite/outputs/task-07/agent-01-pragmatist
```

Review checklist:
- [ ] Read each rationale.md
- [ ] Test the implementations
- [ ] Compare API designs
- [ ] Check code quality
- [ ] Assess trade-offs

### 5.2 Create Decision Record

```bash
# Copy template
cp .taskmaster/infinite/templates/decision-record-template.md \
   .taskmaster/infinite/decisions/task-07-decision.md

# Fill out your decisions
$EDITOR .taskmaster/infinite/decisions/task-07-decision.md
```

Be specific about:
- Which parts from which implementation
- Exact synthesis instructions
- Conflict resolution rules

## Phase 6: Synthesis

### 6.1 Prepare Synthesis Agent Prompt

Create `.taskmaster/infinite/synthesis-prompt.md`:

```markdown
You are the Synthesis Agent for Task 07: Layout Components.

## Inputs Provided:
1. Decision Record: `./decisions/task-07-decision.md`
2. Interface Contract: `./contracts/task-07-contract.yaml`
3. Selected Implementations:
   - `./outputs/task-07/agent-01-pragmatist/`
   - `./outputs/task-07/agent-02-api-designer/`
   - `./outputs/task-07/agent-03-a11y/`

## Your Task:
Execute the synthesis directives in the Decision Record precisely.
Create a single, cohesive implementation that combines the best parts.

## Output Location:
Create your synthesized implementation in:
`./outputs/task-07/synthesized/`

Include:
- Complete source code
- Comprehensive tests
- Documentation
- synthesis-report.md explaining what you did
```

### 6.2 Run Synthesis

Using Claude or your preferred AI:

```bash
# Provide the synthesis prompt and all required files
# The AI will create the final synthesized implementation
```

### 6.3 Validate Synthesis

```bash
# Run the same scoring on synthesized version
node .taskmaster/infinite/score-implementations.js \
  .taskmaster/infinite/contracts/task-07-contract.yaml \
  .taskmaster/infinite/outputs/task-07/synthesized

# Run all tests
cd .taskmaster/infinite/outputs/task-07/synthesized
pnpm test

# Check contract compliance
pnpm run validate-contract
```

## Phase 7: Integration

### 7.1 Final Review

```bash
# Open synthesized implementation
code .taskmaster/infinite/outputs/task-07/synthesized

# Review checklist:
# - [ ] All tests pass
# - [ ] Matches interface contract
# - [ ] Follows project conventions
# - [ ] Documentation complete
```

### 7.2 Copy to Project

```bash
# Copy to actual project location
cp -r .taskmaster/infinite/outputs/task-07/synthesized/src/* \
      packages/web/src/components/layout/

# Copy tests
cp -r .taskmaster/infinite/outputs/task-07/synthesized/tests/* \
      packages/web/src/components/layout/__tests__/
```

### 7.3 Update TaskMaster

```bash
# Mark task as complete
taskmaster set-status 7 done

# Add implementation notes
taskmaster update-task 7 \
  "Implemented using TaskMaster Infinite System. \
   See decision record: .taskmaster/infinite/decisions/task-07-decision.md"
```

## Phase 8: Documentation & Learning

### 8.1 Extract Patterns

```bash
# Create pattern documentation
cat > docs/patterns/layout-component-pattern.md << EOF
# Layout Component Pattern

Discovered through TaskMaster Infinite System - Task 07

## Pattern: Compound Components with Accessible APIs

### Context
When building layout components that need to be both flexible and accessible.

### Solution
[Extract key patterns from synthesized solution]

### Example
[Code example from synthesized implementation]

### Trade-offs
[Document trade-offs discovered during review]
EOF
```

### 8.2 Update Pattern Library

Add successful patterns to your shared documentation for future reuse.

## Automation Opportunities

### Create a Makefile

```makefile
# .taskmaster/infinite/Makefile

TASK_ID ?= 
ITERATION_COUNT ?= 5
INNOVATION_LEVEL ?= standard

.PHONY: prepare run score review synthesize integrate

prepare:
	@echo "Preparing task $(TASK_ID)..."
	@mkdir -p specs outputs/task-$(TASK_ID) decisions contracts

run:
	@echo "Running infinite generation..."
	./run-infinite.sh \
		specs/task-$(TASK_ID).md \
		outputs/task-$(TASK_ID) \
		$(ITERATION_COUNT) \
		$(INNOVATION_LEVEL)

score:
	@echo "Scoring implementations..."
	@node score-implementations.js \
		contracts/task-$(TASK_ID)-contract.yaml \
		outputs/task-$(TASK_ID)

review:
	@echo "Opening top candidates for review..."
	@code outputs/task-$(TASK_ID)

synthesize:
	@echo "Ready for synthesis. Decision record:"
	@cat decisions/task-$(TASK_ID)-decision.md

all: prepare run score review

# Usage: make all TASK_ID=07
```

## Best Practices

1. **Start Small**: Begin with a simple component to learn the workflow
2. **Refine Prompts**: Iterate on your innovation directives based on results
3. **Document Everything**: The value is in the patterns you discover
4. **Automate Gradually**: Add automation as you identify repetitive steps
5. **Share Learnings**: Update team docs with discovered patterns

## Troubleshooting

### Common Issues

1. **Agents producing similar implementations**
   - Solution: Make innovation directives more distinct and orthogonal

2. **Scoring doesn't reflect quality**
   - Solution: Adjust scoring weights or add custom metrics

3. **Synthesis is difficult**
   - Solution: Be more specific in Decision Record instructions

4. **Too much to review**
   - Solution: Reduce iteration count or increase filtering threshold

## Next Steps

1. Run through one complete task end-to-end
2. Refine the process based on learnings
3. Create team training materials
4. Build more automation for common tasks
5. Integrate with CI/CD pipeline

Remember: The goal is not just to generate code, but to systematically explore the solution space and build a library of proven patterns.