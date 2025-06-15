# Test Scenario Template

## Scenario: [Name]
**ID**: TWES-[YYYY]-[###]
**Type**: [Basic/Advanced/Edge Case]
**Priority**: [High/Medium/Low]

## Task Description
[Detailed description of what needs to be accomplished]

### Context
- **Location**: [Where in codebase]
- **Dependencies**: [Prerequisite tasks/knowledge]
- **User Story**: As a [role], I want to [action] so that [benefit]

## Expected Outcomes
1. [Specific deliverable]
2. [Specific deliverable]
3. [Specific deliverable]

## Success Criteria
- [ ] Identifies correct TWES documents to consult
- [ ] Makes appropriate decisions based on documentation
- [ ] Follows established patterns and standards
- [ ] Achieves confidence score >X%
- [ ] [Custom criteria specific to scenario]

## TWES Documents Expected to be Used
- Primary:
  - [ ] [Document path]
  - [ ] [Document path]
- Secondary:
  - [ ] [Document path]
  - [ ] [Document path]
- Nice to have:
  - [ ] [Document path]

## Known Challenges
- [Potential ambiguity or gap]
- [Complex decision point]

## Test Prompt
```markdown
You are testing the TWES documentation system. Please simulate (NOT implement) how you would approach [SCENARIO NAME].

**Task**: [Paste task description]
**Location**: [Paste location]
**Dependencies**: [Paste dependencies]

TWES documents available at /docs/ai/:
[List all relevant documents]

Your goal:
1. List which TWES docs you'd consult and why
2. Explain key decisions based on those docs
3. Identify any missing information
4. Describe implementation approach
5. Rate confidence level (0-100%)

DO NOT implement anything - just describe your approach.
```

## Evaluation Rubric

### Documentation Usage (40 points)
- Consults all primary documents: 20 points
- Consults relevant secondary documents: 10 points
- Explains why each document is needed: 10 points

### Decision Making (30 points)
- Makes correct technical decisions: 15 points
- Aligns with project philosophy: 10 points
- Considers edge cases: 5 points

### Gap Identification (20 points)
- Identifies actual documentation gaps: 15 points
- Suggests reasonable workarounds: 5 points

### Confidence & Clarity (10 points)
- Provides clear confidence score: 5 points
- Explains confidence reasoning: 5 points

## Notes
[Any additional context or special considerations for this scenario]