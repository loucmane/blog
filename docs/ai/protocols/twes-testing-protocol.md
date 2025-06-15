# TWES Testing Protocol

## Purpose
Validate the effectiveness of TWES documentation by simulating real development tasks with AI collaborators.

## Testing Workflow

### 1. Pre-Test Setup
```bash
# Navigate to TWES tests directory
cd docs/ai/twes-tests/

# Review available scenarios
ls scenarios/

# Select a scenario for testing
cat scenarios/[scenario-name].md
```

### 2. Test Execution Steps

#### Step 1: Define Scenario
Create a scenario file with:
- Task description
- Expected outcomes
- Success criteria
- Documentation that should be consulted

#### Step 2: Engage AI Collaborator
```markdown
# Standard Test Prompt Template
You are testing the TWES documentation system. Please simulate (NOT implement) how you would approach [TASK].

**Task**: [Full task description]
**Location**: [Where in codebase]
**Dependencies**: [Prerequisite tasks]

TWES documents available at /docs/ai/:
[List relevant documents]

Your goal:
1. List which TWES docs you'd consult and why
2. Explain key decisions based on those docs
3. Identify any missing information
4. Describe implementation approach
5. Rate confidence level (0-100%)

DO NOT implement anything - just describe your approach.
```

#### Step 3: Analyze Results
1. Document confidence score
2. List identified gaps
3. Note successful documentation usage
4. Record any confusion points

#### Step 4: Create Action Items
Based on test results:
- Missing documents to create
- Existing documents to enhance
- New patterns to document
- Process improvements needed

### 3. Result Documentation

Save results in `results/[date]-[scenario].md`:
```markdown
# TWES Test Result: [Scenario Name]
**Date**: [YYYY-MM-DD]
**Tester**: [AI Model Used]
**Scenario**: [Link to scenario file]

## Summary
- **Confidence Score**: X%
- **Success Rate**: X/Y tasks understood correctly
- **Critical Gaps**: [Number] identified

## What Worked Well
1. [Success point]
2. [Success point]

## Gaps Identified
1. **[Gap Name]**
   - Impact: [High/Medium/Low]
   - Fix: [Proposed solution]

## Action Items
- [ ] Create [document]
- [ ] Update [document]
- [ ] Add section on [topic]
```

### 4. Continuous Improvement

#### Weekly Review
- Review all test results
- Prioritize gap fixes
- Update success metrics

#### Monthly Analysis
- Track confidence score trends
- Measure documentation completeness
- Adjust testing scenarios

## Test Scenarios Library

### Basic Scenarios
1. **Component Installation** - Test understanding of package structure
2. **Theme Implementation** - Test design system comprehension
3. **Performance Optimization** - Test standard application
4. **Accessibility Compliance** - Test WCAG understanding

### Advanced Scenarios
1. **Emergency Feature** - Test crisis response understanding
2. **Conflicting Requirements** - Test decision-making process
3. **New Pattern Creation** - Test contribution workflow
4. **Multi-Package Feature** - Test monorepo understanding

### Edge Cases
1. **Missing Documentation** - Test inference abilities
2. **Contradictory Guidance** - Test conflict resolution
3. **Novel Requirements** - Test principle application

## Success Metrics

### Target Thresholds
- **Basic Tasks**: >95% confidence
- **Advanced Tasks**: >85% confidence
- **Edge Cases**: >70% confidence
- **Overall Average**: >85% confidence

### Tracking Template
```yaml
test_id: TWES-2025-001
scenario: component_installation
confidence: 85
gaps_found: 3
time_to_clarity: 5min
documentation_used:
  - warm-minimalism.md
  - monorepo-structure.md
  - performance.md
```

## Integration with Development

### When to Run Tests
1. Before major documentation updates
2. After adding new patterns/standards
3. When onboarding new team members
4. During sprint retrospectives

### Who Should Run Tests
- Documentation maintainers
- New team members (real-world validation)
- AI assistants (systematic validation)
- External contributors (fresh perspective)

## Quick Commands

```bash
# Run a standard test
mcp__multi-ai-collab__gemini_think_deep --topic "$(cat scenarios/[scenario].md)"

# Analyze recent results
grep "Confidence Score" results/*.md | awk '{sum+=$NF; count++} END {print "Average:", sum/count"%"}'

# Find common gaps
grep -h "Gap:" results/*.md | sort | uniq -c | sort -nr
```