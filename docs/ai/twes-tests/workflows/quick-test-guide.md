# Quick Test Guide

## Running a TWES Test in 5 Minutes

### 1. Choose Your Scenario
```bash
# List available scenarios
ls /docs/ai/twes-tests/scenarios/

# Pick one, e.g.:
cat /docs/ai/twes-tests/scenarios/task-04-shadcn-installation.md
```

### 2. Copy the Test Prompt
Find the "Test Prompt" section in your chosen scenario and copy it.

### 3. Run the Test
```bash
# Use Multi-AI Collaboration
mcp__multi-ai-collab__gemini_think_deep --topic "[PASTE TEST PROMPT]"
```

### 4. Analyze Results
Look for:
- Confidence score (target varies by scenario type)
- Which documents were consulted
- What gaps were identified
- Quality of proposed approach

### 5. Document Results
Create a result file:
```bash
# Template: results/YYYY-MM-DD-scenario-name.md
touch /docs/ai/twes-tests/results/2025-06-11-emergency-appeal.md
```

## Quick Commands

### Run Standard Test
```bash
# For Task 4 scenario
mcp__multi-ai-collab__gemini_think_deep --topic "$(cat /docs/ai/twes-tests/scenarios/task-04-shadcn-installation.md | sed -n '/^You are testing/,/^```$/p' | sed '1d;$d')"
```

### Check Recent Results
```bash
# View all confidence scores
grep -h "Confidence Score" /docs/ai/twes-tests/results/*.md

# Find common gaps
grep -h "Gap:" /docs/ai/twes-tests/results/*.md | sort | uniq -c
```

### Create New Scenario
```bash
# Copy template
cp /docs/ai/twes-tests/workflows/scenario-template.md \
   /docs/ai/twes-tests/scenarios/new-scenario.md
```

## Evaluation Checklist

When reviewing results, check:

- [ ] **Document Usage**: Did it find the right docs?
- [ ] **Decision Quality**: Are decisions aligned with our principles?
- [ ] **Gap Detection**: Are the gaps real and actionable?
- [ ] **Confidence Level**: Is it appropriate for the task complexity?
- [ ] **Approach Clarity**: Could a developer follow this plan?

## Common Patterns in Results

### Good Signs ✅
- Consults philosophy docs before technical docs
- Identifies specific token/variable mappings needed
- Shows awareness of user context (connectivity, emotion)
- Suggests incremental/iterative approach
- Confidence between 75-90% (realistic)

### Warning Signs ⚠️
- Skips philosophy/principles documentation
- Makes assumptions without checking docs
- Over-confident (95%+) without justification
- Misses obvious documentation needs
- Ignores accessibility or performance

## Quick Fixes for Common Gaps

### Gap: "Token mapping unclear"
→ Create explicit mapping document

### Gap: "Tooling not specified"
→ Add tools section to relevant standard

### Gap: "Missing pattern"
→ Extract from common-patterns.md or create new

### Gap: "Process unclear"
→ Add to workflow documentation

## Tips for Effective Testing

1. **Test Early**: Before implementing features
2. **Test Often**: After documentation updates
3. **Test Variety**: Different scenario types
4. **Test Reality**: Based on actual tasks
5. **Test Iteratively**: Re-test after fixes