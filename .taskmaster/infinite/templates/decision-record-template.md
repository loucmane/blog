# Decision Record Template

This template is used by human reviewers after the automated scoring phase to document their selection decisions and provide clear directives to the Synthesis Agent.

---

# Decision Record: [Task ID] - [Task Name]

**Reviewer**: [Your Name/GitHub Handle]  
**Date**: [YYYY-MM-DD]  
**Review Duration**: [Time spent reviewing]  
**Task Goal**: [One-sentence summary of what we're trying to achieve]

## Executive Summary

[2-3 sentences explaining the overall decision and why this combination was chosen]

---

## Candidates Reviewed

### Top Candidates (from automated scoring)

| Rank | Candidate ID | Total Score | Strengths | Weaknesses |
|------|--------------|-------------|-----------|------------|
| 1 | `agent-XX-name` | XX.X | [Key strengths] | [Main weaknesses] |
| 2 | `agent-XX-name` | XX.X | [Key strengths] | [Main weaknesses] |
| 3 | `agent-XX-name` | XX.X | [Key strengths] | [Main weaknesses] |

### Deep Dive Analysis

[Provide 2-3 paragraphs analyzing the trade-offs between the top candidates. What makes each unique? What specific problems does each solve well?]

---

## Selected Candidates for Synthesis

### Primary Selection

| Candidate ID | Component/Aspect | Rationale for Selection |
|--------------|------------------|-------------------------|
| `agent-02-api` | API Design & Props Interface | Most intuitive prop names, follows React conventions, self-documenting |
| `agent-03-a11y` | Accessibility Implementation | Complete ARIA support, keyboard navigation, screen reader optimized |
| `agent-01-perf` | Core Algorithm & Performance | Smallest runtime overhead, efficient re-render logic, tree-shakeable |

### Secondary Elements

| Candidate ID | Specific Feature | Why Include |
|--------------|------------------|-------------|
| `agent-05-docs` | JSDoc Comments | Most comprehensive inline documentation |
| `agent-04-test` | Test Patterns | Best test structure and coverage approach |

---

## Synthesis Directives

### For the Synthesis Agent

**Primary Objective**: Create a unified implementation that combines the selected best features while maintaining consistency and eliminating redundancy.

**Detailed Instructions**:

1. **Foundation & Structure**
   - Start with the file/folder structure from: `agent-02-api`
   - Reason: Clean separation of concerns, intuitive organization

2. **Public API Surface**
   - Use the complete props interface from: `agent-02-api`
   - Include TypeScript types exactly as defined
   - Preserve the prop names and their defaults
   - Critical: This is our contract with users, must match exactly

3. **Core Implementation**
   - Replace the internal logic with the algorithm from: `agent-01-perf`
   - Specifically use their approach to: [specific technique/pattern]
   - Maintain their optimization for: [specific performance aspect]

4. **Accessibility Layer**
   - Integrate ALL accessibility features from: `agent-03-a11y`
   - This includes:
     - ARIA attributes and roles
     - Keyboard event handlers
     - Focus management logic
     - Screen reader announcements
   - Where conflicts arise, accessibility takes precedence

5. **Documentation**
   - Use JSDoc structure from: `agent-05-docs`
   - Combine with examples from: `agent-02-api`
   - Ensure every public prop/method is documented

6. **Testing Approach**
   - Adopt test file structure from: `agent-04-test`
   - But use test cases that cover all features from synthesis

### Specific Merging Instructions

```typescript
// Example of specific merging directive
// FROM agent-02-api: Keep this exact prop interface
interface StackProps {
  gap?: SpacingToken;
  direction?: 'horizontal' | 'vertical';
  // ... etc
}

// FROM agent-01-perf: Use this optimization technique
const memoizedLayout = useMemo(() => 
  calculateLayout(children, gap, direction),
  [children, gap, direction]
);

// FROM agent-03-a11y: Add these ARIA attributes
<div
  role={role}
  aria-orientation={direction === 'horizontal' ? 'horizontal' : 'vertical'}
  // ... etc
>
```

### Conflict Resolution

When the selected implementations conflict:

1. **API Conflicts**: Always prefer `agent-02-api` (our chosen interface)
2. **Performance vs Accessibility**: Find a solution that maintains both
3. **Code Style**: Normalize to our project's ESLint/Prettier config
4. **Naming**: Use the most descriptive names from any source

### Quality Checklist for Synthesis

The final synthesized code MUST:
- [ ] Pass all test cases from the Interface Contract
- [ ] Maintain the performance benchmarks from `agent-01-perf`
- [ ] Include all accessibility features from `agent-03-a11y`
- [ ] Use the exact public API from `agent-02-api`
- [ ] Have zero ESLint errors
- [ ] Include comprehensive documentation
- [ ] Be tree-shakeable and side-effect free

---

## Rejected Concepts & Learnings

### Rejected Candidates

| Candidate ID | Rejection Reason | Key Learning |
|--------------|------------------|--------------|
| `agent-04-complex` | Over-engineered, 3x larger bundle | Simplicity > Cleverness |
| `agent-06-novel` | Innovative but poor DX | Innovation must serve users |
| `agent-07-pure-fn` | Too rigid, lacks flexibility | Pragmatism > Purity |

### Patterns to Avoid

Based on this review, future implementations should avoid:
1. **[Anti-pattern 1]**: [Why it's problematic]
2. **[Anti-pattern 2]**: [Why it's problematic]
3. **[Anti-pattern 3]**: [Why it's problematic]

### Patterns to Promote

Successful patterns we should document and reuse:
1. **[Pattern 1]**: [Why it works well] - seen in `agent-XX`
2. **[Pattern 2]**: [Why it works well] - seen in `agent-XX`
3. **[Pattern 3]**: [Why it works well] - seen in `agent-XX`

---

## Post-Synthesis Review Notes

[To be filled after synthesis]

- [ ] Synthesis completed successfully
- [ ] All directives were followed
- [ ] Final code passes all contracts
- [ ] Ready for integration

### Deviations from Plan

[Document any necessary deviations from the synthesis plan and why they were needed]

### Final Observations

[Any final thoughts on the process, the quality of the synthesis, or improvements for next time]

---

## Metrics for Success

Track these after deployment:

- [ ] Bundle size within 5% of `agent-01-perf`
- [ ] Accessibility audit score: 100
- [ ] Developer satisfaction survey > 4/5
- [ ] Zero regression in existing tests
- [ ] Performance benchmarks maintained

---

## Approval

**Technical Reviewer**: ___________________ Date: ___________

**Product Owner**: ___________________ Date: ___________

**Accessibility Reviewer**: ___________________ Date: ___________