---
id: optimize-code
name: Optimize Code
role: trigger
domain: development
stability: stable
triggers:
  - "optimize X"
  - "improve performance"
  - "make Y faster"
  - "speed up Z"
dependencies: []
tools:
  - Read
  - Edit
  - Grep
version: 1.0.0
---

#### Handler: optimize-code {#optimize-code}
**Triggers**: "optimize X", "improve performance", "make Y faster", "speed up Z"
**Target Pattern**: Code or feature to optimize
**Pre-conditions**: 
- Performance issue identified
- Can measure current performance
**Process**:
1. Identify performance bottlenecks:
   - Time complexity analysis
   - Space complexity review
   - Database query patterns
   - Rendering performance
2. Measure baseline if possible
3. Suggest optimizations:
   - Algorithm improvements
   - Caching strategies
   - Query optimization
   - Lazy loading
   - Memoization
4. Implement changes incrementally
5. Verify improvements
**Success**: Measurable performance gain
**Failure**: Premature optimization
**Examples**:
- "optimize the search" → Search algorithm improvements
- "make dashboard faster" → Rendering optimizations
- "improve API performance" → Query and caching strategies