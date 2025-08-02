---
id: code-review
name: Code Review
role: trigger
domain: development
stability: stable
triggers:
  - "review my changes"
  - "check this code"
  - "review PR"
  - "code review for X"
dependencies:
  - code-review-template
tools:
  - Read
  - Grep
version: 1.0.0
---

#### Handler: code-review {#code-review}
**Triggers**: "review my changes", "check this code", "review PR", "code review for X"
**Target Pattern**: Code to review (changes, PR, specific files)
**Pre-conditions**: 
- Code changes exist
- Can access changed files
**Process**:
1. Identify scope of review:
   - Git changes: use git diff
   - Specific files: read with line numbers
   - PR: check all changed files
2. Route to code-review-template:
   ```yaml
   STATE: "I need to review: [scope description]"
   USE: Load WORKFLOWS.md#code-review-template
   FOLLOW: Systematic review checklist
   ```
3. Check for:
   - Logic errors and edge cases
   - Performance issues
   - Security concerns
   - Code style and patterns
   - Test coverage
4. Provide actionable feedback
**Success**: Comprehensive review with specific suggestions
**Failure**: Generic feedback without specifics
**Examples**:
- "review my auth changes" → Git diff review
- "check this component" → File-specific review
- "review PR #123" → Full PR review