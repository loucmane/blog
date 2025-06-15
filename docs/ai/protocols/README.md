# TWES Protocols Directory

## Overview
This directory contains step-by-step workflows and protocols for common development tasks using the Total Workflow Excellence System (TWES).

## Available Protocols

### 🧪 [TWES Testing Protocol](./twes-testing-protocol.md)
Validate TWES documentation effectiveness by simulating real development tasks with AI collaborators.
- Test scenario creation
- Execution workflow
- Result analysis
- Gap identification

### 🚀 [Component Development Protocol](./component-development-protocol.md) *(Coming Soon)*
Step-by-step guide for creating new components aligned with TWES principles.

### 🔄 [PR Review Protocol](./pr-review-protocol.md) *(Coming Soon)*
Checklist for reviewing pull requests against TWES standards.

### 📊 [Performance Optimization Protocol](./performance-optimization-protocol.md) *(Coming Soon)*
Systematic approach to improving application performance.

### 🌍 [Accessibility Audit Protocol](./accessibility-audit-protocol.md) *(Coming Soon)*
Comprehensive accessibility testing workflow.

## Quick Reference

### Running a TWES Test
```bash
# 1. Choose scenario
cat /docs/ai/twes-tests/scenarios/task-04-shadcn-installation.md

# 2. Run test
mcp__multi-ai-collab__gemini_think_deep --topic "[TEST PROMPT]"

# 3. Document results
vi /docs/ai/twes-tests/results/YYYY-MM-DD-scenario.md
```

### Creating New Protocols
1. Use consistent structure
2. Include concrete examples
3. Reference relevant TWES documents
4. Add success criteria
5. Include troubleshooting section

## Protocol Template

```markdown
# [Protocol Name]

## Purpose
[What this protocol helps accomplish]

## Prerequisites
- [ ] [Required knowledge/setup]
- [ ] [Required tools]

## Steps
### Step 1: [Action]
[Detailed instructions]
[Example commands/code]

### Step 2: [Action]
[Continue...]

## Success Criteria
- [ ] [Measurable outcome]
- [ ] [Quality check]

## Troubleshooting
### Issue: [Common problem]
Solution: [How to fix]

## Related Documents
- [Link to relevant TWES doc]
- [Link to example]
```

## Contributing
When adding new protocols:
1. Follow the template structure
2. Test the protocol yourself first
3. Get review from team member
4. Update this README