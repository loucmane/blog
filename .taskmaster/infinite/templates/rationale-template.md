# Agent Rationale Template

Each agent MUST produce this document alongside their implementation to explain their decision-making process.

---

# Implementation Rationale: `agent-[ID]-[specialization]`

**Agent ID**: `agent-[XX]-[descriptive-name]`  
**Specialization**: [e.g., "Performance Optimization", "Accessibility Champion", "Developer Experience"]  
**Task**: [Task ID and Name]  
**Generated**: [Timestamp]

## 1. Directive Interpretation

### Original Directive
[Quote the exact directive given to this agent]

### My Understanding
[2-3 paragraphs explaining how you interpreted the directive, what you prioritized, and why]

### Target User Profile
- **Primary User**: [Who am I optimizing for?]
- **Their Main Challenge**: [What problem am I solving?]
- **Success Criteria**: [What does success look like for them?]

---

## 2. Architectural Decisions

### Core Approach
[Describe your fundamental approach in 1 paragraph]

### Key Design Patterns Used

| Pattern | Why Chosen | Trade-offs |
|---------|------------|------------|
| [Pattern 1] | [Reasoning] | [What we gain vs lose] |
| [Pattern 2] | [Reasoning] | [What we gain vs lose] |
| [Pattern 3] | [Reasoning] | [What we gain vs lose] |

### Technology Stack Decisions

```yaml
styling:
  choice: "[CSS Modules | Styled Components | Tailwind | etc]"
  reasoning: "[Why this fits the directive]"
  alternatives_considered: ["Option 1", "Option 2"]

state_management:
  choice: "[Context | Redux | Zustand | etc]"
  reasoning: "[Why this fits the directive]"
  alternatives_considered: ["Option 1", "Option 2"]

# Continue for other technology choices...
```

---

## 3. Implementation Highlights

### Innovation 1: [Name]
**What**: [Brief description]  
**Why**: [How this serves the directive]  
**Code Example**:
```typescript
// Key code snippet showing the innovation
```

### Innovation 2: [Name]
**What**: [Brief description]  
**Why**: [How this serves the directive]  
**Code Example**:
```typescript
// Key code snippet showing the innovation
```

### Innovation 3: [Name]
[Continue pattern...]

---

## 4. Trade-offs Analysis

### What I Optimized For
1. **[Aspect 1]**: [Specific optimizations made]
2. **[Aspect 2]**: [Specific optimizations made]
3. **[Aspect 3]**: [Specific optimizations made]

### What I Sacrificed
1. **[Aspect 1]**: [What was deprioritized and why]
2. **[Aspect 2]**: [What was deprioritized and why]
3. **[Aspect 3]**: [What was deprioritized and why]

### Decision Matrix

| Decision | Options Considered | Choice | Reasoning |
|----------|-------------------|---------|-----------|
| [API Design] | Option A, B, C | Option B | [Why B over A and C] |
| [Performance] | Option X, Y, Z | Option X | [Why X over Y and Z] |
| [Structure] | Option 1, 2, 3 | Option 3 | [Why 3 over 1 and 2] |

---

## 5. Compliance Self-Assessment

### Interface Contract Compliance

| Contract Section | Compliance | Notes |
|-----------------|------------|--------|
| Functional | ✅ 100% | All props and methods implemented as specified |
| Behavioral | ✅ 95% | Minor deviation in [X] due to [reason] |
| Visual | ✅ 100% | Strict adherence to theme variables |
| Accessibility | ⚠️ 90% | Need review on [specific aspect] |
| Performance | ✅ 100% | Exceeds all benchmarks |

### TWES Standards Compliance

- **Theme System**: ✅ Used only CSS variables
- **Performance**: ✅ Lighthouse score: 96
- **Accessibility**: ✅ WCAG AA compliant
- **Code Standards**: ✅ ESLint clean
- **Documentation**: ✅ Comprehensive JSDoc

### Known Gaps
1. **[Gap 1]**: [Description and potential fix]
2. **[Gap 2]**: [Description and potential fix]

---

## 6. Performance Characteristics

### Metrics
```yaml
bundle_size:
  raw: "12.3kb"
  gzipped: "4.1kb"
  tree_shakeable: true

runtime_performance:
  initial_render: "23ms"
  re_render: "8ms"
  memory_footprint: "2.1mb"

lighthouse_scores:
  performance: 96
  accessibility: 100
  best_practices: 95
  seo: 100
```

### Optimization Techniques
1. **[Technique 1]**: [How it improves performance]
2. **[Technique 2]**: [How it improves performance]
3. **[Technique 3]**: [How it improves performance]

---

## 7. Developer Experience

### API Design Philosophy
[Explain your approach to making the component pleasant to use]

### Usage Example
```typescript
// Show the simplest, most common use case
<MyComponent
  prop1="value"
  prop2={42}
  onEvent={handleEvent}
>
  Content
</MyComponent>
```

### Advanced Usage
```typescript
// Show a more complex but still realistic use case
```

### Common Pitfalls Prevented
1. **[Pitfall 1]**: Prevented by [design choice]
2. **[Pitfall 2]**: Prevented by [design choice]

---

## 8. Testing Strategy

### Test Coverage
- **Unit Tests**: 92% coverage
- **Integration Tests**: All user flows covered
- **Visual Tests**: Snapshot tests for all states
- **Accessibility Tests**: Automated + manual testing

### Key Test Scenarios
1. **[Scenario 1]**: [What it validates]
2. **[Scenario 2]**: [What it validates]
3. **[Scenario 3]**: [What it validates]

---

## 9. Future Considerations

### Extension Points
1. **[Extension 1]**: How to add [feature] in the future
2. **[Extension 2]**: How to add [feature] in the future

### Potential Optimizations
1. **[Optimization 1]**: Could improve [aspect] by [approach]
2. **[Optimization 2]**: Could improve [aspect] by [approach]

### Migration Path
If replacing existing component:
- **Breaking Changes**: [List any]
- **Migration Strategy**: [Step by step]
- **Codemod Available**: [Yes/No]

---

## 10. Unique Value Proposition

### What Makes This Implementation Special
[1-2 paragraphs on what unique value this implementation brings compared to traditional approaches]

### Best Suited For
- ✅ [Use case 1]
- ✅ [Use case 2]
- ✅ [Use case 3]

### Not Recommended For
- ❌ [Use case 1]
- ❌ [Use case 2]

---

## 11. Code Quality Metrics

```yaml
complexity:
  cyclomatic: 3.2  # Average per function
  cognitive: 8.5   # Average cognitive complexity

maintainability:
  index: 84       # Maintainability index
  duplication: 2%  # Code duplication percentage

dependencies:
  production: 3    # Number of prod dependencies
  development: 12  # Number of dev dependencies
  total_size: "45kb"
```

---

## 12. Lessons Learned

### What Worked Well
1. **[Approach 1]**: [Why it was effective]
2. **[Approach 2]**: [Why it was effective]

### What Was Challenging
1. **[Challenge 1]**: [How I addressed it]
2. **[Challenge 2]**: [How I addressed it]

### Recommendations for Future Implementations
1. **[Recommendation 1]**: [Based on this experience]
2. **[Recommendation 2]**: [Based on this experience]

---

## Appendix: Key Code Sections

### A. Core Algorithm
```typescript
// The heart of the implementation
```

### B. Type Definitions
```typescript
// Key interfaces and types
```

### C. Performance Optimizations
```typescript
// Critical performance code
```

---

**End of Rationale Document**

*This document is part of the TaskMaster Infinite System output and should be reviewed alongside the implementation code.*